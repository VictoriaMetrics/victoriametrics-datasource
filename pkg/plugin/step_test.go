package plugin

import (
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func Test_calculateStep(t *testing.T) {
	type timerange struct {
		from time.Time
		to   time.Time
	}
	type args struct {
		baseInterval time.Duration
		timeRange    backend.TimeRange
		resolution   int64
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "first test",
			args: args{
				baseInterval: 20 * time.Second,
				timeRange: backend.TimeRange{
					From: time.Now().Add(-time.Hour * 24 * 30),
					To:   time.Now(),
				},
				resolution: 43200,
			},
			want: "1m0s",
		},
		{
			name: "second test",
			args: args{
				baseInterval: 1 * time.Second,
				timeRange: backend.TimeRange{
					From: time.Now().Add(-time.Hour * 24 * 30),
					To:   time.Now(),
				},
				resolution: 43200,
			},
			want: "1s",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := calcStep(tt.args.timeRange, tt.args.baseInterval, tt.args.resolution); got.String() != tt.want {
				t.Errorf("calculateStep() = %v, want %v", got, tt.want)
			}
		})
	}
}
