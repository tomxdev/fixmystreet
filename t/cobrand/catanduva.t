use FixMyStreet::TestMech;
use FixMyStreet::Cobrand::Catanduva;
use FixMyStreet::Cobrand;
use FixMyStreet::DB;
use FixMyStreet::Script::Inactive;
use Test::MockModule;
use DateTime;
use JSON::MaybeXS;

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

subtest 'the reverse geocoding is kept, not thrown away' => sub {
    # The same lookup that fills the CEP also answers "which street is this?".
    # Upstream only fills problem.geocode when something needs it - sending the
    # report on, an alert, a feed - which in a pilot that sends to nobody is
    # almost never. Keeping it here costs no extra request and saves the one
    # find_closest would make later.
    my $resposta = {
        display_name => 'Igreja Presbiteriana, 400, Rua Minas Gerais, Jardim Brasil, Catanduva, Brasil',
        address => { house_number => '400', road => 'Rua Minas Gerais', postcode => '15800-210' },
    };

    my $osm = Test::MockModule->new('FixMyStreet::Geocode::OSM');
    $osm->mock(reverse_geocode => sub { return $resposta });

    my $munge = sub {
        my $report = shift;
        FixMyStreet::Cobrand::Catanduva->new({ c => FakeContext->new(params => {}) })
            ->report_new_munge_before_insert($report);
        return $report;
    };
    my $novo = sub {
        return FixMyStreet::DB->resultset('Problem')->new({
            latitude => '-21.1383', longitude => '-48.9736', postcode => '', @_,
        });
    };

    my $report = $munge->($novo->());
    is_deeply $report->geocode, $resposta, 'the whole answer lands in problem.geocode';
    is $report->postcode, '15800-210', 'and the CEP still comes out of it';

    # Something that already knew the address knew more than a pin does.
    my $anterior = { address => { road => 'Rua Cuiabá' } };
    is_deeply $munge->($novo->(geocode => $anterior))->geocode, $anterior,
        'an existing geocode is not overwritten';

    # A geocoder that is down must leave the column alone, not write undef over
    # something, and must not take the report down with it.
    $osm->mock(reverse_geocode => sub { die "connection timed out\n" });
    is $munge->($novo->())->geocode, undef, 'no answer, nothing stored';

    subtest 'short_address is what fits on a card' => sub {
        my $cobrand = FixMyStreet::Cobrand::Catanduva->new;
        my $com = sub { $novo->(geocode => { address => shift }) };

        is $cobrand->short_address($com->({ road => 'Rua Minas Gerais', house_number => '400' })),
            'Rua Minas Gerais, 400', 'street and number, not the whole display_name';
        is $cobrand->short_address($com->({ road => 'Rua Cuiabá' })),
            'Rua Cuiabá', 'number is optional';
        is $cobrand->short_address($com->({ suburb => 'Centro' })), '',
            'no street, nothing to show - a neighbourhood alone is not an address';
        is $cobrand->short_address($novo->()), '', 'no geocode, no address';
        is $cobrand->short_address(undef), '', 'no report, no address';
    };
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

    # ALLOWED_COBRANDS matters more than it looks. Inactive coerces the moniker
    # through FixMyStreet::Cobrand->get_class_for_moniker, which falls back to
    # Cobrand::Default when the moniker is not allowed - and Default's moniker
    # is 'default'. Without this, the run silently anonymises the reports of
    # the wrong cobrand, which is exactly what it did the first time.
    # bin/catanduva/expurgo-lgpd refuses to run in that situation.
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        # Via a variable on purpose: `is Some::Class->method, ...` makes perl
        # read the class name as an indirect object of is(), which parses into
        # something else entirely and takes the whole file down with it.
        my $resolved = FixMyStreet::Cobrand->get_class_for_moniker('catanduva')->moniker;
        is $resolved, 'catanduva',
            'the moniker resolves to this cobrand, not the default';

        # Exactly the arguments bin/catanduva/expurgo-lgpd passes. If the
        # retention period changes there, this has to change with it.
        FixMyStreet::Script::Inactive->new(
            anonymize => 60,
            cobrand   => 'catanduva',
        )->reports;
    };

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

