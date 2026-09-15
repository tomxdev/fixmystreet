package FixMyStreet::Cobrand::Catanduva;
use base 'FixMyStreet::Cobrand::Default';

use strict;
use warnings;
use utf8;

use JSON::MaybeXS;
use Math::Trig qw(pi acos);
use Scalar::Util 'blessed';

use FixMyStreet::Geocode;
use FixMyStreet::Geocode::Address;
use FixMyStreet::Map;
use FixMyStreet::DB::Result::Problem;
use Memcached;
use Unicode::Normalize qw(NFD);

=encoding utf-8

=cut

sub site_key { 'catanduva' }

sub country { 'BR' }

sub languages { [ 'pt-br,Português,pt_BR' ] }
sub language_override { 'pt-br' }

=head2 area_types

Which MapIt types count as "our area". C<O08> is admin_level 8 in the
OpenStreetMap-derived global MapIt, which is where Brazilian municipalities
live - that is the production answer, and so it is the default.

But it reads the configuration first, on purpose. The type is a property of the
MapIt instance you point at, not of the cobrand: the local environment uses the
built-in fakemapit, where everything is C<ZZZ>, and the test suites use stand-ins
of their own. Hardcoding C<O08> here made all of those find no area at all, and
therefore no body - the reporting form simply had nowhere to send anything.

That is worth remembering as a shape of mistake: a deployment fact baked into
code looks correct until the code runs somewhere else.

=cut

sub area_types { FixMyStreet->config('MAPIT_TYPES') || [ 'O08' ] }

# O rotulo do campo de busca — o que o leitor de tela le, e o que aparece acima
# do campo em /around.
#
# Era `_('Enter a nearby postcode, or street name and area')`, que o catalogo
# pt_BR traduz como "Digite um CEP proximo, ou o nome da rua e o bairro". Ficou
# desencontrado do que o campo passou a fazer: alem de lugar, ele procura
# ocorrencias pelo texto (ver `buscar_ocorrencias`). O placeholder ja dizia isso;
# quem usa leitor de tela ouvia a promessa antiga.
#
# Escrito em portugues, e nao por `loc()`, porque nao ha msgid no catalogo para
# esta frase — e inventar um que ninguem traduziu devolveria ingles.
#
# Este metodo so alimenta `around/postcode_form.html`, que e a busca da home e do
# /around. Nenhuma outra tela muda de texto por causa disto.
sub enter_postcode_text { 'Digite um CEP, rua, bairro ou o problema' }

=head2 example_places

Os dois exemplos que a dica do campo de busca mostra.

C<Default.pm> devolve "High Street" e "Main Street", ruas britanicas, e a dica
aparecia assim em C</alert>: "por exemplo 'High Street' or 'Main Street'". Um
exemplo serve para dizer que formato se espera; um exemplo de outro pais diz o
formato errado.

=cut

sub example_places { [ 'Rua Sao Paulo', 'Centro' ] }

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

=head2 nearby_distances

How far "nearby" reaches, in metres, for the two features that look for reports
around a point: the inspector's de-duplication list and the "Já foi relatado?"
step of the reporting flow.

Upstream's defaults are 1000m and 250m (L<FixMyStreet::Cobrand::Default>), and
those stay the defaults here. What this adds is a way to change them without
touching code, because the right radius for Catanduva is not something the code
can know: 250m is generous for a pothole and mean for a lamp post, and only the
pilot will say which way it errs.

    COBRAND_FEATURES:
      nearby_distances:
        catanduva:
          suggestions: 150

Returning 0 for a mode switches that feature off entirely - that behaviour is
upstream's, and it is preserved.

=cut

sub nearby_distances {
    my $self = shift;

    my $padrao = { inspector => 1000, suggestions => 250 };
    my $config = $self->feature('nearby_distances') or return $padrao;

    return { %$padrao, %$config };
}

=head2 distancia_em_metros

Distance between two points, in metres.

This is C<not> a second rule for finding nearby reports: the search, the radius
and the ordering all stay with C<problem_find_nearby>, the database function
upstream already uses. This is the same formula as that function - the spherical
law of cosines with the same Earth radius, C<R_e() = 6372.8km> - written here for
one reason only: to print "180 m" under a report.

