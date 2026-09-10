use FixMyStreet::TestMech;
use FixMyStreet::Cobrand::Catanduva;
use FixMyStreet::DB;
use Test::MockModule;

# report_new_munge_before_insert reads a form parameter and the stash, so the
# cobrand needs a context. Only these two things are ever asked of it.
package FakeContext {
    sub new { my ($class, %args) = @_; return bless { %args }, $class }
    sub get_param { my ($self, $name) = @_; return $self->{params}{$name} }
    sub stash { my $self = shift; return $self->{stash} ||= {} }
}

package main;

my $mech = FixMyStreet::TestMech->new;

subtest 'front page loads and is branded' => sub {
    ok $mech->host("catanduva.fixmystreet.com"), "change host to catanduva";
    FixMyStreet::override_config {
        ALLOWED_COBRANDS => [ 'catanduva' ],
    }, sub {
        $mech->get_ok('/');
        $mech->content_contains('FixMyStreet Catanduva');
    };
};

my $cobrand = FixMyStreet::Cobrand::Catanduva->new;

subtest 'localised to Brazil' => sub {
    is $cobrand->country, 'BR', 'country is Brazil';
    is $cobrand->language_override, 'pt-br', 'language forced to pt-br';
    is_deeply $cobrand->languages, [ 'pt-br,Português,pt_BR' ],
        'pt_BR locale offered';
};

subtest 'geocoder is confined to Catanduva' => sub {
    my $params = $cobrand->disambiguate_location;

    is $params->{country}, 'br', 'country hint sent to the geocoder';
    is $params->{lang}, 'pt-BR', 'language hint sent to the geocoder';

    my ($north, $west, $south, $east) = @{ $params->{bounds} };
    cmp_ok $north, '>', $south, 'north edge is above the south edge';
    cmp_ok $east, '>', $west, 'east edge is right of the west edge';

    # The centre of Catanduva must sit inside the box, or the bounds are wrong.
    my ($lat, $lon) = ('-21.1383', '-48.9736');
    cmp_ok $lat, '<', $north, 'city centre is south of the north edge';
    cmp_ok $lat, '>', $south, 'city centre is north of the south edge';
    cmp_ok $lon, '>', $west, 'city centre is east of the west edge';
    cmp_ok $lon, '<', $east, 'city centre is west of the east edge';
};

subtest 'only Brazilian geocoder results are accepted' => sub {
    ok $cobrand->geocoded_string_check('Rua São Paulo, Catanduva, Brasil'),
        'Brazilian result accepted';
    ok !$cobrand->geocoded_string_check('High Street, London, United Kingdom'),
        'result outside Brazil rejected';
};

subtest 'questionnaires are off while nobody receives reports' => sub {
    is $cobrand->send_questionnaires, 0, 'no "was this fixed?" survey sent';
};

# --------------------------------------------------------------------- UX-003

subtest 'a CEP is recognised and normalised, and nothing else gets through' => sub {
    is $cobrand->normalise_cep('15800-000'), '15800-000', 'hyphenated CEP kept as is';
    is $cobrand->normalise_cep('15800000'),  '15800-000', 'CEP without hyphen gains one';
    is $cobrand->normalise_cep(' 15800-000 '), '15800-000', 'surrounding space ignored';

    # The column used to accept whatever went into the location search box.
    is $cobrand->normalise_cep('Rua São Paulo, Centro'), '', 'a street name is not a CEP';
    is $cobrand->normalise_cep('Centro'),    '', 'a neighbourhood is not a CEP';
    is $cobrand->normalise_cep('1234'),      '', 'too short to be a CEP';
    is $cobrand->normalise_cep('158000000'), '', 'too long to be a CEP';
    is $cobrand->normalise_cep('SW1A 1AA'),  '', 'a British postcode is not a CEP';
    is $cobrand->normalise_cep(undef),       '', 'undef is not a CEP';
    is $cobrand->normalise_cep(''),          '', 'empty string is not a CEP';
};