# --------------------------------------------------------------------- LGPD-004

subtest 'self-service erasure is offered here and nowhere else by default' => sub {
    is $cobrand->allow_self_service_erasure, 1, 'this cobrand offers it';
    # Via a variable, for the same reason as above: `is Some::Class->method`
    # parses the class name as an indirect object and takes the file down.
    my $default = FixMyStreet::Cobrand::Default->allow_self_service_erasure;
    is $default, 0,
        'the default does not - it is irreversible, so an install has to ask';
};

subtest 'a citizen removes their own personal details' => sub {
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
            { cobrand => 'catanduva' });
        my $user = $mech->create_user_ok('exclusao@example.org', name => 'Fulano de Tal');
        my ($problem) = $mech->create_problems_for_body(1, $body->id, 'Buraco', {
            user    => $user,
            cobrand => 'catanduva',
        });

        $mech->log_in_ok($user->email);
        $mech->get_ok('/my/erase');
        $mech->content_contains('Remover meus dados pessoais');

        # form_id, not with_fields: the unconfirmed case has no field to select
        # the form by, and the page carries other forms from the header.
        $mech->submit_form_ok({ form_id => 'erase-form' });
        $mech->content_contains('Confirme que deseja remover seus dados');

        $user->discard_changes;
        is $user->name, 'Fulano de Tal', 'nothing happens without the tick';

        $mech->submit_form_ok({ form_id => 'erase-form', with_fields => { confirm => 1 } });
        $mech->content_contains('Seus dados pessoais foram removidos');

        $user->discard_changes;
        is $user->name, '', 'the name is gone';
        is $user->phone, '', 'so is the phone number';
        unlike $user->email, qr/exclusao/, 'and the email address is replaced';

        # The whole point of anonymising rather than deleting: the pothole
        # outlives the person who reported it.
        $problem->discard_changes;
        ok $problem->in_storage, 'the report is still there';
        is $problem->anonymous, 1, 'shown without a name';
        is $problem->name, '', 'and carries none';
    };
};

# --------------------------------------------------------------------- LGPD-005

# The visibility table in section 5 of the plan says: the name is public only if
# the reporter chose so, the email address and the phone number never are. The
# upstream already behaves that way; these lock it, so that a template change
# cannot quietly undo a privacy promise the policy makes in writing.
subtest 'a public report page never carries the reporter contact details' => sub {
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
            { cobrand => 'catanduva' });
        # O telefone entra depois, e nao no create_user_ok: um find() com
        # e-mail e telefone juntos exige tambem um dos campos _verified, e
        # ResultSet::User morre sem ele. Aqui so queremos o numero gravado.
        my $user = $mech->create_user_ok('privacidade@example.org',
            name => 'Maria Silva');
        $user->update({ phone => '+551799990000' });
        my ($problem) = $mech->create_problems_for_body(1, $body->id, 'Buraco', {
            user      => $user,
            cobrand   => 'catanduva',
            name      => 'Maria Silva',
            anonymous => 'f',
        });

        $mech->log_out_ok;

        $mech->get_ok('/report/' . $problem->id);
        $mech->content_contains('Maria Silva',
            'the name is shown, because this reporter did not ask to be anonymous');
        $mech->content_lacks($user->email, 'the email address is not');
        $mech->content_lacks('99990000', 'nor the phone number');

        $problem->update({ anonymous => 1 });
        $mech->get_ok('/report/' . $problem->id);
        $mech->content_lacks('Maria Silva', 'once anonymous, the name goes too');
        $mech->content_lacks($user->email, 'and the email address stays away');
        $mech->content_lacks('99990000', 'and so does the phone number');
    };
};

# --------------------------------------------------------------------- SOC-001