It exists because L<FixMyStreet::App::Controller::Report>'s C<_nearby_json> maps
the C<Nearby> rows down to plain problems (C<map { $_-E<gt>problem }>) and the
distance the database had already computed is dropped on the way. Rather than
change a core controller, we recompute it with the same arithmetic.

=cut

sub distancia_em_metros {
    my ($self, $lat1, $lon1, $lat2, $lon2) = @_;

    return undef unless defined $lat1 && defined $lon1
                     && defined $lat2 && defined $lon2;

    my $R_e = 6372.8; # km, as in the database's R_e()

    my $rad = sub { $_[0] * pi / 180 };
    my $cosseno = sin($rad->($lat1)) * sin($rad->($lat2))
                + cos($rad->($lat1)) * cos($rad->($lat2))
                    * cos($rad->($lon1 - $lon2));

    # Floating point can push this a hair outside [-1, 1] for coincident points,
    # and acos() dies on that. The database truncates to 14 places for the same
    # reason.
    $cosseno = 1 if $cosseno > 1;
    $cosseno = -1 if $cosseno < -1;

    return $R_e * acos($cosseno) * 1000;
}

=head2 distancia_escrita

The same distance as a label, rounded the way a person would say it: metres up
to a kilometre, then one decimal of a kilometre.

Rounded to the nearest 10m below 1km, because a pin dropped by hand is not
accurate to the metre and "183 m" claims a precision the number does not have.

=cut

=head2 para_json

Serialises a structure a template has built, for embedding in a
C<< <script type="application/json"> >> block.

Template Toolkit has no C<json> vmethod here - the view registers C<tprintf>,
C<prettify_dt> and a handful of filters, and nothing else - so this exists to
avoid a template writing JSON by hand with string concatenation, which is how
quoting bugs get born.

C<< < >> is escaped, so the string can never close the script element it lives
in, whatever a report's title happens to contain.

Values are flattened to plain strings on the way in. Template Toolkit hands back
C<FixMyStreet::Template::SafeString> objects for anything that went through a
BLOCK or through C<prettify_state>, and the encoder refuses to serialise a
blessed reference.

=cut

sub para_json {
    my ($self, $dados) = @_;

    my $json = JSON::MaybeXS->new(utf8 => 0, canonical => 1)
        ->encode($self->_simplificar($dados));
    $json =~ s/</\\u003c/g;
    return $json;
}

sub _simplificar {
    my ($self, $valor) = @_;

    my $ref = ref $valor or return $valor;

    return [ map { $self->_simplificar($_) } @$valor ] if $ref eq 'ARRAY';
    return { map { $_ => $self->_simplificar($valor->{$_}) } keys %$valor }
        if $ref eq 'HASH';

    # Anything else - a SafeString, a DateTime - becomes whatever it prints as.
    return "$valor";
}

sub distancia_escrita {
    my ($self, $metros) = @_;

    return '' unless defined $metros;

    return sprintf('%.1f km', $metros / 1000) if $metros >= 1000;

    my $arredondado = int($metros / 10 + 0.5) * 10;
    $arredondado = 10 if $arredondado < 10; # "0 m" reads as an error
    return "$arredondado m";
}

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

=head2 reverse_geocode_pin

A resposta crua do geocodificador reverso para um ponto, ou undef.

Existe separada de C<cep_from_pin> porque a mesma resposta serve a duas coisas -
o CEP e o endereco - e quem precisa das duas chama uma vez e usa o resultado nos
dois lugares.

Nao guarda nada. A primeira versao disto tinha um cache por coordenada, para o
caso de alguem perguntar duas vezes pelo mesmo ponto; nao ha esse caso — o unico
chamador que precisa das duas coisas ja faz uma chamada so — e o cache tinha um
custo real: a mesma coordenada devolvia para sempre a primeira resposta, o que
quebrou tres asserts que trocam o geocodificador entre chamadas. Um cache que
sobrevive a mudanca do que ele armazena e uma mentira em potencial.

Nunca morre: um geocodificador fora do ar, lento ou com resposta inesperada tem
de custar um campo vazio, nao uma ocorrencia que nao foi registrada.

=cut