subtest 'the CEP of the pin comes from reverse geocoding' => sub {
    my $osm = Test::MockModule->new('FixMyStreet::Geocode::OSM');

    $osm->mock(reverse_geocode => sub {
        return { address => { road => 'Rua São Paulo', postcode => '15800000' } };
    });
    is $cobrand->cep_from_pin('-21.1383', '-48.9736'), '15800-000',
        'CEP read from the geocoder and normalised';

    # Nominatim answers plenty of Brazilian points with no postcode at all.
    $osm->mock(reverse_geocode => sub { return { address => { road => 'Rua São Paulo' } } });
    is $cobrand->cep_from_pin('-21.1383', '-48.9736'), '',
        'no CEP in the answer means no CEP stored';

    $osm->mock(reverse_geocode => sub { return undef });
    is $cobrand->cep_from_pin('-21.1383', '-48.9736'), '',
        'geocoder returning nothing costs an empty field, not an error';

    # A geocoder that is down must not take the report down with it.
    $osm->mock(reverse_geocode => sub { die "connection timed out\n" });
    is $cobrand->cep_from_pin('-21.1383', '-48.9736'), '',
        'geocoder blowing up is swallowed';

    is $cobrand->cep_from_pin(undef, undef), '', 'no coordinates, no lookup';
};

subtest 'postcode column ends up holding a CEP, or nothing at all' => sub {
    my $osm = Test::MockModule->new('FixMyStreet::Geocode::OSM');
    $osm->mock(reverse_geocode => sub {
        return { address => { postcode => '15800-000' } };
    });

    my $report_at = sub {
        return FixMyStreet::DB->resultset('Problem')->new({
            latitude  => '-21.1383',
            longitude => '-48.9736',
            postcode  => shift,
        });
    };
    my $munge = sub {
        my ($params, $report) = @_;
        my $c = FakeContext->new(params => $params);
        FixMyStreet::Cobrand::Catanduva->new({ c => $c })
            ->report_new_munge_before_insert($report);
        return $report->postcode;
    };

    is $munge->({ cep => '15806-140' }, $report_at->('Rua São Paulo, Centro')),
        '15806-140', 'what the reporter typed wins over the pin';

    is $munge->({ cep => '15806140' }, $report_at->('')),
        '15806-140', 'typed CEP is normalised too';

    is $munge->({}, $report_at->('Rua São Paulo, Centro')),
        '15800-000', 'pin fills the field, and the street name is discarded';

    is $munge->({ cep => 'nao sei' }, $report_at->('')),
        '15800-000', 'unusable input falls through to the pin';

    # Reporter dropped the pin straight on the map: no search text at all. This
    # is the case that used to violate the NOT NULL constraint.
    my $report = $report_at->(undef);
    is $munge->({}, $report), '15800-000', 'a map click alone still yields a CEP';
    isnt $report->postcode, undef, 'postcode is never left NULL';
};

subtest 'the search box is only trusted when it really holds a CEP' => sub {
    my $osm = Test::MockModule->new('FixMyStreet::Geocode::OSM');
    $osm->mock(reverse_geocode => sub { return undef });   # geocoder no help

    my $build = sub {
        my $report = FixMyStreet::DB->resultset('Problem')->new({
            latitude => '-21.1383', longitude => '-48.9736', postcode => shift,
        });
        FixMyStreet::Cobrand::Catanduva->new({ c => FakeContext->new(params => {}) })
            ->report_new_munge_before_insert($report);
        return $report->postcode;
    };

    is $build->('15806-140'), '15806-140',
        'a CEP typed into the location search is kept';
    is $build->('Rua São Paulo, Centro'), '',
        'a street name in the search box is not promoted to CEP';
    is $build->(undef), '',
        'nothing anywhere leaves an empty string - honest, and satisfies NOT NULL';
};

done_testing();