subtest 'an unapproved photo never reaches the social preview' => sub {
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
            { cobrand => 'catanduva' });
        my ($problem) = $mech->create_problems_for_body(1, $body->id, 'Com foto', {
            cobrand => 'catanduva',
            photo   => '74e3362283b6ef0c48686fb0e161da4043bbcc97.jpeg',
        });

        $mech->log_out_ok;
        $mech->get_ok('/report/' . $problem->id);

        # The Photo controller already refuses the bytes, so nothing leaks. What
        # this guards is the other half: without it the tag would advertise an
        # empty URL and suppress the cobrand's own image, leaving a shared link
        # with no preview at all.
        $mech->content_lacks('og.jpeg', 'the unapproved photo is not offered as og:image');
        $mech->content_contains('fms-og_image.jpg',
            'the site image is used instead, so the link still previews');
    };
};

# --------------------------------------------------------------------- MOD-005

subtest 'a hidden report stays readable to its author, and to nobody else' => sub {
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
            { cobrand => 'catanduva' });
        my $author = $mech->create_user_ok('autor@example.org', name => 'João Autor');
        my $someone_else = $mech->create_user_ok('outro@example.org', name => 'Outra Pessoa');

        my ($problem) = $mech->create_problems_for_body(1, $body->id, 'Escondida', {
            user    => $author,
            cobrand => 'catanduva',
        });
        $problem->update({ state => 'hidden' });
        my $id = $problem->id;

        $mech->log_out_ok;
        ok $mech->get("/report/$id"), 'anonymous visitor asks for the hidden report';
        is $mech->res->code, 410, 'and is told it is gone';

        $mech->log_in_ok($someone_else->email);
        ok $mech->get("/report/$id"), 'a different signed-in user asks';
        is $mech->res->code, 410, 'same answer - being signed in is not enough';

        $mech->log_in_ok($author->email);
        $mech->get_ok("/report/$id");
        $mech->content_contains('removida pela moderação',
            'the author is told what happened, instead of meeting a bare 410');
        $mech->content_contains("/contact?id=$id",
            'and is given somewhere to contest it');
        $mech->content_contains("$id",
            'quoting the report number, which is the reference to cite');
    };
};

# --------------------------------------------------------------------- SEC-003

subtest '2FA is demanded of staff accounts, and not of the public' => sub {
    my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
        { cobrand => 'catanduva' });

    my $citizen = $mech->create_user_ok('cidadao-2fa@example.org');
    is $cobrand->must_have_2fa($citizen), 0,
        'a member of the public is not asked for a second factor';

    my $staff = $mech->create_user_ok('equipe-2fa@example.org',
        from_body => $body->id);
    is $cobrand->must_have_2fa($staff), 1,
        'anyone attached to the body is - they can moderate and read contact details';

    my $super = $mech->create_user_ok('super-2fa@example.org');
    $super->update({ is_superuser => 1 });
    is $cobrand->must_have_2fa($super), 1, 'and so is a superuser';
};

subtest 'the search field answers for a problem, and not only for a place' => sub {
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        my $body = $mech->create_body_ok(900001, 'Prefeitura de Catanduva',
            { cobrand => 'catanduva' });
        my $user = $mech->create_user_ok('busca@example.org', name => 'Quem Busca');

        my ($por_titulo) = $mech->create_problems_for_body(1, $body->id,
            'Buraco enorme na pista', { user => $user, cobrand => 'catanduva' });

        my ($por_descricao) = $mech->create_problems_for_body(1, $body->id,
            'Calçada quebrada', {
                user => $user, cobrand => 'catanduva',
                detail => 'Ao lado de um buraco que ninguém tapou',
            });

        my ($escondida) = $mech->create_problems_for_body(1, $body->id,
            'Buraco que ninguém deve ver', { user => $user, cobrand => 'catanduva' });
        $escondida->update({ state => 'hidden' });

        my %encontrados = map { $_->id => 1 } @{ $cobrand->buscar_ocorrencias('buraco') };

        ok $encontrados{ $por_titulo->id },   'acha pelo titulo';
        ok $encontrados{ $por_descricao->id }, 'acha pela descricao, e nao so pelo titulo';
        ok !$encontrados{ $escondida->id },   'e nao mostra o que foi escondido pela moderacao';

        is_deeply $cobrand->buscar_ocorrencias('bu'), [],
            'termo curto demais nao vale uma busca - casaria com meia cidade';
        is_deeply $cobrand->buscar_ocorrencias(''), [], 'nem termo vazio';
        is_deeply $cobrand->buscar_ocorrencias(undef), [], 'nem termo nenhum';

        is_deeply $cobrand->buscar_ocorrencias('%'), [],
            'e o curinga do LIKE e so um caractere, nao um jeito de listar tudo';

        is scalar @{ $cobrand->buscar_ocorrencias('buraco', 1) }, 1,
            'o limite de resultados e respeitado';
    };
};