sub reverse_geocode_pin {
    my ($self, $lat, $lon) = @_;

    if ( my $c = $self->{c} ) {
        $lat = $c->stash->{latitude}  unless defined $lat;
        $lon = $c->stash->{longitude} unless defined $lon;
    }

    return undef unless defined $lat && defined $lon;

    my $resultado = eval { FixMyStreet::Geocode::reverse($self, $lat, $lon) };

    return ref $resultado eq 'HASH' ? $resultado : undef;
}

sub cep_from_pin {
    my ($self, $lat, $lon) = @_;

    my $result = $self->reverse_geocode_pin($lat, $lon);
    return '' unless $result;

    return $self->normalise_cep($result->{address}{postcode});
}

=head2 short_address

Rua e numero de uma ocorrencia, para caber num cartao. String vazia quando o
geocodificador nao soube dizer a rua.

C<nearest_address> devolve o C<display_name> inteiro do Nominatim - "Igreja
Presbiteriana, 400, Rua Minas Gerais, Jardim Brasil, Centro, Catanduva, Sao
Paulo, Regiao Sudeste, 15800-210, Brasil". Num cartao de 21rem isso vira
reticencias depois de tres palavras, e as tres primeiras costumam ser o nome de
um predio vizinho, nao o endereco.

Usa C<parts>, e nao o texto cru, porque cada geocodificador tem o seu formato e
e C<FixMyStreet::Geocode::Address> quem sabe disso.

=cut

=head2 SIGLAS_DE_ESTADO

Brazilian state names to their two-letter abbreviations, so an address can end
"Catanduva - SP" instead of "Catanduva, São Paulo" - which is how addresses are
written here, and how the reference screens write them.

=cut

my %SIGLAS_DE_ESTADO = (
    'Acre' => 'AC', 'Alagoas' => 'AL', 'Amapá' => 'AP', 'Amazonas' => 'AM',
    'Bahia' => 'BA', 'Ceará' => 'CE', 'Distrito Federal' => 'DF',
    'Espírito Santo' => 'ES', 'Goiás' => 'GO', 'Maranhão' => 'MA',
    'Mato Grosso' => 'MT', 'Mato Grosso do Sul' => 'MS', 'Minas Gerais' => 'MG',
    'Pará' => 'PA', 'Paraíba' => 'PB', 'Paraná' => 'PR', 'Pernambuco' => 'PE',
    'Piauí' => 'PI', 'Rio de Janeiro' => 'RJ', 'Rio Grande do Norte' => 'RN',
    'Rio Grande do Sul' => 'RS', 'Rondônia' => 'RO', 'Roraima' => 'RR',
    'Santa Catarina' => 'SC', 'São Paulo' => 'SP', 'Sergipe' => 'SE',
    'Tocantins' => 'TO',
);

=head2 endereco_completo

The report's address as a person would say it: street, neighbourhood, city and
state - "Rua São Paulo, Centro, Catanduva - SP".

Nominatim's C<display_name> has everything in one line, from the house number to
the country: "Rua Silva Jardim, Vila Bom Jesus, Catanduva, São Paulo, Região
Sudeste, 15800-000, Brasil". The tail of that is the same for every report in
town, and it is what pushes the part that actually distinguishes one address from
another out of a narrow column.

So this picks the fields it wants from the structured address rather than
trimming the string, and returns the empty string when the geocoder gave us
nothing - an empty line is honest, an invented address would not be.

=cut

sub endereco_completo {
    my ($self, $problem) = @_;

    my $geocode = $problem && eval { $problem->geocode } or return '';
    my $address = $geocode->{address} or return '';

    my @partes;
    push @partes, $address->{road} if $address->{road};

    # Nominatim names the neighbourhood differently depending on how the area is
    # mapped; the first one that exists is the one to show.
    for my $campo (qw(suburb neighbourhood quarter city_district)) {
        next unless $address->{$campo};
        push @partes, $address->{$campo};
        last;
    }

    my $cidade = $address->{city} || $address->{town} || $address->{village} || '';
    if ($cidade) {
        my $uf = $SIGLAS_DE_ESTADO{ $address->{state} || '' };
        push @partes, $uf ? "$cidade - $uf" : $cidade;
    }

    return join(', ', @partes);
}

