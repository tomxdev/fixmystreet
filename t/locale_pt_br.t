#!/usr/bin/env perl

use strict;
use warnings;
use Test::More;
use utf8;

use FixMyStreet;

my $po = FixMyStreet->path_to('locale/pt_BR.UTF-8/LC_MESSAGES/FixMyStreet.po');

open my $fh, '<:encoding(UTF-8)', $po or die "cannot read $po: $!";
my @blocks = split /\n\n/, do { local $/; <$fh> };
close $fh;

# "Report abuse" really is uma denúncia - someone is being accused of
# misconduct. Every other "report" is a citizen recording an urban problem, and
# calling that a denúncia frames the reporter as an accuser.
my %abuse_is_fine = map { $_ => 1 } (
    'Report abuse',
    'You are reporting the following problem report for being abusive, containing personal information, or similar:',
    'You are reporting the following update for being abusive, containing personal information, or similar:',
);

# A po entry may wrap over several lines, and a plural entry carries one msgstr
# per form. Reading only `^msgid "..."$` and `^msgstr "..."$` - single line,
# singular - silently skipped both, which is how "conselhos" survived in
# msgstr[1] and how a dozen admin strings kept saying "denúncia".
sub unwrap {
    my ($s) = @_;
    return '' unless defined $s;
    $s =~ s/"\s*\n\s*"//g;      # join continuation lines
    $s =~ s/^"|"\s*$//g;        # drop the outer quotes
    return $s;
}

sub translations_of {
    my ($block) = @_;
    return map { unwrap($_) } $block =~ /^msgstr\[\d+\]\s+((?:"[^\n]*"\n?)+)/mg
        if $block =~ /^msgstr\[/m;
    my ($single) = $block =~ /^msgstr\s+((?:"[^\n]*"\n?)+)/m;
    return unwrap($single);
}

sub placeholders {
    my ($s) = @_;
    my @found = $s =~ /(%[sd])/g;
    return scalar @found;
}

my (@mismatched, @broken, @denuncia, @malformed,
    @sinalizador, @conselho, @codigo_postal, @outra_marca);

for my $block (@blocks) {
    next if $block =~ /^#,[^\n]*\bfuzzy\b/m;    # msgfmt drops these anyway

    my ($raw_id) = $block =~ /^msgid\s+(.*?)(?=^msgid_plural|^msgstr)/ms;
    next unless defined $raw_id;

    my $msgid = unwrap($raw_id);
    next if $msgid eq '';

    for my $msgstr (translations_of($block)) {
        next if $msgstr eq '';

        # A space between the % and its letter stops it being a placeholder, so
        # the value is never interpolated. \b keeps literals such as "99% das
        # vezes" out.
        push @broken, $msgid if $msgstr =~ /%\s+[sd]\b/;

        push @mismatched, $msgid
            if placeholders($msgid) != placeholders($msgstr);

        push @denuncia, $msgid
            if $msgstr =~ /den[uú]nci/i && !$abuse_is_fine{$msgid};

        # ocorrência/ocorrências are the only real words on that stem. Anything
        # else means a search-and-replace chewed through a longer word: the noun
        # "denuncia" is a substring of the verb "denunciar", so replacing the
        # noun first turns "denunciar" into "ocorrenciar".
        while ($msgstr =~ /([Oo]corrênci\w*)/g) {
            my $word = lc $1;
            push @malformed, "$msgid -> $1"
                unless $word eq 'ocorrência' || $word eq 'ocorrências';
        }

        # UX-004 vocabulary. A "ward" is a territorial division; the inherited
        # catalogue called it a "sinalizador", which is a flare. "Council" was
        # "órgão", too vague to tell the city hall from any other body - and in
        # two plural entries it was "conselho", a board of members.
        push @sinalizador,   $msgid if $msgstr =~ /sinalizador/i;
        push @conselho,      $msgid if $msgstr =~ /\bconselhos?\b/i;
        push @codigo_postal, $msgid if $msgstr =~ /c[óo]digo\s+postal/i;

        # The catalogue arrived carrying another Brazilian installation's brand,
        # in one case rewriting the "Powered by" footer to point at their domain.
        push @outra_marca, $msgid if $msgstr =~ /ajeitaminharua/i;
    }
}

subtest 'placeholders survive translation' => sub {
    is_deeply \@broken, [],
        'no msgstr splits a placeholder with whitespace, as in "% s"';
    is_deeply \@mismatched, [],
        'every msgstr keeps as many placeholders as its msgid';
};

subtest 'reports are ocorrencias, not denuncias' => sub {
    is_deeply \@denuncia, [],
        'denuncia is reserved for reporting abuse';
    is_deeply \@malformed, [],
        'no half-replaced words such as ocorrenciar or ocorrenciado';
};

subtest 'municipal vocabulary' => sub {
    is_deeply \@sinalizador, [],
        'ward is bairro, never sinalizador';
    is_deeply \@conselho, [],
        'council is prefeitura, never conselho';
    is_deeply \@codigo_postal, [],
        'postcode is CEP, never codigo postal';
};

subtest 'no other installation branding' => sub {
    is_deeply \@outra_marca, [],
        'the catalogue names FixMyStreet, not another deployment';
};

done_testing();