subtest 'the "already reported?" step measures distance the way the database does' => sub {
    # A busca por ocorrencias proximas continua sendo do upstream: raio,
    # ordenacao e filtro de estado saem de nearby_distances e de
    # problem_find_nearby. O que se testa aqui e so o que o cobrand acrescentou
    # para escrever o rotulo "180 m" embaixo de cada ocorrencia.

    # Dois pontos separados por um grau de latitude: 1 grau de meridiano tem
    # 111,2km com o raio de Terra que a funcao do banco usa (R_e = 6372,8km).
    my $um_grau = $cobrand->distancia_em_metros(0, 0, 1, 0);
    ok abs($um_grau - 111_226) < 50,
        'um grau de latitude da os mesmos 111,2km da funcao do banco'
        or diag "deu $um_grau";

    is $cobrand->distancia_em_metros(-21.1344, -48.97335, -21.1344, -48.97335), 0,
        'o mesmo ponto dista zero - e nao morre no acos por arredondamento';

    # As duas ocorrencias de sinalizacao do banco de exemplo, medidas contra o
    # ponto entre elas: o banco devolve 137m para as duas.
    my $ate_uma = $cobrand->distancia_em_metros(-21.14175, -48.97115, -21.1405, -48.9705);
    ok $ate_uma > 100 && $ate_uma < 200,
        'distancia a uma ocorrencia real fica na casa dos 150m'
        or diag "deu $ate_uma";

    is $cobrand->distancia_em_metros(undef, -48.97, -21.13, -48.97), undef,
        'sem coordenada nao ha distancia - e nem um zero que pareceria exata';

    # O rotulo arredonda para a dezena mais proxima abaixo de 1km: um pino posto
    # a mao nao tem precisao de metro, e "183 m" prometeria o que o numero nao
    # tem.
    is $cobrand->distancia_escrita(183),  '180 m', 'arredonda para a dezena';
    is $cobrand->distancia_escrita(137),  '140 m', 'e arredonda para cima quando e o caso';
    is $cobrand->distancia_escrita(0),    '10 m',  'nunca escreve "0 m", que leria como erro';
    is $cobrand->distancia_escrita(999),  '1000 m', 'ate 1km continua em metros';
    is $cobrand->distancia_escrita(1000), '1.0 km', 'de 1km em diante, em quilometros';
    is $cobrand->distancia_escrita(2540), '2.5 km', 'com uma casa decimal';
    is $cobrand->distancia_escrita(undef), '', 'sem distancia, nenhum rotulo';
};

subtest 'the radius for suggesting duplicates is configurable, and defaults to upstream' => sub {
    FixMyStreet::override_config { ALLOWED_COBRANDS => ['catanduva'] }, sub {
        is_deeply $cobrand->nearby_distances, { inspector => 1000, suggestions => 250 },
            'sem configuracao, os mesmos numeros do upstream';
    };

    FixMyStreet::override_config {
        ALLOWED_COBRANDS => ['catanduva'],
        COBRAND_FEATURES => { nearby_distances => { catanduva => { suggestions => 150 } } },
    }, sub {
        my $c = FixMyStreet::Cobrand::Catanduva->new;
        is $c->nearby_distances->{suggestions}, 150, 'a configuracao manda no raio das sugestoes';
        is $c->nearby_distances->{inspector}, 1000,
            'e o que ela nao diz continua valendo o padrao';
    };

    FixMyStreet::override_config {
        ALLOWED_COBRANDS => ['catanduva'],
        COBRAND_FEATURES => { nearby_distances => { catanduva => { suggestions => 0 } } },
    }, sub {
        my $c = FixMyStreet::Cobrand::Catanduva->new;
        is $c->nearby_distances->{suggestions}, 0,
            'zero desliga a sugestao de duplicadas, como no upstream';
    };
};

