package plugin

import (
	"net/url"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestQuery_getQueryURL(t *testing.T) {
	type opts struct {
		RefID         string
		Instant       bool
		Range         bool
		Interval      string
		IntervalMs    int64
		TimeInterval  string
		Expr          string
		MaxDataPoints int64
		getTimeRange  func() TimeRange
		rawURL        string
		params        string
		want          string
		wantErr       bool
	}
	f := func(opts opts) {
		t.Helper()
		q := Query{
			RefID:         opts.RefID,
			Instant:       opts.Instant,
			Range:         opts.Range,
			Interval:      opts.Interval,
			IntervalMs:    opts.IntervalMs,
			TimeInterval:  opts.TimeInterval,
			Expr:          opts.Expr,
			MaxDataPoints: opts.MaxDataPoints,
			TimeRange:     opts.getTimeRange(),
		}
		params, err := url.ParseQuery(opts.params)
		if err != nil {
			t.Errorf("failed to parse query params: %v", err)
			return
		}
		got, err := q.getQueryURL(opts.rawURL, params)
		if (err != nil) != opts.wantErr {
			t.Errorf("getQueryURL() error = %v, wantErr %v", err, opts.wantErr)
			return
		}
		if got != opts.want {
			t.Errorf("getQueryURL() got = %v, want %v", got, opts.want)
		}
	}

	// empty values
	o := opts{
		RefID:        "1",
		Instant:      false,
		Range:        false,
		Interval:     "",
		IntervalMs:   0,
		TimeInterval: "",
		Expr:         "",
		getTimeRange: getTimeRage,
		rawURL:       "",
		wantErr:      true,
		want:         "",
	}
	f(o)

	// empty instant expression
	o = opts{
		RefID:        "1",
		Instant:      true,
		Range:        false,
		Interval:     "10s",
		TimeInterval: "",
		Expr:         "",
		getTimeRange: getTimeRage,
		rawURL:       "http://127.0.0.1:8428",
		wantErr:      true,
		want:         "",
	}
	f(o)

	// empty instant query with interval
	o = opts{
		RefID:        "1",
		Instant:      true,
		Range:        false,
		Interval:     "10s",
		IntervalMs:   5_000_000,
		TimeInterval: "",
		Expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
		getTimeRange: getTimeRage,
		rawURL:       "http://127.0.0.1:8428",
		wantErr:      false,
		want:         "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B10s%5D%29&step=10s&time=1670226793",
	}
	f(o)

	// instant query with time interval
	o = opts{
		RefID:         "1",
		Instant:       true,
		Range:         false,
		Interval:      "20s",
		IntervalMs:    0,
		TimeInterval:  "5s",
		Expr:          "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		MaxDataPoints: 20000,
		getTimeRange:  getTimeRage,
		rawURL:        "http://127.0.0.1:8428",
		wantErr:       false,
		want:          "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B1m20s%5D%29&step=20s&time=1670226793",
	}
	f(o)

	// $__rate_interval query with interval
	o = opts{
		RefID:         "1",
		Instant:       false,
		Range:         true,
		Interval:      "5s",
		IntervalMs:    20000,
		TimeInterval:  "30s",
		Expr:          "rate(ingress_nginx_request_qps{}[$__rate_interval])",
		MaxDataPoints: 3000,
		getTimeRange:  getTimeRage,
		rawURL:        "http://127.0.0.1:8428",
		wantErr:       false,
		want:          "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28ingress_nginx_request_qps%7B%7D%5B20s%5D%29&start=1670226733&step=5s",
	}
	f(o)

	// $__rate_interval intervalMs 100s, minStep override 150s and scrape interval 30s
	o = opts{
		RefID:        "1",
		Instant:      false,
		Range:        true,
		Expr:         "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:     "150s",
		IntervalMs:   100000,
		getTimeRange: getTimeRage,
		rawURL:       "http://127.0.0.1:8428",
		wantErr:      false,
		want:         "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28rpc_durations_seconds_count%5B10m0s%5D%29&start=1670226733&step=2m30s",
	}
	f(o)

	// $__rate_interval intervalMs 120s, minStep override 150s
	o = opts{
		RefID:        "1",
		Instant:      false,
		Range:        true,
		Expr:         "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:     "150s",
		IntervalMs:   120000,
		getTimeRange: getTimeRage,
		rawURL:       "http://127.0.0.1:8428",
		wantErr:      false,
		want:         "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28rpc_durations_seconds_count%5B10m0s%5D%29&start=1670226733&step=2m30s",
	}
	f(o)

	// $__rate_interval intervalMs 120s, minStep auto (interval not overridden)
	o = opts{
		RefID:        "1",
		Instant:      false,
		Range:        true,
		Expr:         "rate(rpc_durations_seconds_count[$__rate_interval])",
		Interval:     "120s",
		IntervalMs:   120000,
		getTimeRange: getTimeRage,
		rawURL:       "http://127.0.0.1:8428",
		wantErr:      false,
		want:         "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28rpc_durations_seconds_count%5B8m0s%5D%29&start=1670226733&step=2m0s",
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
		rawURL:  "http://127.0.0.1:8428",
		wantErr: false,
		want:    "http://127.0.0.1:8428/api/v1/query_range?end=1670230333&query=rate%28rpc_durations_seconds_count%5B2m0s%5D%29&start=1670226733&step=30s",
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
		rawURL:  "http://127.0.0.1:8428",
		wantErr: false,
		want:    "http://127.0.0.1:8428/api/v1/query_range?end=1670230333&query=rate%28rpc_durations_seconds_count%5B30s%5D%29&start=1670226733&step=30s",
	}
	f(o)

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
		rawURL:  "http://127.0.0.1:8428",
		wantErr: false,
		want:    "http://127.0.0.1:8428/api/v1/query_range?end=1670399533&query=rate%28rpc_durations_seconds_count%5B2m0s%5D%29&start=1670226733&step=2m0s",
	}
	f(o)
}

