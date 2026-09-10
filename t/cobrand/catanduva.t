use FixMyStreet::TestMech;
use FixMyStreet::Cobrand::Catanduva;
use FixMyStreet::DB;
use FixMyStreet::Script::Inactive;
use Test::MockModule;
use DateTime;

# report_new_munge_before_insert reads a form parameter and the stash, and the
# photo rules ask who is looking. Only these things are ever asked of it.
package FakeContext {
    sub new { my ($class, %args) = @_; return bless { %args }, $class }
    sub get_param { my ($self, $name) = @_; return $self->{params}{$name} }
    sub stash { my $self = shift; return $self->{stash} ||= {} }
    sub user_exists { return defined $_[0]->{user} }
    sub user { return $_[0]->{user} }
}

# The photo rules are pure logic over a report's extra metadata, so a stand-in
# keeps these subtests off the database entirely.
package FakeProblem {
    sub new { my ($c, %a) = @_; return bless { extra => {}, updates => 0, %a }, $c }
    sub photo { return $_[0]->{photo} }
    sub get_extra_metadata { return $_[0]->{extra}{ $_[1] } }
    sub set_extra_metadata { $_[0]->{extra}{ $_[1] } = $_[2] }
    sub unset_extra_metadata { delete $_[0]->{extra}{ $_[1] } }
    sub update { $_[0]->{updates}++ }
}

package FakeUser {
    sub new { my ($c, %a) = @_; return bless {%a}, $c }
    sub can_moderate { return $_[0]->{can} }
}