=head2 data_por_extenso

"23 de agosto de 2026". The month names come from here and not from the system
locale because the container's locale is not guaranteed to be pt_BR, and a date
that reads "23 de August de 2026" is worse than no date at all.

=cut

my @MESES = qw(janeiro fevereiro março abril maio junho
               julho agosto setembro outubro novembro dezembro);

sub data_por_extenso {
    my ($self, $dt) = @_;

    return '' unless $dt && ref $dt;
    return sprintf('%d de %s de %d', $dt->day, $MESES[ $dt->month - 1 ], $dt->year);
}

sub short_address {
    my ($self, $problem) = @_;

    my $geocode = $problem && eval { $problem->geocode } or return '';

    my $parts = FixMyStreet::Geocode::Address->new($geocode)->parts;
    my $rua = $parts->{street} or return '';

    return $parts->{number} ? "$rua, $parts->{number}" : $rua;
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

    my $reverso = $self->reverse_geocode_pin( $report->latitude, $report->longitude );

    my $cep = $self->normalise_cep( $self->{c}->get_param('cep') );
    $cep ||= $reverso ? $self->normalise_cep( $reverso->{address}{postcode} ) : '';
    $cep ||= $self->normalise_cep( $report->postcode );

    $report->postcode($cep);

    # E a mesma resposta, guardada inteira em vez de descartada.
    #
    # `problem.geocode` e a coluna de onde sai `nearest_address`, que e o
    # endereco mostrado nos cartoes, nos alertas e no RSS. Quem a preenche no
    # upstream e `find_closest`, e so quando alguem precisa dela - no envio ao
    # orgao, num alerta, num feed. Num piloto que nao envia para ninguem esse
    # momento quase nunca chega: das vinte ocorrencias deste ambiente, uma tinha
    # endereco.
    #
    # Nao e requisicao nova: o reverse geocoding ja acontecia aqui, para o CEP, e
    # o resto da resposta ia embora. E economiza a chamada que `find_closest`
    # faria depois, porque ela so pergunta quando a coluna esta vazia.
    #
    # Nao sobrescreve o que ja houver: se a ocorrencia chegou com geocode, ele
    # veio de algum caminho que sabia mais do que este.
    $report->geocode($reverso) if $reverso && !$report->geocode;

    # Uma ocorrencia a mais muda os numeros do painel. Limpar aqui, antes da
    # insercao, e o bastante: a proxima leitura acontece depois dela e recalcula.
    $self->limpar_cache_dos_numeros;
}

=head2 Aprovação prévia de fotografia (MOD-002)

A photograph of a pothole can carry, with no intent at all, a face, a number
plate, the inside of someone's home, or a person sleeping rough. None of that
can be undone once it is published, so during the pilot no photograph reaches
the public before a human has looked at it.

The default cobrand shows every photo; Zurich is the upstream precedent for the
opposite, and this follows its C<publish_photo> metadata shape so the two stay
recognisable to each other.

Note the asymmetry that justifies defaulting to deny: a photo wrongly withheld
costs the reporter a little detail on their report, while a photo wrongly
published can expose someone who never agreed to be in it.

=cut

# The moderation form shows the photo with a keep/remove checkbox, so a
# moderator submitting that form has made a decision about it - that is what
# marks the photo approved. Reads straight from `extra` when handed a plain
# hashref, which is how the RSS and Open311 paths pass reports through.
sub photo_approved {
    my ($self, $r) = @_;

    return 0 unless $r;

    my $flag;
    if ( blessed $r ) {
        $flag = $r->get_extra_metadata('publish_photo');
    }
    else {
        my $extra = $r->{extra};
        $extra = eval { JSON::MaybeXS->new->decode($extra) } if $extra && !ref $extra;
        $flag = ref $extra eq 'HASH' ? $extra->{publish_photo} : undef;
    }

    return $flag ? 1 : 0;
}

=head2 allow_photo_display

False until the photo is approved, with one exception: whoever can moderate the
report can see the photo, because they cannot judge what they cannot see.

