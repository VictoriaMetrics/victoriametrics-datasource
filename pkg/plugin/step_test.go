package plugin

import (
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func Test_calculateStep(t *testing.T) {
	tests := []struct {
		name         string
		baseInterval time.Duration
		timeRange    backend.TimeRange
		resolution   int64
		want         string
	}{
		{
			name:         "one month timerange and max point 43200 with 20 second base interval",
			baseInterval: 20 * time.Second,
			timeRange: backend.TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 30),
				To:   time.Now(),
			},
			resolution: 43200,
			want:       "1m0s",
		},
		{
			name:         "one month timerange interval max points 43200 with 1 second base interval",
			baseInterval: 1 * time.Second,
			timeRange: backend.TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 30),
				To:   time.Now(),
			},
			resolution: 43200,
			want:       "1m0s",
		},
		{
			name:         "one month timerange interval max points 10000 with 5 second base interval",
			baseInterval: 5 * time.Second,
			timeRange: backend.TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 30),
				To:   time.Now(),
			},
			resolution: 10000,
			want:       "4m19.2s",
		},
		{
			name:         "one month timerange interval max points 10000 with 5 second base interval",
			baseInterval: 5 * time.Second,
			timeRange: backend.TimeRange{
				From: time.Now().Add(-time.Hour * 1),
				To:   time.Now(),
			},
			resolution: 10000,
			want:       "5s",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := calcStep(tt.baseInterval, tt.timeRange, tt.resolution); got.String() != tt.want {
				t.Errorf("calculateStep() = %v, want %v", got, tt.want)
			}
		})
	}
}
