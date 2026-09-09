package FixMyStreet::Gaze;

use strict;
use warnings;

use FixMyStreet;
use mySociety::Gaze;

sub get_radius_containing_population ($$) {
    my ($lat, $lon) = @_;

    # Don't call out to a real gaze when testing.
    return 10.0 if FixMyStreet->test_mode;

    my $default = FixMyStreet->config('GAZE_DEFAULT_RADIUS') || 10;

    # Gaze only holds population data for a few countries, and the lookup is a
    # synchronous HTTP call made while rendering every map page. Installs
    # outside that coverage can empty GAZE_URL to skip it and use the fixed
    # radius instead.
    return _round($default) unless FixMyStreet->config('GAZE_URL');

    my $dist = eval {
        mySociety::Locale::in_gb_locale {
            mySociety::Gaze::get_radius_containing_population($lat, $lon, 200_000);
        };
    };
    if ($@) {
        # Error fetching from gaze, let's fall back to the default radius
        $dist = $default;
    }
    return _round($dist);
}

sub _round {
    my ($dist) = @_;
    return int( $dist * 10 + 0.5 ) / 10.0;
}

sub get_country_from_ip {
    my ($ip) = @_;
    return 'GB' if FixMyStreet->test_mode;
    # uncoverable statement
    return mySociety::Gaze::get_country_from_ip($ip);
}

1;
