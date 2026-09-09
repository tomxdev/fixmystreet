use FixMyStreet::TestMech;
use FixMyStreet::Cobrand::Catanduva;

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

done_testing();
