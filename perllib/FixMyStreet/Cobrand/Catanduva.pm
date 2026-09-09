package FixMyStreet::Cobrand::Catanduva;
use base 'FixMyStreet::Cobrand::Default';

use strict;
use warnings;
use utf8;

sub site_key { 'catanduva' }

sub country { 'BR' }

sub languages { [ 'pt-br,Português,pt_BR' ] }
sub language_override { 'pt-br' }

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

1;