Returns 1 rather than a bare true value so the callers that treat the result as
a 1-indexed photo number - C<Rss.pm> does - get a usable one. Approval is per
report, not per photo: at pilot volume, a moderator deciding photo by photo
would be precision nobody asked for.

=cut

sub allow_photo_display {
    my ($self, $r, $num) = @_;

    return 0 unless $r;
    return 1 if $self->photo_approved($r);

    my $c = $self->{c};
    return 1 if $c && blessed $r && $c->user_exists && $c->user->can_moderate($r);

    return 0;
}

=head2 report_moderate_after

Marks the photo approved once a moderator has been through the report.

Only ever sets the flag when a photo survived moderation: if the moderator
removed it, there is nothing to approve, and we must not leave an approval
behind for a photo that might be replaced later.

=cut

sub report_moderate_after {
    my ($self, $problem) = @_;

    if ( $problem->photo ) {
        return if $problem->get_extra_metadata('publish_photo');
        $problem->set_extra_metadata( publish_photo => 1 );
    }
    else {
        return unless $problem->get_extra_metadata('publish_photo');
        $problem->unset_extra_metadata('publish_photo');
    }

    $problem->update;
}

=head2 must_have_2fa

SEC-003. Any account that can act on other people's data - a superuser, or
anyone attached to the body - has to carry a second factor. The mechanism is
already in the upstream; what was missing was saying who it applies to.

The asymmetry is the argument: a citizen's account holds their own reports, while
a staff account can hide reports, read contact details and moderate. A password
that leaks in either case costs very different things.

Development on a laptop is left out through the staging flag - demanding an
authenticator app to bring the site up locally costs more than it protects.

=cut

sub must_have_2fa {
    my ($self, $user) = @_;

    return 0 if FixMyStreet->staging_flag('skip_must_have_2fa');

    return 1 if $user->is_superuser;
    return 1 if $user->from_body;

    return 0;
}

=head2 show_hidden_reports_to_author

MOD-005. A report hidden by moderation stays readable to the person who wrote
it, and to nobody else.

Contesting a removal without being able to read what was removed is a right in
name only - and the author already knows the content, they wrote it. What
changes here is only that they are told, rather than meeting a bare 410 that
explains nothing and offers nowhere to go.

=cut

sub show_hidden_reports_to_author { 1 }

=head2 allow_self_service_erasure

LGPD-004. The right to have one's data erased is the titular's, and making them
write to an administrator to exercise it turns a right into a favour. On here it
is a page they can reach themselves.

What it does is anonymise, not delete: the urban problem is of public interest,
the identity of whoever reported it is not (plano, seção 5, decisão 4).

=cut

sub allow_self_service_erasure { 1 }

=head2 Caixa postal de demonstração (INT-005)

There is no partnership with the city hall, so there is nowhere real to send a
report to. Rather than leave the flow half-finished for the demonstration, every
report is delivered to the project's own mailbox: the cycle can be shown end to
end - filed, moderated, sent, e-mail arriving - and the only thing that changes
on the day a partnership exists is the address.

Configure it per cobrand, so no address is baked into the code:

    COBRAND_FEATURES:
      demonstration_recipient:
        catanduva: 'ocorrencias@exemplo.org'

Leaving it unset is normal FixMyStreet behaviour: the report goes to whatever
the category contacts say. That is deliberate - this is a redirection, not a
lock - but it is worth being plain that it therefore protects nothing on its
own. What keeps the pilot from writing to a real council is that the contacts
are ours; this only makes sure that stays true even if one of them is edited by
mistake.

=cut

sub demonstration_recipient { $_[0]->feature('demonstration_recipient') }

=head2 buscar_ocorrencias

Ocorrencias cujo titulo ou descricao contem o texto procurado.

Existe porque a busca da home nao tinha resposta para quem digita o problema em
vez do lugar: "buraco" devolvia "nao conseguimos encontrar esta localizacao", que
e verdade sobre o geocodificador e mentira sobre a cidade — ha buracos
registrados. O campo diz "CEP, rua, bairro ou o problema", e esta e a parte "ou o
problema".

O upstream nao tem busca textual publica de ocorrencias; a unica busca por
conteudo que existe e a da administracao. Esta aqui e deliberadamente estreita:
so o que ja e publico, so por texto contido, no maximo cinco resultados.

