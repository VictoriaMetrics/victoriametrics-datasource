package plugin

import (
	"net/url"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestQuery_getQueryURL(t *testing.T) {
	type fields struct {
		RefID         string
		Instant       bool
		Range         bool
		Interval      string
		IntervalMs    int64
		TimeInterval  string
		Expr          string
		MaxDataPoints int64
		getTimeRange  func() TimeRange
		url           *url.URL
	}
	tests := []struct {
		name    string
		fields  fields
		rawURL  string
		params  string
		want    string
		wantErr bool
	}{
		{
			name: "empty values",
			fields: fields{
				RefID:        "1",
				Instant:      false,
				Range:        false,
				Interval:     "",
				IntervalMs:   0,
				TimeInterval: "",
				Expr:         "",
				getTimeRange: getTimeRage,
			},
			rawURL:  "",
			wantErr: true,
			want:    "",
		},
		{
			name: "empty instant expression",
			fields: fields{
				RefID:        "1",
				Instant:      true,
				Range:        false,
				Interval:     "10s",
				TimeInterval: "",
				Expr:         "",
				getTimeRange: getTimeRage,
			},
			rawURL:  "http://127.0.0.1:8428",
			wantErr: true,
			want:    "",
		},
		{
			name: "empty instant query with interval",
			fields: fields{
				RefID:        "1",
				Instant:      true,
				Range:        false,
				Interval:     "10s",
				IntervalMs:   5_000_000,
				TimeInterval: "",
				Expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
				getTimeRange: getTimeRage,
			},
			rawURL:  "http://127.0.0.1:8428",
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B10s%5D%29&step=10s&time=1670226793",
		},
		{
			name: "instant query with time interval",
			fields: fields{
				RefID:         "1",
				Instant:       true,
				Range:         false,
				Interval:      "20s",
				IntervalMs:    0,
				TimeInterval:  "5s",
				Expr:          "rate(ingress_nginx_request_qps{}[$__rate_interval])",
				MaxDataPoints: 20000,
				getTimeRange:  getTimeRage,
				url:           nil,
			},
			rawURL:  "http://127.0.0.1:8428",
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B20s%5D%29&step=20s&time=1670226793",
		},
		{
			name: "range query with interval",
			fields: fields{
				RefID:         "1",
				Instant:       false,
				Range:         true,
				Interval:      "5s",
				IntervalMs:    20000,
				TimeInterval:  "30s",
				Expr:          "rate(ingress_nginx_request_qps{}[$__rate_interval])",
				MaxDataPoints: 3000,
				getTimeRange:  getTimeRage,
			},
			rawURL:  "http://127.0.0.1:8428",
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28ingress_nginx_request_qps%7B%7D%5B5s%5D%29&start=1670226733&step=5s",
		},
		{
			name: "custom query params",
			fields: fields{
				RefID:        "1",
				Instant:      true,
				Range:        false,
				Interval:     "10s",
				IntervalMs:   5_000_000,
				TimeInterval: "",
				Expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
				getTimeRange: getTimeRage,
			},
			rawURL:  "http://127.0.0.1:8428",
			params:  "extra_filters[]={job=\"vmalert\"}",
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?extra_filters%5B%5D=%7Bjob%3D%22vmalert%22%7D&query=rate%28ingress_nginx_request_qps%7B%7D%5B10s%5D%29&step=10s&time=1670226793",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := Query{
				RefID:         tt.fields.RefID,
				Instant:       tt.fields.Instant,
				Range:         tt.fields.Range,
				Interval:      tt.fields.Interval,
				IntervalMs:    tt.fields.IntervalMs,
				TimeInterval:  tt.fields.TimeInterval,
				Expr:          tt.fields.Expr,
				MaxDataPoints: tt.fields.MaxDataPoints,
				TimeRange:     tt.fields.getTimeRange(),
				url:           tt.fields.url,
			}

			minInterval, err := q.calculateMinInterval()
			if err != nil {
				t.Errorf("failed to calculate minimal interval: %s", err)
				return
			}

			got, err := q.getQueryURL(minInterval, tt.rawURL, tt.params)
			if (err != nil) != tt.wantErr {
				t.Errorf("getQueryURL() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("getQueryURL() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func getTimeRage() TimeRange {
	from := time.Unix(1670226733, 0)
	to := time.Unix(1670226793, 0)
	return TimeRange{From: from, To: to}
}

func Test_labelsToString(t *testing.T) {
	tests := []struct {
		name   string
		labels data.Labels
		want   string
	}{
		{
			name:   "empty labels",
			labels: nil,
			want:   "{}",
		},
		{
			name: "set of labels",
			labels: data.Labels{
				"job":      "vmstorage-maas",
				"instance": "127.0.0.1",
			},
			want: `{instance="127.0.0.1",job="vmstorage-maas"}`,
		},
		{
			name: "has name label",
			labels: data.Labels{
				"__name__": "vm_http_requests_total",
				"job":      "vmstorage-maas",
				"instance": "127.0.0.1",
			},
			want: `vm_http_requests_total{instance="127.0.0.1",job="vmstorage-maas"}`,
		},
		{
			name: "name label not from the start",
			labels: data.Labels{
				"job":      "vmstorage-maas",
				"__name__": "vm_http_requests_total",
				"instance": "127.0.0.1",
			},
			want: `vm_http_requests_total{instance="127.0.0.1",job="vmstorage-maas"}`,
		},
		{
			name: "has only name label",
			labels: data.Labels{
				"__name__": "vm_http_requests_total",
			},
			want: `vm_http_requests_total`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := labelsToString(tt.labels); got != tt.want {
				t.Errorf("metricsFromLabels() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestQuery_parseLegend1(t *testing.T) {
	tests := []struct {
		name         string
		legendFormat string
		expr         string
		labels       data.Labels
		want         string
	}{
		{
			name:         "empty labels and legend format no expression",
			legendFormat: "",
			labels:       nil,
			expr:         "",
			want:         "",
		},
		{
			name:         "empty labels and legend format has expression",
			legendFormat: "",
			labels:       nil,
			expr:         "sum(vm_http_request_total)",
			want:         "sum(vm_http_request_total)",
		},
		{
			name:         "empty labels and legend auto has expression",
			legendFormat: "__auto",
			labels:       nil,
			expr:         "sum(vm_http_request_total)",
			want:         "sum(vm_http_request_total)",
		},
		{
			name:         "empty labels and legend auto has expression",
			legendFormat: "{{job}}",
			labels:       nil,
			expr:         "sum(vm_http_request_total)",
			want:         "sum(vm_http_request_total)",
		},
		{
			name:         "empty labels and legend with metric name",
			legendFormat: "{{__name__}}",
			labels:       nil,
			expr:         "sum(vm_http_request_total)",
			want:         "sum(vm_http_request_total)",
		},
		{
			name:         "has labels and legend auto has expression",
			legendFormat: "__auto",
			labels: data.Labels{
				"job": "vmstorage-maas",
			},
			expr: "sum(vm_http_request_total)",
			want: "sum(vm_http_request_total)",
		},
		{
			name:         "has labels and legend auto has expression",
			legendFormat: "{{job}}",
			labels: data.Labels{
				"job": "vmstorage-maas",
			},
			expr: "sum(vm_http_request_total)",
			want: "vmstorage-maas",
		},
		{
			name:         "do not have label",
			legendFormat: "{{job}}",
			labels: data.Labels{
				"instance": "127.0.0.1",
			},
			expr: "sum(vm_http_request_total)",
			want: "sum(vm_http_request_total)",
		},
		{
			name:         "has complex label",
			legendFormat: "{{job}} {{instance}}",
			labels: data.Labels{
				"job":      "vmstorage-maas",
				"instance": "127.0.0.1",
			},
			expr: "sum(vm_http_request_total)",
			want: "vmstorage-maas 127.0.0.1",
		},
		{
			name:         "auto label and only name present",
			legendFormat: "__auto",
			labels: data.Labels{
				"__name__": "vm_http_request_total",
			},
			expr: "sum(vm_http_request_total)",
			want: "sum(vm_http_request_total)",
		},
		{
			name:         "use just name in legend format",
			legendFormat: "{{__name__}}",
			labels: data.Labels{
				"__name__": "vm_http_request_total",
			},
			expr: "sum(vm_http_request_total)",
			want: "vm_http_request_total",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := &Query{
				LegendFormat: tt.legendFormat,
				Expr:         tt.expr,
			}
			if got := q.parseLegend(tt.labels); got != tt.want {
				t.Errorf("parseLegend() = %v, want %v", got, tt.want)
			}
		})
	}
}
