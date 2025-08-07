package plugin

import (
	"testing"
	"time"
)

func Test_calculateStep(t *testing.T) {
	type opts struct {
		query   *Query
		want    string
		wantErr bool
	}
	f := func(opts opts) {
		minInterval, err := opts.query.calculateMinInterval()
		if err == nil {
			if got := opts.query.calculateStep(minInterval); got.String() != opts.want {
				t.Errorf("calculateStep() = %v, want %v", got, opts.want)
			}
		} else if !opts.wantErr {
			t.Errorf("calculateStep() error = %v, wantErr %v", err, opts.wantErr)
		}
	}

	// empty intervals
	o := opts{
		query: &Query{
			IntervalMs:    0,
			MaxDataPoints: 0,
		},
		want: "15s",
	}
	f(o)

	// enabled dsInterval intervals
	o = opts{
		query: &Query{
			TimeInterval:  "20s",
			IntervalMs:    0,
			MaxDataPoints: 0,
		},
		want: "20s",
	}
	f(o)

	// enabled dsInterval and query intervals
	o = opts{
		query: &Query{
			TimeInterval: "20s",
			Interval:     "10s",
		},
		want: "10s",
	}
	f(o)

	// enabled queryIntervalMS intervals
	o = opts{
		query: &Query{
			TimeInterval: "20s",
			Interval:     "10s",
			IntervalMs:   5000,
		},
		want: "10s",
	}
	f(o)

	// enabled queryIntervalMS and empty queryInterval intervals
	o = opts{
		query: &Query{
			TimeInterval: "20s",
			IntervalMs:   5000,
		},
		want: "5s",
	}
	f(o)

	// enabled queryIntervalMS and defaultInterval
	o = opts{
		query: &Query{
			IntervalMs: 5000,
		},
		want: "5s",
	}
	f(o)

	// enabled defaultInterval
	o = opts{
		query: &Query{},
		want:  "15s",
	}
	f(o)

	// enabled dsInterval only a number
	o = opts{
		query: &Query{
			TimeInterval: "123",
		},
		want: "2m3s",
	}
	f(o)

	// dsInterval 0s
	o = opts{
		query: &Query{
			TimeInterval: "0s",
			Interval:     "2s",
		},
		want: "2s",
	}
	f(o)

	// incorrect dsInterval
	o = opts{
		query: &Query{
			TimeInterval: "a3",
		},
		want:    "1ms",
		wantErr: true,
	}
	f(o)

	// incorrect queryInterval
	o = opts{
		query: &Query{
			Interval: "a3",
		},
		want:    "1ms",
		wantErr: true,
	}
	f(o)

	// one month timerange and max point 43200 with 20 second base interval
	o = opts{
		query: &Query{
			MaxDataPoints: 43200,
			TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 24 * 30), To: time.Now()},
		},
		want: "1m0s",
	}
	f(o)

	// one month timerange interval max points 43200 with 1 second base interval
	o = opts{
		query: &Query{
			MaxDataPoints: 43200,
			TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 24 * 30), To: time.Now()},
		},
		want: "1m0s",
	}
	f(o)

	// one month timerange interval max points 10000 with 5 second base interval
	o = opts{
		query: &Query{
			MaxDataPoints: 10000,
			TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 24 * 30), To: time.Now()},
		},
		want: "5m0s",
	}
	f(o)

	// one month timerange interval max points 10000 with 5 second base interval
	o = opts{
		query: &Query{
			MaxDataPoints: 10000,
			TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 1), To: time.Now()},
		},
		want: "15s",
	}
	f(o)

	// one month timerange interval max points 10000 with 5 second base interval
	o = opts{
		query: &Query{
			MaxDataPoints: 10000,
			TimeRange:     TimeRange{From: time.Now().Add(-time.Hour * 1), To: time.Now()},
		},
		want: "15s",
	}
	f(o)

	// two days time range with minimal resolution
	o = opts{
		query: &Query{
			MaxDataPoints: 100,
			TimeRange: TimeRange{
				From: time.Now().Add(-time.Hour * 2 * 24),
				To:   time.Now(),
			},
		},
		want: "30m0s",
	}
	f(o)

	// two days time range with minimal resolution
	o = opts{
		query: &Query{
			MaxDataPoints: 100000,
			TimeRange: TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 90),
				To:   time.Now(),
			},
		},
		want: "1m0s",
	}
	f(o)

	// instant query with the zero minInterval
	o = opts{
		query: &Query{
			Instant:       true,
			MaxDataPoints: 100000,
			TimeRange: TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 90),
				To:   time.Now(),
			},
		},
		want: "5m0s",
	}
	f(o)

	// instant query with empty interval value
	o = opts{
		query: &Query{
			Instant:       true,
			MaxDataPoints: 100000,
			TimeRange: TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 90),
				To:   time.Now(),
			},
		},
		want: "5m0s",
	}
	f(o)

	// instant query with set interval
	o = opts{
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
	}
	f(o)

	// instant query with default values
	o = opts{
		query: &Query{
			Instant:       true,
			MaxDataPoints: 43200,
			TimeRange: TimeRange{
				From: time.Now().Add(-time.Hour * 24 * 90),
				To:   time.Now(),
			},
			IntervalMs: 1000,
		},
		want: "5m0s",
	}
	f(o)
}