Devolve lista vazia — e nao morre — para termo curto demais, porque duas letras
casariam com meia cidade.

=cut

sub buscar_ocorrencias {
    my ($self, $termo, $limite) = @_;

    $termo = defined $termo ? $termo : '';
    $termo =~ s/^\s+//;
    $termo =~ s/\s+$//;

    return [] if length($termo) < 3;

    # `%` e `_` sao curingas do LIKE. Quem digita "100%" procura por "100%", e
    # nao por "100 seguido de qualquer coisa".
    (my $padrao = $termo) =~ s/([%_\\])/\\$1/g;
    $padrao = '%' . $padrao . '%';

    my $rs = $self->problems->search(
        {
            state      => [ FixMyStreet::DB::Result::Problem->visible_states() ],
            non_public => 0,
            -or        => [
                title  => { -ilike => $padrao },
                detail => { -ilike => $padrao },
            ],
        },
        {
            order_by => { -desc => 'confirmed' },
            rows     => $limite || 5,
        },
    );

    return [ $rs->all ];
}

=head2 front_stats_data

Os quatro numeros do painel "Catanduva em numeros" da home.

O painel de C<Default.pm> tem tres celulas e todas falam de janelas curtas:
ocorrencias da ultima semana, resolvidas no ultimo mes, total de atualizacoes.
O painel desta home fala de participacao acumulada - quantas ocorrencias a
cidade ja registrou, quantas foram resolvidas, quantas estao andando, quanta
gente participou - porque e isso que a referencia visual poe ali e, mais
importante, e a leitura que faz sentido para quem chega pela primeira vez.

As chaves do upstream continuam no retorno. C<front/_stats.html> e qualquer
outro consumidor seguem funcionando; este metodo acrescenta, nao substitui.

Nenhum destes numeros e estimado ou arredondado para efeito: sao contagens.
Um piloto com duas ocorrencias mostra duas.

=cut

sub front_stats_data {
    my $self = shift;

    my $stats = $self->SUPER::front_stats_data();

    my $problems = $self->problems;
    my $key      = $self->site_key;

    # "Em andamento" e o aberto que ja saiu da fila: alguem olhou, classificou ou
    # agendou. 'confirmed' fica de fora de proposito - uma ocorrencia recem
    # registrada esta aberta, mas dizer que esta "em andamento" seria prometer
    # trabalho que ninguem comecou.
    my @underway = grep { $_ ne 'confirmed' }
        FixMyStreet::DB::Result::Problem->open_states();

    # O mesmo cache do upstream, pelas mesmas razoes: sao quatro contagens de
    # tabela cheia na pagina mais visitada do site.
    #
    # Mas zero nao e "guarde por zero segundo". No memcached, expiracao zero
    # quer dizer **nunca expira**, e e isso que `CACHE_TIMEOUT: 0` - que e o que
    # esta configurado aqui, e que qualquer pessoa le como "nao cacheie" -
    # estava fazendo: os quatro numeros eram calculados uma vez e nunca mais.
    # O painel mostrava 13 ocorrencias com 14 no banco, e nao havia espera que
    # resolvesse.
    #
    # Zero ou menos passa a significar o que parece significar: sem cache.
    my $timeout = FixMyStreet->config('CACHE_TIMEOUT') // 3600;

    my $contar = sub {
        my ($nome, $calculo) = @_;
        return $calculo->() if $timeout <= 0;
        return Memcached::get_or_calculate("catanduva_$nome:$key", $timeout, $calculo);
    };

    $stats->{registered} = $contar->('registered', sub {
        $problems->search({
            state => [ FixMyStreet::DB::Result::Problem->visible_states() ],
        })->count;
    });

    $stats->{resolved} = $contar->('resolved', sub {
        $problems->search({
            state => [ FixMyStreet::DB::Result::Problem->fixed_states() ],
        })->count;
    });

    $stats->{in_progress} = $contar->('in_progress', sub {
        @underway ? $problems->search({ state => \@underway })->count : 0;
    });

    $stats->{citizens} = $contar->('citizens', sub {
        $problems->unique_users->count;
    });

    return $stats;
}

