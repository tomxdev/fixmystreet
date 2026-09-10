package FixMyStreet::Cobrand::Catanduva;
use base 'FixMyStreet::Cobrand::Default';

use strict;
use warnings;
use utf8;

use FixMyStreet::Geocode;

=encoding utf-8

=cut

sub site_key { 'catanduva' }

sub country { 'BR' }

sub languages { [ 'pt-br,Português,pt_BR' ] }
sub language_override { 'pt-br' }

=head2 area_types

Cobrands outside the UK have to name their own MapIt types: C<Cobrand::Default>
falls back to the global C<MAPIT_TYPES>, which ships as C<ZZZ>, and
C<Cobrand::UK> hardcodes the British ones. FiksGataMi does the same for Norway.
Without this, no Brazilian area ever matches and the reporting form finds no
body at all.

C<O08> is admin_level 8 in the OpenStreetMap-derived global MapIt, which is
where Brazilian municipalities live. Revisit alongside INF-002, when the
homologation environment settles which MapIt instance it points at.

=cut

sub area_types { [ 'O08' ] }

# The pt_BR catalogue already renders this msgid as "Especifique um CEP, Nome de
# Rua ou Bairro", so reuse it rather than introduce a string no catalogue has.
# The wording itself is UX-001's to revise.
sub enter_postcode_text { _('Enter a nearby postcode, or street name and area') }

# Bounding box of the municipality of Catanduva/SP, as [ north, west, south,
# east ]. Keeps the geocoder from answering with same-named streets elsewhere in
# Brazil - "Rua São Paulo" exists in a great many cities.
sub disambiguate_location {
    my $self = shift;

    return {
        %{ $self->SUPER::disambiguate_location() },
        country => 'br',
        lang => 'pt-BR',
        bounds => [ '-21.0500', '-49.0700', '-21.2400', '-48.8600' ],
    };
}

sub geocoded_string_check {
    my ($self, $s) = @_;

    return 1 if $s =~ /Brasil|Brazil/i;

    return 0;
}

# The pilot has no partnership with the city hall, so nobody is committed to
# fixing anything. Asking a reporter four weeks later whether their problem was
# resolved would be asking a question we cannot act on. Restore the default once
# reports are actually being sent somewhere.
sub send_questionnaires { 0 }

sub suggest_duplicates { 1 }

=head2 CEP

C<problem.postcode> is C<NOT NULL> and was modelled on the British postcode: the
column is filled from C<$params{pc}>, which is whatever went into the location
search box. In the UK that is usually a postcode. Here the box invites "um CEP
próximo, ou o nome da rua e o bairro", so the column happily stores "Rua São
Paulo, Centro" - and stores nothing at all when the reporter drops the pin
straight onto the map, which is what broke the very first report with a
constraint violation.

So this is not only about filling the gap. It is about keeping anything that is
not a CEP out of the column.

=cut

# Five digits, optional hyphen, three digits. Accepts either form on the way in
# and always returns the hyphenated one, so the column does not end up holding
# both spellings of the same CEP.
sub normalise_cep {
    my ($self, $value) = @_;

    return '' unless defined $value;
    return '' unless $value =~ /^\s*(\d{5})-?(\d{3})\s*$/;

    return "$1-$2";
}

=head2 cep_from_pin

The CEP of the point marked on the map, by reverse geocoding, or the empty
string when the service cannot answer.

Falls back to the stashed coordinates so the form template can call it with no
arguments while the report is still being filled in.

Never dies: a geocoder that is down, slow or unparseable must cost the reporter
an empty field, not a failed submission.

=cut

sub cep_from_pin {
    my ($self, $lat, $lon) = @_;

    if ( my $c = $self->{c} ) {
        $lat = $c->stash->{latitude}  unless defined $lat;
        $lon = $c->stash->{longitude} unless defined $lon;
    }

    return '' unless defined $lat && defined $lon;

    my $result = eval { FixMyStreet::Geocode::reverse($self, $lat, $lon) };
    return '' unless ref $result eq 'HASH';

    return $self->normalise_cep($result->{address}{postcode});
}

=head2 report_new_munge_before_insert

Settles C<problem.postcode> just before the row is written, when the coordinates
are already on the report.

Order of preference: what the reporter typed in the CEP field, then the CEP of
the pin, then the search box if it happens to hold a CEP, and failing all three
the empty string. We never store text that is not a CEP, and we never invent a
number to satisfy the constraint - an empty field is honest, a made-up CEP would
follow the report all the way to whoever eventually receives it.

=cut

sub report_new_munge_before_insert {
    my ($self, $report) = @_;

    # ||= short-circuits, so the geocoder is only called when the reporter left
    # the field alone.
    my $cep = $self->normalise_cep( $self->{c}->get_param('cep') );
    $cep ||= $self->cep_from_pin( $report->latitude, $report->longitude );
    $cep ||= $self->normalise_cep( $report->postcode );

    $report->postcode($cep);
}

1;