subtest 'the card data survives a title that looks like markup' => sub {
    # O bloco de dados vai dentro de um <script type="application/json"> na
    # resposta de /around/nearby. Um titulo com "</script>" fecharia o elemento
    # e o resto viraria HTML na pagina.
    my $json = $cobrand->para_json([ { titulo => 'Buraco </script><img src=x>' } ]);

    unlike $json, qr{</script>}i, 'nenhum fecha-script sobrevive a serializacao';
    unlike $json, qr{<img}i,      'nem uma etiqueta aberta';

    my $de_volta = JSON::MaybeXS->new->decode($json);
    is $de_volta->[0]{titulo}, 'Buraco </script><img src=x>',
        'e o titulo continua inteiro para quem le o JSON';
};

subtest 'the existing-report card writes the address the way a person says it' => sub {
    my $nominatim = {
        display_name => 'Rua São Paulo, Centro, Catanduva, São Paulo, Região Sudeste, 15800-000, Brasil',
        address => {
            road => 'Rua São Paulo', suburb => 'Centro',
            city => 'Catanduva', state => 'São Paulo',
            postcode => '15800-000', country => 'Brasil',
        },
    };
    my $falso = Test::MockModule->new('FixMyStreet::DB::Result::Problem');

    my $problema = bless {}, 'FixMyStreet::DB::Result::Problem';
    $falso->mock(geocode => sub { $nominatim });

    is $cobrand->endereco_completo($problema), 'Rua São Paulo, Centro, Catanduva - SP',
        'rua, bairro e cidade com a sigla do estado - sem CEP, sem regiao, sem pais';

    # O Nominatim nomeia o bairro de tres jeitos diferentes conforme a area foi
    # mapeada; o primeiro que existir e o que vale.
    $falso->mock(geocode => sub { { address => {
        road => 'Rua Pará', neighbourhood => 'Higienópolis', town => 'Catanduva', state => 'São Paulo' } } });
    is $cobrand->endereco_completo($problema), 'Rua Pará, Higienópolis, Catanduva - SP',
        'neighbourhood serve de bairro, e town serve de cidade';

    $falso->mock(geocode => sub { { address => { city => 'Catanduva', state => 'Roraima' } } });
    is $cobrand->endereco_completo($problema), 'Catanduva - RR',
        'sem rua e sem bairro, sobra a cidade - e nao uma virgula solta';

    $falso->mock(geocode => sub { { address => { road => 'Rua Sem Estado', city => 'Lugar Nenhum' } } });
    is $cobrand->endereco_completo($problema), 'Rua Sem Estado, Lugar Nenhum',
        'estado que nao esta na tabela de siglas nao vira um traco vazio';

    $falso->mock(geocode => sub { undef });
    is $cobrand->endereco_completo($problema), '',
        'sem geocodificacao, nenhum endereco - e nao um endereco inventado';

    is $cobrand->endereco_completo(undef), '', 'nem sem ocorrencia';
};

subtest 'the report date is written in Portuguese, whatever the container locale is' => sub {
    my $data = DateTime->new(year => 2026, month => 8, day => 23);
    is $cobrand->data_por_extenso($data), '23 de agosto de 2026',
        'dia, mes por extenso e ano';

    is $cobrand->data_por_extenso(DateTime->new(year => 2026, month => 1, day => 1)),
        '1 de janeiro de 2026', 'o primeiro mes e o primeiro dia nao ganham zero a esquerda';

    is $cobrand->data_por_extenso(DateTime->new(year => 2026, month => 12, day => 31)),
        '31 de dezembro de 2026', 'e o ultimo mes existe';

    is $cobrand->data_por_extenso(undef), '', 'sem data, nenhum texto';
};

done_testing();
