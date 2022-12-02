package plugin

import (
	"net/url"
	"testing"
	"time"
)

func TestQuery_getQueryURL(t *testing.T) {
	type fields struct {
		RefId         string
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
	type args struct {
		minInterval time.Duration
		rawURL      string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "empty values",
			fields: fields{
				RefId:         "1",
				Instant:       false,
				Range:         false,
				Interval:      "",
				IntervalMs:    0,
				TimeInterval:  "",
				Expr:          "",
				MaxDataPoints: 0,
				getTimeRange:  getTimeRage,
				url:           nil,
			},
			args: args{
				minInterval: 0,
				rawURL:      "",
			},
			wantErr: true,
			want:    "",
		},
		{
			name: "empty instant expression",
			fields: fields{
				RefId:         "1",
				Instant:       true,
				Range:         false,
				Interval:      "10s",
				IntervalMs:    0,
				TimeInterval:  "",
				Expr:          "",
				MaxDataPoints: 0,
				getTimeRange:  getTimeRage,
				url:           nil,
			},
			args: args{
				minInterval: 0,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: true,
			want:    "",
		},
		{
			name: "empty instant query with interval",
			fields: fields{
				RefId:         "1",
				Instant:       true,
				Range:         false,
				Interval:      "10s",
				IntervalMs:    5_000_000,
				TimeInterval:  "",
				Expr:          "rate(ingress_nginx_request_qps{}[$__interval])",
				MaxDataPoints: 0,
				getTimeRange:  getTimeRage,
				url:           nil,
			},
			args: args{
				minInterval: 0,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B1ms%5D%29&step=40ms&time=1670226793",
		},
		{
			name: "instant query with time interval",
			fields: fields{
				RefId:         "1",
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
			args: args{
				minInterval: 0,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B1m20s%5D%29&step=3ms&time=1670226793",
		},
		{
			name: "range query with interval",
			fields: fields{
				RefId:         "1",
				Instant:       false,
				Range:         true,
				Interval:      "5s",
				IntervalMs:    20000,
				TimeInterval:  "30s",
				Expr:          "rate(ingress_nginx_request_qps{}[$__rate_interval])",
				MaxDataPoints: 3000,
				getTimeRange:  getTimeRage,
				url:           nil,
			},
			args: args{
				minInterval: time.Second * 10,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28ingress_nginx_request_qps%7B%7D%5B20s%5D%29&start=1670226733&step=10s",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := &Query{
				RefId:         tt.fields.RefId,
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
			got, err := q.getQueryURL(tt.args.minInterval, tt.args.rawURL)
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
	from := time.Date(2022, 12, 5, 9, 52, 13, 0, time.Local)
	to := from.Add(time.Minute * 1)
	return TimeRange{From: from, To: to}
}
