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
		RefID                string
		Instant              bool
		Range                bool
		Interval             string
		IntervalMs           int64
		TimeInterval         string
		Expr                 string
		MaxDataPoints        int64
		BackendQueryInterval time.Duration
		getTimeRange         func() TimeRange
		calculatedStep       time.Duration
		want                 string
	}
	f := func(opts opts) {
		t.Helper()
		tr := opts.getTimeRange()
		from := tr.From
		to := tr.To
		timeRange := to.Sub(from)
		if got := replaceTemplateVariable(opts.Expr, opts.BackendQueryInterval, opts.calculatedStep, opts.Interval, opts.TimeInterval, timeRange); got != opts.want {
			t.Errorf("replaceTemplateVariable() = %v, want %v", got, opts.want)
		}
	}

	// empty values
	o := opts{
		RefID:          "1",
		Instant:        false,
		Range:          false,
		Interval:       "",
		IntervalMs:     0,
		TimeInterval:   "",
		Expr:           "",
		getTimeRange:   getTimeRage,
		calculatedStep: 0,
		want:           "",
	}
	f(o)

	// empty instant expression
	o = opts{
		RefID:          "1",
		Instant:        true,
		Range:          false,
		Interval:       "10s",
		TimeInterval:   "",
		Expr:           "",
		getTimeRange:   getTimeRage,
		calculatedStep: 0,
		want:           "",
	}
	f(o)

	// empty instant query with interval
	o = opts{
		RefID:          "1",
		Instant:        true,
		Range:          false,
		Interval:       "10s",
		IntervalMs:     5_000_000,
		TimeInterval:   "",
		Expr:           "rate(ingress_nginx_request_qps{}[$__interval])",
		getTimeRange:   getTimeRage,
		calculatedStep: time.Second * 10,
		want:           "rate(ingress_nginx_request_qps{}[10s])",
	}
	f(o)

	// instant query with time interval
	o = opts{
		RefID:          "1",
		Instant:        true,
		Range:          false,
		Interval:       "20s",
		IntervalMs:     0,
		TimeInterval:   "5s",
		Expr:           "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		MaxDataPoints:  20000,
		getTimeRange:   getTimeRage,
		calculatedStep: time.Second * 20,
		want:           "rate(ingress_nginx_request_qps{}[1m20s])",
	}
	f(o)

	// custom query params
	o = opts{
		RefID:          "1",
		Instant:        true,
		Range:          false,
		Interval:       "10s",
		IntervalMs:     5_000_000,
		TimeInterval:   "",
		Expr:           "rate(ingress_nginx_request_qps{}[$__interval])",
		getTimeRange:   getTimeRage,
		calculatedStep: time.Second * 10,
		want:           "rate(ingress_nginx_request_qps{}[10s])",
	}
	f(o)

	// $__rate_interval query with interval
	o = opts{
		RefID:          "1",
		Instant:        false,
		Range:          true,
		Interval:       "5s",
		IntervalMs:     20000,
		TimeInterval:   "30s",
		Expr:           "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		MaxDataPoints:  3000,
		getTimeRange:   getTimeRage,
		calculatedStep: time.Second * 5,
		want:           "rate(ingress_nginx_request_qps{}[20s])",
	}
	f(o)

	// $__rate_interval intervalMs 100s, minStep override 150s and scrape interval 30s
	o = opts{
		RefID:          "1",
		Instant:        false,
		Range:          true,
		Expr:           "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:       "150s",
		IntervalMs:     100000,
		getTimeRange:   getTimeRage,
		calculatedStep: time.Minute*2 + time.Second*30,
		want:           "rate(rpc_durations_seconds_count[10m0s])",
	}
	f(o)

	// $__rate_interval intervalMs 120s, minStep override 150s
	o = opts{
		RefID:          "1",
		Instant:        false,
		Range:          true,
		Expr:           "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:       "150s",
		IntervalMs:     120000,
		getTimeRange:   getTimeRage,
		calculatedStep: time.Minute*2 + time.Second*30,
		want:           "rate(rpc_durations_seconds_count[10m0s])",
	}
	f(o)

	// $__rate_interval intervalMs 120s, minStep auto (interval not overridden)
	o = opts{
		RefID:          "1",
		Instant:        false,
		Range:          true,
		Expr:           "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:       "120s",
		IntervalMs:     120000,
		getTimeRange:   getTimeRage,
		calculatedStep: time.Minute * 2,
		want:           "rate(rpc_durations_seconds_count[8m0s])",
	}
	f(o)

	// interval and minStep are automatically calculated and time range 1 hour
	o = opts{
		RefID:      "1",
		Instant:    false,
		Range:      true,
		Expr:       "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:   "30s",
		IntervalMs: 30000,
		getTimeRange: func() TimeRange {
			from := time.Unix(1670226733, 0)
			to := from.Add(time.Hour * 1)
			return TimeRange{From: from, To: to}
		},
		calculatedStep: time.Second * 30,
		want:           "rate(rpc_durations_seconds_count[2m0s])",
	}
	f(o)

	// minStep is $__rate_interval and time range 1 hour
	o = opts{
		RefID:      "1",
		Instant:    false,
		Range:      true,
		Expr:       "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:   "$__rate_interval",
		IntervalMs: 30000,
		getTimeRange: func() TimeRange {
			from := time.Unix(1670226733, 0)
			to := from.Add(time.Hour * 1)
			return TimeRange{From: from, To: to}
		},
		calculatedStep: time.Second * 30,
		want:           "rate(rpc_durations_seconds_count[30s])",
	}
	f(o)
	//
	// minStep is $__rate_interval and time range 2 days
	o = opts{
		RefID:      "1",
		Instant:    false,
		Range:      true,
		Expr:       "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:   "$__rate_interval",
		IntervalMs: 120000,
		getTimeRange: func() TimeRange {
			from := time.Unix(1670226733, 0)
			to := from.Add(time.Hour * 24 * 2)
			return TimeRange{From: from, To: to}
		},
		calculatedStep: time.Minute * 2,
		want:           "rate(rpc_durations_seconds_count[2m0s])",
	}
	f(o)
}