=head2 limpar_cache_dos_numeros

Apaga as quatro contagens do painel.

Chamada quando uma ocorrencia nova entra. Com C<CACHE_TIMEOUT> positivo, sem
isto o painel so mostraria a ocorrencia nova quando o cache vencesse - o que e
justamente o defeito que quem testou encontrou, agravado por um zero que
significava "para sempre".

Nao cobre tudo: uma ocorrencia que muda de estado pela administracao (de aberta
para resolvida, por exemplo) nao passa por aqui, e com cache ligado esse numero
pode atrasar ate o fim do prazo. Fica dito, em vez de prometido.

=cut

sub limpar_cache_dos_numeros {
    my $self = shift;

    my $key = $self->site_key;
    Memcached::delete("catanduva_$_:$key")
        for qw(registered resolved in_progress citizens);

    return;
}

=head2 display_days_ago_threshold

Ate quando uma ocorrencia e descrita por "ha N dias" em vez de pela data.

O padrao do C<Default.pm> e zero, ou seja: a data absoluta, sempre. Numa lista de
ocorrencias isso responde a pergunta errada. Quem olha a faixa do mapa nao quer
saber que a ocorrencia foi registrada em 28 de agosto; quer saber ha quanto tempo
ela esta la - e, se ainda esta aberta, ha quanto tempo ninguem a resolveu. "Ha 16
dias" diz isso de imediato; "23:26, 28 ago 2026" exige que a pessoa faca a conta.

Um ano, e nao mais: passado esse ponto a contagem deixa de ajudar - "ha 500 dias"
nao se le, e a data volta a ser a forma mais curta de dizer a mesma coisa.

Vale para o site inteiro, e nao so para os cartoes: e o mesmo gancho que
C<report/_item_small.html> consulta, entao a home, C</reports> e a pagina da
ocorrencia passam a falar da mesma maneira.

=cut

sub display_days_ago_threshold { 365 }

=head2 category_icon

O nome do icone que representa uma categoria, para C<_ui-icon.html>.

Casa por palavra, e nao por nome inteiro. As categorias vivem no banco e sao
editaveis na administracao: uma tabela de nomes exatos estaria errada assim que
alguem renomeasse "Lixo acumulado" para "Lixo e entulho", e nao teria resposta
nenhuma para uma categoria nova. Casando por palavra, as duas situacoes
continuam funcionando - e o que nao casar recebe o icone generico, que e uma
resposta correta, so que menos especifica.

E por isso tambem que a lista cobre mais assuntos do que as quatro categorias do
piloto: sao os que uma prefeitura costuma abrir em seguida.

Acento nao entra na conta. As categorias deste ambiente estao gravadas sem eles
("Iluminacao publica"), e nao ha garantia de que as proximas estejam.

=cut

# Ordem importa: a primeira que casar vence. "Sinalizacao" antes de "via" porque
# "sinalizacao viaria" e sinalizacao, nao pavimento.
my @CATEGORIA_ICONE = (
    [ qr/sinaliz|placa|semaforo|faixa/       => 'sign' ],
    [ qr/ilumin|lampada|poste|luz/           => 'lamp' ],
    [ qr/lixo|entulho|limpeza|residuo/       => 'trash' ],
    [ qr/agua|esgoto|vazamento|bueiro|galeria/ => 'droplet' ],
    [ qr/arvore|mato|poda|praca|jardim|verde/  => 'leaf' ],
    [ qr/buraco|via|rua|asfalto|pavimento|calcada/ => 'road' ],
);

sub category_icon {
    my ($self, $category) = @_;

    return 'clipboard' unless defined $category && length $category;

    my $chave = lc $category;
    # Decompoe e descarta os diacriticos, para "Iluminação" e "Iluminacao"
    # chegarem iguais aqui.
    $chave = NFD($chave);
    $chave =~ s/\p{NonspacingMark}//g;

    for my $par (@CATEGORIA_ICONE) {
        return $par->[1] if $chave =~ $par->[0];
    }

    return 'clipboard';
}

=head2 street_imagery_provider

Qual servico de imagem de rua a etapa "confirme a localizacao" deve consultar.

Devolve o nome do provider, que o template escreve no bloco e o JS usa para
escolher a implementacao. String vazia nao imprime o bloco.