func getTimeRage() TimeRange {
	from := time.Unix(1670226733, 0)
	to := time.Unix(1670226793, 0)
	return TimeRange{From: from, To: to}
}

func Test_labelsToString(t *testing.T) {
	type opts struct {
		labels data.Labels
		want   string
	}
	f := func(opts opts) {
		t.Helper()
		if got := labelsToString(opts.labels); got != opts.want {
			t.Errorf("metricsFromLabels() = %v, want %v", got, opts.want)
		}
	}

	// labels is nil
	o := opts{
		labels: nil,
		want:   "{}",
	}
	f(o)

	// empty labels
	o = opts{
		labels: data.Labels{},
		want:   "{}",
	}
	f(o)

	// with single label
	o = opts{
		labels: data.Labels{
			"job": "vmstorage-maas",
		},
		want: `vmstorage-maas`,
	}
	f(o)

	// set of labels
	o = opts{
		labels: data.Labels{
			"job":      "vmstorage-maas",
			"instance": "127.0.0.1",
		},
		want: `{instance="127.0.0.1",job="vmstorage-maas"}`,
	}
	f(o)

	// has name label
	o = opts{
		labels: data.Labels{
			"__name__": "vm_http_requests_total",
			"job":      "vmstorage-maas",
			"instance": "127.0.0.1",
		},
		want: `vm_http_requests_total{instance="127.0.0.1",job="vmstorage-maas"}`,
	}
	f(o)

	// name label not from the start
	o = opts{
		labels: data.Labels{
			"job":      "vmstorage-maas",
			"__name__": "vm_http_requests_total",
			"instance": "127.0.0.1",
		},
		want: `vm_http_requests_total{instance="127.0.0.1",job="vmstorage-maas"}`,
	}
	f(o)

	// has only name label
	o = opts{
		labels: data.Labels{
			"__name__": "vm_http_requests_total",
		},
		want: `vm_http_requests_total`,
	}
	f(o)
}

func TestQuery_parseLegend(t *testing.T) {
	type opts struct {
		legendFormat string
		expr         string
		labels       data.Labels
		want         string
	}
	f := func(opts opts) {
		t.Helper()
		q := &Query{
			LegendFormat: opts.legendFormat,
			Expr:         opts.expr,
		}
		if got := q.parseLegend(opts.labels); got != opts.want {
			t.Errorf("parseLegend() = %v, want %v", got, opts.want)
		}
	}

	// empty labels and legend format no expression
	o := opts{}
	f(o)

	// empty labels and legend format has expression
	o = opts{
		expr: "sum(vm_http_request_total)",
		want: "sum(vm_http_request_total)",
	}
	f(o)

	// empty labels and legend auto has expression
	o = opts{
		legendFormat: "__auto",
		expr:         "sum(vm_http_request_total)",
		want:         "sum(vm_http_request_total)",
	}
	f(o)

	// empty labels and legend auto has expression
	o = opts{
		legendFormat: "{{job}}",
		expr:         "sum(vm_http_request_total)",
		want:         "sum(vm_http_request_total)",
	}
	f(o)

	// empty labels and legend with metric name
	o = opts{
		legendFormat: "{{__name__}}",
		expr:         "sum(vm_http_request_total)",
		want:         "sum(vm_http_request_total)",
	}
	f(o)

	// has labels and legend auto has expression
	o = opts{
		legendFormat: "__auto",
		labels: data.Labels{
			"job": "vmstorage-maas",
		},
		expr: "sum(vm_http_request_total)",
		want: "vmstorage-maas",
	}
	f(o)

	// has labels and legend auto has expression
	o = opts{
		legendFormat: "{{job}}",
		labels: data.Labels{
			"job": "vmstorage-maas",
		},
		expr: "sum(vm_http_request_total)",
		want: "vmstorage-maas",
	}
	f(o)

	// do not have label
	o = opts{
		legendFormat: "{{job}}",
		labels: data.Labels{
			"instance": "127.0.0.1",
		},
		expr: "sum(vm_http_request_total)",
		want: "sum(vm_http_request_total)",
	}
	f(o)

	// has complex label
	o = opts{
		legendFormat: "{{job}} {{instance}}",
		labels: data.Labels{
			"job":      "vmstorage-maas",
			"instance": "127.0.0.1",
		},
		expr: "sum(vm_http_request_total)",
		want: "vmstorage-maas 127.0.0.1",
	}
	f(o)

	// auto label and only name present
	o = opts{
		legendFormat: "__auto",
		labels: data.Labels{
			"__name__": "vm_http_request_total",
		},
		expr: "sum(vm_http_request_total)",
		want: "vm_http_request_total",
	}

	f(o) // auto label and empty labels
	o = opts{
		legendFormat: "__auto",
		labels:       data.Labels{},
		expr:         "sum(vm_http_request_total)",
		want:         "sum(vm_http_request_total)",
	}
	f(o)

	// use just name in legend format
	o = opts{
		legendFormat: "{{__name__}}",
		labels: data.Labels{
			"__name__": "vm_http_request_total",
		},
		expr: "sum(vm_http_request_total)",
		want: "vm_http_request_total",
	}
	f(o)
}