func Test_calculateRateInterval(t *testing.T) {
	type opts struct {
		interval       time.Duration
		scrapeInterval string
		want           time.Duration
	}
	f := func(opts opts) {
		t.Helper()
		if got := calculateRateInterval(opts.interval, opts.scrapeInterval); got != opts.want {
			t.Errorf("calculateRateInterval() = %v, want %v", got, opts.want)
		}
	}

	// empty intervals
	o := opts{
		want: time.Minute * 1,
	}
	f(o)

	// empty scrapeInterval
	o = opts{
		interval: time.Second * 5,
		want:     time.Minute * 1,
	}
	f(o)

	// empty interval
	o = opts{
		scrapeInterval: "10s",
		want:           time.Second * 40,
	}
	f(o)

	// interval lower than scrapeInterval
	o = opts{
		interval:       time.Second * 5,
		scrapeInterval: "10s",
		want:           time.Second * 40,
	}
	f(o)

	// interval higher than scrapeInterval
	o = opts{
		interval:       time.Second * 20,
		scrapeInterval: "10s",
		want:           time.Second * 40,
	}
	f(o)

	// wrong scrape interval
	o = opts{
		interval:       time.Second * 20,
		scrapeInterval: "a3",
		want:           0,
	}
	f(o)
}

func Test_replaceTemplateVariable(t *testing.T) {
	type opts struct {
		expr         string
		timerange    time.Duration
		interval     time.Duration
		timeInterval string
		want         string
	}
	f := func(opts opts) {
		t.Helper()
		if got := replaceTemplateVariable(opts.expr, opts.timerange, opts.interval, opts.timeInterval); got != opts.want {
			t.Errorf("replaceTemplateVariable() = %v, want %v", got, opts.want)
		}
	}

	// empty expression
	o := opts{}
	f(o)

	// empty time range and interval
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[1ms])",
	}
	f(o)

	// empty time range and interval
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
		interval:     time.Second * 2,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[2s])",
	}
	f(o)

	// defined time range
	o = opts{
		expr:      "rate(ingress_nginx_request_qps{}[$__interval])",
		timerange: time.Second * 3,
		want:      "rate(ingress_nginx_request_qps{}[1ms])",
	}
	f(o)

	// defined rate interval and time range
	o = opts{
		expr:      "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		timerange: time.Second * 3,
		want:      "rate(ingress_nginx_request_qps{}[4ms])",
	}
	f(o)

	// defined rate interval and time range
	o = opts{
		expr:     "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		interval: time.Minute * 4,
		want:     "rate(ingress_nginx_request_qps{}[16m0s])",
	}
	f(o)

	// defined interval ms with zero value
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__interval_ms])",
		timerange:    time.Second * 1,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[0])",
	}
	f(o)

	// defined interval ms
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__interval_ms])",
		timerange:    time.Second * 1,
		interval:     time.Second * 4,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[4000])",
	}
	f(o)

	// defined range ms
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__range_ms])",
		timerange:    time.Second * 1,
		interval:     time.Second * 4,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[1000])",
	}
	f(o)

	// defined range ms
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__range_s])",
		timerange:    time.Second * 1,
		interval:     time.Second * 4,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[1])",
	}
	f(o)

	// defined range ms but time range in milliseconds
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__range])",
		timerange:    time.Millisecond * 500,
		interval:     time.Second * 4,
		timeInterval: "500ms",
		want:         "rate(ingress_nginx_request_qps{}[1s])",
	}
	f(o)

	// defined range ms but time range
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__range])",
		timerange:    time.Second * 3,
		interval:     time.Second * 4,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[3s])",
	}
	f(o)

	// defined range ms but time range
	o = opts{
		expr:         "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		timerange:    time.Second * 3,
		interval:     time.Second * 5,
		timeInterval: "10s",
		want:         "rate(ingress_nginx_request_qps{}[40s])",
	}
	f(o)
}