O padrao e C<kartaview>, que responde sem credencial nenhuma e cuja licenca
(CC BY-SA 4.0) permite exibir a foto ao lado de um mapa que nao e dele - ao
contrario do Google Street View, que os termos da propria Google proibem na
mesma tela que um mapa nao-Google (ToS 3.2.3(e), "No Use With Non-Google Maps").
A investigacao inteira esta em C<docs/ui/map/MAP_EVOLUTION_STATUS.md>.

Para desligar, ou para trocar de provider no dia em que houver credencial:

    COBRAND_FEATURES:
        street_imagery:
            catanduva: 0                       # desliga o bloco
            catanduva: { provider: 'outro' }   # troca de servico

=cut

sub street_imagery_provider {
    my $self = shift;

    # C<feature> do Default.pm nao serve aqui: ele so devolve valor quando a
    # entrada e um hash, e desligar o bloco e escrever um 0.
    my $features = FixMyStreet->config('COBRAND_FEATURES');
    my $conf;
    if (ref $features eq 'HASH' && ref $features->{street_imagery} eq 'HASH') {
        my $por_cobrand = $features->{street_imagery};
        $conf = exists $por_cobrand->{ $self->moniker }
            ? $por_cobrand->{ $self->moniker }
            : $por_cobrand->{_fallback};
    }

    # Nada configurado - que e o caso de COBRAND_FEATURES vazia - fica no padrao.
    return 'kartaview' unless defined $conf;

    # Desligado de proposito.
    return '' if !ref $conf && !$conf;

    return $conf->{provider} if ref $conf eq 'HASH' && $conf->{provider};

    return 'kartaview';
}

=head2 confirmation_page_extra

Monta o mapa da pagina de confirmacao de ocorrencia.

O estado 09 do plano de mapa e a confirmacao do envio, e ela e a unica tela do
fluxo que nao nasce dentro da pagina de mapa: o envio e um POST de verdade e a
pessoa sai do C</around>. Sem isto, C<map> nao esta na stash e a tela ficaria
sem o mapa que a referencia pede.

O pino e o da propria ocorrencia recem-criada, pelas coordenadas dela. Nao ha
dado novo aqui - e a mesma montagem que a pagina da ocorrencia ja faz, chamada
de outro lugar.

Vale para os dois caminhos que chegam a confirmacao: quem ja estava autenticado
(C</report/confirmation>) e quem clicou no link do e-mail (C</P/...>).

=cut

sub confirmation_page_extra {
    my $self = shift;
    my $c = $self->{c} or return;

    # /P/... deixa a ocorrencia em `report`; /report/confirmation, em ambos.
    my $problem = $c->stash->{problem} ||= $c->stash->{report} or return;
    return unless $problem->latitude && $problem->longitude;

    # E quase /report/generate_map_tags, com uma diferenca deliberada: o pino
    # nao e arrastavel. La ele e, porque a pagina da ocorrencia deixa moderador
    # corrigir a posicao; aqui a ocorrencia ja foi enviada e arrastar o pino nao
    # teria para onde gravar.
    $c->stash->{page} = 'report';
    FixMyStreet::Map::display_map(
        $c,
        latitude   => $problem->latitude,
        longitude  => $problem->longitude,
        no_compass => 1,
        pins       => [ $problem->pin_data( 'report', type => 'big' ) ],
    );
}

sub munge_sendreport_params {
    my ($self, $row, $h, $params) = @_;

    my $mailbox = $self->demonstration_recipient or return;

    # Same shape the sender accepts either way: a bare address or [ address,
    # name ]. Keep the originals on the report - during a demonstration the
    # interesting question is "where would this have gone?", and after the
    # partnership it is the record of what the pilot did instead.
    my @would_have_gone = map { ref $_ ? $_->[0] : $_ } @{ $params->{To} || [] };
    $row->update_extra_metadata( demonstration_redirect => \@would_have_gone )
        if @would_have_gone;

    $params->{To} = [ [ $mailbox, 'FixMyStreet Catanduva' ] ];

    # A blind copy would walk straight past the redirection.
    delete $params->{Bcc};
}

1;
