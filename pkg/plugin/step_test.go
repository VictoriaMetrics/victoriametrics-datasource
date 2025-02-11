package plugin

import (
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func Test_calculateStep(t *testing.T) {
	tests := []struct {
		name       string
		query      *Query
		timeRange  backend.TimeRange
		resolution int64
		want       string
		wantErr    bool
	}{
		{
			name: "empty intervals",
			query: &Query{
				Interval:      "",
				TimeInterval:  "",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want: "15s",
		},
		{
			name: "enabled dsInterval intervals",
			query: &Query{
				TimeInterval:  "20s",
				Interval:      "",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want: "20s",
		},
		{
			name: "enabled dsInterval and query intervals",
			query: &Query{
				TimeInterval:  "20s",
				Interval:      "10s",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want: "10s",
		},
		{
			name: "enabled queryIntervalMS intervals",
			query: &Query{
				TimeInterval:  "20s",
				Interval:      "10s",
				IntervalMs:    5000,
				MaxDataPoints: 0,
			},
			want: "10s",
		},
		{
			name: "enabled queryIntervalMS and empty queryInterval intervals",
			query: &Query{
				TimeInterval:  "20s",
				Interval:      "",
				IntervalMs:    5000,
				MaxDataPoints: 0,
			},
			want: "5s",
		},
		{
			name: "enabled queryIntervalMS and defaultInterval",
			query: &Query{
				TimeInterval:  "",
				Interval:      "",
				IntervalMs:    5000,
				MaxDataPoints: 0,
			},
			want: "5s",
		},
		{
			name: "enabled defaultInterval",
			query: &Query{
				TimeInterval:  "",
				Interval:      "",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want: "15s",
		},
		{
			name: "enabled dsInterval only a number",
			query: &Query{
				TimeInterval:  "123",
				Interval:      "",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want: "2m0s",
		},
		{
			name: "dsInterval 0s",
			query: &Query{
				TimeInterval:  "0s",
				Interval:      "2s",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want: "2s",
		},
		{
			name: "incorrect dsInterval",
			query: &Query{
				TimeInterval:  "a3",
				Interval:      "",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want:    "1ms",
			wantErr: true,
		},
		{
			name: "incorrect queryInterval",
			query: &Query{
				TimeInterval:  "",
				Interval:      "a3",
				IntervalMs:    0,
				MaxDataPoints: 0,
			},
			want:    "1ms",
			wantErr: true,
		},
		{
			name: "one month timerange and max point 43200 with 20 second base interval",
			query: &Query{
				MaxDataPoints: 43200,
				TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 24 * 30), To: time.Now()},
				Instant:       false,
			},
			want: "1m0s",
		},
		{
			name: "one month timerange interval max points 43200 with 1 second base interval",
			query: &Query{
				MaxDataPoints: 43200,
				TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 24 * 30), To: time.Now()},
			},
			want: "1m0s",
		},
		{
			name: "one month timerange interval max points 10000 with 5 second base interval",
			query: &Query{
				MaxDataPoints: 10000,
				TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 24 * 30), To: time.Now()},
			},
			want: "5m0s",
		},
		{
			name: "one month timerange interval max points 10000 with 5 second base interval",
			query: &Query{
				MaxDataPoints: 10000,
				TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 1), To: time.Now()},
			},
			want: "15s",
		},
		{
			name: "one month timerange interval max points 10000 with 5 second base interval",
			query: &Query{
				MaxDataPoints: 10000,
				TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 1), To: time.Now()},
			},
			want: "15s",
		},
		{
			name: "two days time range with minimal resolution",
			query: &Query{
				MaxDataPoints: 100,
				TimeRange: TimeRange{
					From: time.Now().Add(-time.Hour * 2 * 24),
					To:   time.Now(),
				},
			},
			want: "30m0s",
		},
		{
			name: "two days time range with minimal resolution",
			query: &Query{
				MaxDataPoints: 100000,
				TimeRange: TimeRange{
					From: time.Now().Add(-time.Hour * 24 * 90),
					To:   time.Now(),
				},
			},
			want: "1m0s",
		},
		{
			name: "instant query with the zero minInterval",
			query: &Query{
				Instant:       true,
				MaxDataPoints: 100000,
				TimeRange: TimeRange{
					From: time.Now().Add(-time.Hour * 24 * 90),
					To:   time.Now(),
				},
			},
			want: "5m0s",
		},
		{
			name: "instant query with empty interval value",
			query: &Query{
				Instant:       true,
				MaxDataPoints: 100000,
				TimeRange: TimeRange{
					From: time.Now().Add(-time.Hour * 24 * 90),
					To:   time.Now(),
				},
				Interval: "",
			},
			want: "5m0s",
		},
		{
			name: "instant query with set interval",
			query: &Query{
				Instant:       true,
				MaxDataPoints: 100000,
				TimeRange: TimeRange{
					From: time.Now().Add(-time.Hour * 24 * 90),
					To:   time.Now(),
				},
				Interval: "10s",
			},
			want: "10s",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			minInterval, err := tt.query.calculateMinInterval()
			if err == nil {
				if got := tt.query.calculateStep(minInterval); got.String() != tt.want {
					t.Errorf("calculateStep() = %v, want %v", got, tt.want)
				}
			} else if !tt.wantErr {
				t.Errorf("calculateStep() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func Test_calculateRateInterval(t *testing.T) {
	type args struct {
		interval       time.Duration
		scrapeInterval string
	}
	tests := []struct {
		name string
		args args
		want time.Duration
	}{
		{
			name: "empty intervals",
			args: args{
				interval:       0,
				scrapeInterval: "",
			},
			want: time.Minute * 1,
		},
		{
			name: "empty scrapeInterval",
			args: args{
				interval:       time.Second * 5,
				scrapeInterval: "",
			},
			want: time.Minute * 1,
		},
		{
			name: "empty interval",
			args: args{
				interval:       0,
				scrapeInterval: "10s",
			},
			want: time.Second * 40,
		},
		{
			name: "interval lower than scrapeInterval",
			args: args{
				interval:       time.Second * 5,
				scrapeInterval: "10s",
			},
			want: time.Second * 40,
		},
		{
			name: "interval higher than scrapeInterval",
			args: args{
				interval:       time.Second * 20,
				scrapeInterval: "10s",
			},
			want: time.Second * 40,
		},
		{
			name: "wrong scrape interval",
			args: args{
				interval:       time.Second * 20,
				scrapeInterval: "a3",
			},
			want: 0,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := calculateRateInterval(tt.args.interval, tt.args.scrapeInterval); got != tt.want {
				t.Errorf("calculateRateInterval() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_replaceTemplateVariable(t *testing.T) {
	type args struct {
		expr         string
		timerange    time.Duration
		interval     time.Duration
		timeInterval string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "empty expression",
			args: args{
				expr:         "",
				timerange:    0,
				interval:     0,
				timeInterval: "",
			},
			want: "",
		},
		{
			name: "empty time range and interval",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
				timerange:    0,
				interval:     0,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[1ms])",
		},
		{
			name: "empty time range and interval",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
				timerange:    0,
				interval:     time.Second * 2,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[2s])",
		},
		{
			name: "defined time range",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
				timerange:    time.Second * 3,
				interval:     0,
				timeInterval: "",
			},
			want: "rate(ingress_nginx_request_qps{}[1ms])",
		},
		{
			name: "defined rate interval and time range",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__rate_interval])",
				timerange:    time.Second * 3,
				interval:     0,
				timeInterval: "",
			},
			want: "rate(ingress_nginx_request_qps{}[0s])",
		},
		{
			name: "defined rate interval and time range",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__rate_interval])",
				timerange:    0,
				interval:     time.Minute * 4,
				timeInterval: "",
			},
			want: "rate(ingress_nginx_request_qps{}[4m0s])",
		},
		{
			name: "defined interval ms with zero value",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__interval_ms])",
				timerange:    time.Second * 1,
				interval:     0,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[0])",
		},
		{
			name: "defined interval ms",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__interval_ms])",
				timerange:    time.Second * 1,
				interval:     time.Second * 4,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[4000])",
		},
		{
			name: "defined range ms",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__range_ms])",
				timerange:    time.Second * 1,
				interval:     time.Second * 4,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[1000])",
		},
		{
			name: "defined range ms",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__range_s])",
				timerange:    time.Second * 1,
				interval:     time.Second * 4,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[1])",
		},
		{
			name: "defined range ms but time range in milliseconds",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__range])",
				timerange:    time.Millisecond * 500,
				interval:     time.Second * 4,
				timeInterval: "500ms",
			},
			want: "rate(ingress_nginx_request_qps{}[1s])",
		},
		{
			name: "defined range ms but time range",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__range])",
				timerange:    time.Second * 3,
				interval:     time.Second * 4,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[3s])",
		},
		{
			name: "defined range ms but time range",
			args: args{
				expr:         "rate(ingress_nginx_request_qps{}[$__rate_interval])",
				timerange:    time.Second * 3,
				interval:     time.Second * 5,
				timeInterval: "10s",
			},
			want: "rate(ingress_nginx_request_qps{}[5s])",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := replaceTemplateVariable(tt.args.expr, tt.args.timerange, tt.args.interval, tt.args.timeInterval); got != tt.want {
				t.Errorf("replaceTemplateVariable() = %v, want %v", got, tt.want)
			}
		})
	}
}
