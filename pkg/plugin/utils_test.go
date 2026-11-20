package plugin

import (
	"math"
	"strings"
	"testing"
	"time"
)

func TestParseFloatToTime(t *testing.T) {
	tests := []struct {
		name      string
		input     float64
		wantTime  time.Time
		expectErr bool
	}{
		{
			name:      "whole second timestamp",
			input:     1633046400.0,
			wantTime:  time.Unix(1633046400, 0),
			expectErr: false,
		},
		{
			name:      "timestamp with milliseconds",
			input:     1633046400.123,
			wantTime:  time.Unix(1633046400, 123*1e6),
			expectErr: false,
		},
		{
			name:      "timestamp with rounding",
			input:     1633046400.56789,
			wantTime:  time.Unix(1633046400, 568*1e6),
			expectErr: false,
		},
		{
			name:      "negative timestamp",
			input:     -1633046400.456,
			wantTime:  time.Now(),
			expectErr: true,
		},
		{
			name:      "invalid fractional part string",
			input:     1633046400.999999999,         // Beyond 3 decimal places
			wantTime:  time.Unix(1633046400, 1*1e9), // Expect a recent time as fallback
			expectErr: false,
		},
		{
			name:      "zero timestamp",
			input:     0.0,
			wantTime:  time.Unix(0, 0),
			expectErr: false,
		},
		{
			name:      "fractional timestamp without rounding",
			input:     1633046400.500,
			wantTime:  time.Unix(1633046400, 500*1e6),
			expectErr: false,
		},
		{
			name:      "fractional timestamp 50ms",
			input:     1633046400.05,
			wantTime:  time.Unix(1633046400, 50*1e6),
			expectErr: false,
		},
		{
			name:      "fractional timestamp 5ms",
			input:     1633046400.005,
			wantTime:  time.Unix(1633046400, 5*1e6),
			expectErr: false,
		},
		{
			name:      "maximum fractional digits (valid)",
			input:     1633046400.999,
			wantTime:  time.Unix(1633046400, 999*1e6),
			expectErr: false,
		},
		{
			name:      "near Unix time lower boundary",
			input:     -1.123,
			wantTime:  time.Now(), // Expect error for negative timestamp
			expectErr: true,
		},
		{
			name:      "fractional part with trailing zeros",
			input:     1633046400.120,
			wantTime:  time.Unix(1633046400, 120*1e6),
			expectErr: false,
		},
		{
			name:      "timestamp with zero milliseconds",
			input:     1633046400.000,
			wantTime:  time.Unix(1633046400, 0),
			expectErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotTime, err := parseFloatToTime(tt.input)

			if (err != nil) != tt.expectErr {
				t.Errorf("expected error: %v, got: %v", tt.expectErr, err != nil)
			}

			if !tt.expectErr && !gotTime.Equal(tt.wantTime) {
				t.Errorf("expected time: %v, got: %v", tt.wantTime, gotTime)
			}
		})
	}
}

func TestParseSampleValue(t *testing.T) {
	tests := []struct {
		name      string
		input     interface{}
		want      float64
		expectErr bool
	}{
		{name: "integer string", input: "13763", want: 13763},
		{name: "float string", input: "1.5", want: 1.5},
		{name: "exponent string", input: "1e3", want: 1000},
		{name: "infinity string", input: "+Inf", want: math.Inf(1)},
		{name: "number instead of string", input: 1.5, expectErr: true},
		{name: "null instead of string", input: nil, expectErr: true},
		{name: "object instead of string", input: map[string]interface{}{"a": 1}, expectErr: true},
		{name: "empty string", input: "", expectErr: true},
		{name: "not a number", input: "secret", expectErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseSampleValue(tt.input)

			if (err != nil) != tt.expectErr {
				t.Fatalf("expected error: %v, got: %v", tt.expectErr, err)
			}
			if tt.expectErr {
				// the error is logged, so it must not carry the value from the response
				if s, ok := tt.input.(string); ok && s != "" && strings.Contains(err.Error(), s) {
					t.Errorf("error contains the sample value: %s", err)
				}
				return
			}
			if got != tt.want {
				t.Errorf("expected value: %v, got: %v", tt.want, got)
			}
		})
	}
}