# munge_sendreport_params only ever writes metadata back to the row.
package FakeRow {
    sub new { my ($c, %a) = @_; return bless { meta => {}, %a }, $c }
    sub update_extra_metadata { my ($s, %kv) = @_; @{ $s->{meta} }{ keys %kv } = values %kv }
    sub extra_metadata { return $_[0]->{meta}{ $_[1] } }
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

# --------------------------------------------------------------------- MOD-002

subtest 'a photo stays private until somebody has approved it' => sub {
    my $unapproved = FakeProblem->new(photo => 'abc');
    is $cobrand->allow_photo_display($unapproved), 0,
        'no approval, no photo';

    my $approved = FakeProblem->new(photo => 'abc', extra => { publish_photo => 1 });
    is $cobrand->allow_photo_display($approved), 1, 'approved photo is shown';
    is $cobrand->allow_photo_display($approved, 0), 1,
        'and when asked about a specific photo index';

    is $cobrand->allow_photo_display(undef), 0, 'no report, nothing to show';
};

subtest 'reports arriving as plain hashrefs, as RSS and Open311 pass them' => sub {
    is $cobrand->allow_photo_display({ extra => '{"publish_photo":1}' }), 1,
        'approval read out of the encoded extra';
    is $cobrand->allow_photo_display({ extra => '{"something_else":1}' }), 0,
        'no approval in there';
    is $cobrand->allow_photo_display({ extra => 'not json at all' }), 0,
        'unreadable extra does not release the photo';
    is $cobrand->allow_photo_display({}), 0, 'no extra at all';
};

subtest 'whoever moderates can see the photo they are judging' => sub {
    my $unapproved = FakeProblem->new(photo => 'abc');

    # Each context has to be held in a variable of its own. Cobrand::Base::new
    # weakens $self->{c}, so a context built inline as an argument is collected
    # the moment new returns, and the cobrand is left believing nobody is
    # signed in - which silently turns "a moderator can see it" into "nobody
    # can", and would let the two negative cases below pass for the wrong
    # reason.
    my $moderator_context = FakeContext->new(user => FakeUser->new(can => 1));
    my $as_moderator = FixMyStreet::Cobrand::Catanduva->new({ c => $moderator_context });
    is $as_moderator->allow_photo_display($unapproved), 1,
        'a moderator sees the unapproved photo';

    my $user_context = FakeContext->new(user => FakeUser->new(can => 0));
    my $as_user = FixMyStreet::Cobrand::Catanduva->new({ c => $user_context });
    is $as_user->allow_photo_display($unapproved), 0,
        'a signed-in user without the permission does not';

    my $visitor_context = FakeContext->new;
    my $as_visitor = FixMyStreet::Cobrand::Catanduva->new({ c => $visitor_context });
    is $as_visitor->allow_photo_display($unapproved), 0, 'nor an anonymous visitor';

    # A hashref has no can_moderate; asking it must not blow up, and must not
    # be mistaken for permission either.
    is $as_moderator->allow_photo_display({ extra => '{}' }), 0,
        'hashref plus moderator neither dies nor releases the photo';
};

subtest 'moderating a report approves its photo' => sub {
    my $problem = FakeProblem->new(photo => 'abc');
    $cobrand->report_moderate_after($problem);
    is $problem->get_extra_metadata('publish_photo'), 1, 'approved after moderation';
    is $problem->{updates}, 1, 'written once';

    $cobrand->report_moderate_after($problem);
    is $problem->{updates}, 1, 'moderating again does not rewrite for nothing';

    my $photoless = FakeProblem->new;
    $cobrand->report_moderate_after($photoless);
    is $photoless->get_extra_metadata('publish_photo'), undef,
        'no photo, nothing to approve';
    is $photoless->{updates}, 0, 'and nothing to write';

    # The moderator removed the photo: an old approval must not be left behind
    # for whatever photo might replace it.
    my $removed = FakeProblem->new(extra => { publish_photo => 1 });
    $cobrand->report_moderate_after($removed);
    is $removed->get_extra_metadata('publish_photo'), undef,
        'approval withdrawn along with the photo';
    is $removed->{updates}, 1, 'and that withdrawal is written';
};

# --------------------------------------------------------------------- INT-005

subtest 'with no demonstration mailbox configured, nothing is redirected' => sub {
    my $row = FakeRow->new;
    my $params = {
        To  => [ [ 'obras@prefeitura.example', 'Obras' ] ],
        Bcc => ['copia@example'],
    };

    FixMyStreet::override_config { COBRAND_FEATURES => {} }, sub {
        $cobrand->munge_sendreport_params($row, {}, $params);
    };

    is_deeply $params->{To}, [ [ 'obras@prefeitura.example', 'Obras' ] ],
        'recipients left alone';
    is_deeply $params->{Bcc}, ['copia@example'], 'and so is the blind copy';
    is $row->extra_metadata('demonstration_redirect'), undef, 'nothing recorded';
};

subtest 'with the mailbox configured, every report goes there instead' => sub {
    my $row = FakeRow->new;
    my $params = {
        # The sender accepts either shape, so both have to survive the munging.
        To  => [ [ 'obras@prefeitura.example', 'Obras' ], 'limpeza@prefeitura.example' ],
        Bcc => ['copia@example'],
    };

    FixMyStreet::override_config {
        COBRAND_FEATURES => {
            demonstration_recipient => { catanduva => 'ocorrencias@example.org' },
        },
    }, sub {
        $cobrand->munge_sendreport_params($row, {}, $params);
    };

    is_deeply $params->{To}, [ [ 'ocorrencias@example.org', 'FixMyStreet Catanduva' ] ],
        'the project mailbox is the only recipient';
    ok !exists $params->{Bcc},
        'the blind copy is dropped - it would have walked past the redirection';
    is_deeply $row->extra_metadata('demonstration_redirect'),
        [ 'obras@prefeitura.example', 'limpeza@prefeitura.example' ],
        'where it would have gone is kept on the report';
};

subtest 'no original recipient, nothing invented' => sub {
    my $row = FakeRow->new;
    my $params = { To => [] };

    FixMyStreet::override_config {
        COBRAND_FEATURES => {
            demonstration_recipient => { catanduva => 'ocorrencias@example.org' },
        },
    }, sub {
        $cobrand->munge_sendreport_params($row, {}, $params);
    };

    is_deeply $params->{To}, [ [ 'ocorrencias@example.org', 'FixMyStreet Catanduva' ] ],
        'still goes to the project mailbox';
    is $row->extra_metadata('demonstration_redirect'), undef,
        'and records no redirect it cannot describe';
};

# --------------------------------------------------------------------- LGPD-007

subtest 'retention: a resolved report is anonymised once it is five years old' => sub {
    my $citizen = $mech->create_user_ok('cidadao@example.org');
    my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
        { cobrand => 'catanduva' });

    my $long_ago  = DateTime->now->subtract(months => 61);
    my $recently  = DateTime->now->subtract(months => 12);

    my $report = sub {
        my ($title, $when, $state, $cobrand) = @_;
        my ($problem) = $mech->create_problems_for_body(1, $body->id, $title, {
            dt         => $when,
            lastupdate => "$when",
            state      => $state,
            cobrand    => $cobrand,
            user       => $citizen,
        });
        return $problem;
    };

    my $stale  = $report->('Antiga',   $long_ago, 'fixed - council', 'catanduva');
    my $fresh  = $report->('Recente',  $recently, 'fixed - council', 'catanduva');
    my $open   = $report->('Aberta',   $long_ago, 'confirmed',       'catanduva');
    my $others = $report->('De outro', $long_ago, 'fixed - council', 'default');

    # Exactly the arguments bin/catanduva/expurgo-lgpd passes. If the retention
    # period changes there, this has to change with it.
    FixMyStreet::Script::Inactive->new(
        anonymize => 60,
        cobrand   => 'catanduva',
    )->reports;

    $_->discard_changes for ($stale, $fresh, $open, $others);

    isnt $stale->user_id, $citizen->id,
        'resolved and past the period: the reporter is anonymised';
    is $fresh->user_id, $citizen->id,
        'resolved a year ago: left alone';

    # A report still open after six years is an operations problem, not a
    # retention one, and quietly stripping it would hide the very case that
    # deserves attention.
    is $open->user_id, $citizen->id,
        'still open after six years: left alone';

    is $others->user_id, $citizen->id,
        'another cobrand entirely: untouched';
};

done_testing();
