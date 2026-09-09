#!/usr/bin/env perl

use strict;
use warnings;
use Test::More;

use FixMyStreet;
use FixMyStreet::Gaze;

subtest 'test mode never calls out' => sub {
    is FixMyStreet::Gaze::get_radius_containing_population(-21.1383, -48.9736), 10.0,
        'fixed radius while testing';
};

# The remaining cases exercise the non-test path, which is where the Gaze
# lookup would normally happen. GAZE_URL is empty throughout, so nothing
# reaches the network.
my $was_test_mode = FixMyStreet->test_mode;
FixMyStreet->test_mode(0);

subtest 'empty GAZE_URL skips the lookup' => sub {
    FixMyStreet::override_config {
        GAZE_URL => '',
        GAZE_DEFAULT_RADIUS => 7,
    }, sub {
        is FixMyStreet::Gaze::get_radius_containing_population(-21.1383, -48.9736), 7,
            'configured default radius returned';
    };
};

subtest 'default radius falls back to 10km' => sub {
    FixMyStreet::override_config {
        GAZE_URL => '',
        GAZE_DEFAULT_RADIUS => undef,
    }, sub {
        is FixMyStreet::Gaze::get_radius_containing_population(-21.1383, -48.9736), 10,
            'no configured default, 10km used';
    };
};

subtest 'radius is rounded to one decimal place' => sub {
    FixMyStreet::override_config {
        GAZE_URL => '',
        GAZE_DEFAULT_RADIUS => 5.25,
    }, sub {
        is FixMyStreet::Gaze::get_radius_containing_population(-21.1383, -48.9736), 5.3,
            'rounded as the Gaze answer would be';
    };
};

FixMyStreet->test_mode($was_test_mode);

done_testing();
