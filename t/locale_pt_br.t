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

sub placeholders {
    my ($s) = @_;
    my @found = $s =~ /(%[sd])/g;
    return scalar @found;
}

my (@mismatched, @broken, @denuncia, @malformed);

for my $block (@blocks) {
    next if $block =~ /^#,[^\n]*\bfuzzy\b/m;    # msgfmt drops these anyway

    my ($msgid) = $block =~ /^msgid "(.*)"$/m;
    my ($msgstr) = $block =~ /^msgstr "(.*)"$/m;

    next unless defined $msgid && defined $msgstr;
    next if $msgid eq '' || $msgstr eq '';

    # A space between the % and its letter stops it being a placeholder, so the
    # value is never interpolated. \b keeps literals such as "99% das vezes" out.
    push @broken, $msgid if $msgstr =~ /%\s+[sd]\b/;

    push @mismatched, $msgid
        if placeholders($msgid) != placeholders($msgstr);

    push @denuncia, $msgid
        if $msgstr =~ /den[uú]nci/i && !$abuse_is_fine{$msgid};

    # ocorrência/ocorrências are the only real words on that stem. Anything
    # else means a search-and-replace chewed through a longer word: the noun
    # "denuncia" is a substring of the verb "denunciar", so replacing the noun
    # first turns "denunciar" into "ocorrenciar".
    while ($msgstr =~ /([Oo]corrênci\w*)/g) {
        my $word = lc $1;
        push @malformed, "$msgid -> $1"
            unless $word eq 'ocorrência' || $word eq 'ocorrências';
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

done_testing();
