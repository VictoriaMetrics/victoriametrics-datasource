package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
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
	type args struct {
		minInterval time.Duration
		rawURL      string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
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
				RefID:        "1",
				Instant:      true,
				Range:        false,
				Interval:     "10s",
				TimeInterval: "",
				Expr:         "",
				getTimeRange: getTimeRage,
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
				RefID:        "1",
				Instant:      true,
				Range:        false,
				Interval:     "10s",
				IntervalMs:   5_000_000,
				TimeInterval: "",
				Expr:         "rate(ingress_nginx_request_qps{}[$__interval])",
				getTimeRange: getTimeRage,
			},
			args: args{
				minInterval: 0,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B1ms%5D%29&step=50ms&time=1670226793",
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
			args: args{
				minInterval: 0,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?query=rate%28ingress_nginx_request_qps%7B%7D%5B0s%5D%29&step=1ms&time=1670226793",
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
			args: args{
				minInterval: time.Second * 10,
				rawURL:      "http://127.0.0.1:8428",
			},
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query_range?end=1670226793&query=rate%28ingress_nginx_request_qps%7B%7D%5B10s%5D%29&start=1670226733&step=10s",
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
			args: args{
				minInterval: 0,
				rawURL:      "http://127.0.0.1:8428",
			},
			params:  "extra_filters[]={job=\"vmalert\"}",
			wantErr: false,
			want:    "http://127.0.0.1:8428/api/v1/query?extra_filters%5B%5D=%7Bjob%3D%22vmalert%22%7D&query=rate%28ingress_nginx_request_qps%7B%7D%5B1ms%5D%29&step=50ms&time=1670226793",
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
			got, err := q.getQueryURL(tt.args.minInterval, tt.args.rawURL, tt.params)
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

func TestDatasourceQueryRequest(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(_ http.ResponseWriter, _ *http.Request) {
		t.Fatalf("should not be called")
	})
	c := -1
	mux.HandleFunc("/api/v1/query", func(w http.ResponseWriter, r *http.Request) {
		c++
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST method got %s", r.Method)
		}

		switch c {
		case 0:
			w.WriteHeader(500)
		case 1:
			_, err := w.Write([]byte("[]"))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 2:
			_, err := w.Write([]byte(`{"status":"error", "errorType":"type:", "error":"some error msg"}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 3:
			_, err := w.Write([]byte(`{"status":"unknown"}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 4:
			_, err := w.Write([]byte(`{"status":"success","data":{"resultType":"matrix"}}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 5:
			_, err := w.Write([]byte(`{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"__name__":"ingress_nginx_request_qps","status":"100"},"values":[[1670324477.542,"1"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"500"},"values":[[1670324477.542,"2"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"200"},"values":[[1670324477.542,"3"]]}]}}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 6:
			_, err := w.Write([]byte(`{"status":"success","data":{"resultType":"scalar","result":[1583786142, "1"]}}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		}
	})

	srv := httptest.NewServer(mux)
	defer srv.Close()

	ctx := context.Background()
	settings := backend.DataSourceInstanceSettings{
		URL:      srv.URL,
		JSONData: []byte(`{"httpMethod":"POST","customQueryParameters":""}`),
	}

	instance, err := NewDatasource(ctx, settings)
	if err != nil {
		t.Fatalf("unexpected %s", err)
	}

	datasource := instance.(*Datasource)

	expErr := func(ctx context.Context, err string) {
		rsp, gotErr := datasource.QueryData(ctx, &backend.QueryDataRequest{
			Queries: []backend.DataQuery{
				{
					RefID:     "A",
					QueryType: instantQueryPath,
					JSON: []byte(`{
    "refId": "A",
    "instant": true,
    "range": false,
    "interval": "10s",
    "intervalMs": 10000,
    "timeInterval": "",
    "expr": "sum(vm_http_request_total)",
    "legendFormat": "__auto"
}`),
				},
			},
		})
		response := rsp.Responses["A"]

		if response.Error == nil {
			t.Fatalf("expected %v got nil", err)
		}

		if !strings.Contains(response.Error.Error(), err) {
			t.Fatalf("expected err %q; got %q", err, gotErr)
		}
	}

	expErr(ctx, "got unexpected response status code: 500")                                                           // 0
	expErr(ctx, "failed to decode body response: json: cannot unmarshal array into Go value of type plugin.Response") // 1
	expErr(ctx, "failed to prepare data from response: unknown result type \"\"")                                     // 2
	expErr(ctx, "failed to prepare data from response: unknown result type \"\"")                                     // 3
	expErr(ctx, "failed to prepare data from response: unmarshal err unexpected end of JSON input")                   // 4

	// 5
	queryJSON := []byte(`{
    "refId": "A",
    "instant": true,
    "range": false,
    "interval": "10s",
    "intervalMs": 10000,
    "timeInterval": "",
    "expr": "sum(ingress_nginx_request_qps)",
    "legendFormat": "__auto"
}`)
	var q Query
	if err := json.Unmarshal(queryJSON, &q); err != nil {
		t.Fatalf("error parse query %s", err)
	}
	rsp, gotErr := datasource.QueryData(ctx, &backend.QueryDataRequest{Queries: []backend.DataQuery{
		{
			RefID:     "A",
			QueryType: rangeQueryPath,
			JSON:      queryJSON,
		},
	},
	})
	if gotErr != nil {
		t.Fatalf("unexpected %s", gotErr)
	}

	response := rsp.Responses["A"]
	if len(response.Frames) != 3 {
		t.Fatalf("expected 2 metrics got %d in %+v", len(response.Frames), response.Frames)
	}

	expected := []*data.Frame{
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "100"}, []float64{1}),
		),
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "500"}, []float64{2}),
		),
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "200"}, []float64{3}),
		),
	}

	for j := range expected {
		q.addMetadataToMultiFrame(expected[j])
	}
	for i := range response.Frames {
		q.addMetadataToMultiFrame(response.Frames[i])
	}

	for i, frame := range response.Frames {
		d, err := frame.MarshalJSON()
		if err != nil {
			t.Fatalf("error marshal response frames %s", err)
		}
		exd, err := expected[i].MarshalJSON()
		if err != nil {
			t.Fatalf("error marshal expected frames %s", err)
		}

		if !bytes.Equal(d, exd) {
			t.Fatalf("unexpected metric %s want %s", d, exd)
		}
	}

	// 6
	queryJSON = []byte(`{
    "refId": "A",
    "instant": true,
    "range": false,
    "interval": "10s",
    "intervalMs": 10000,
    "timeInterval": "",
    "expr": "sum(ingress_nginx_request_qps)",
    "legendFormat": "__auto"
}`)

	if err := json.Unmarshal(queryJSON, &q); err != nil {
		t.Fatalf("error parse query %s", err)
	}
	rsp, gotErr = datasource.QueryData(ctx, &backend.QueryDataRequest{Queries: []backend.DataQuery{
		{
			RefID:     "A",
			QueryType: instantQueryPath,
			JSON:      queryJSON,
		},
	},
	})
	if gotErr != nil {
		t.Fatalf("unexpected %s", gotErr)
	}

	expected = []*data.Frame{
		data.NewFrame("",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786142, 0)}),
			data.NewField(data.TimeSeriesValueFieldName, nil, []float64{1}),
		),
	}

	response = rsp.Responses["A"]

	for j := range expected {
		q.addMetadataToMultiFrame(expected[j])
	}
	for i := range response.Frames {
		q.addMetadataToMultiFrame(response.Frames[i])
	}

	for i, frame := range response.Frames {
		d, err := frame.MarshalJSON()
		if err != nil {
			t.Fatalf("error marshal response frames %s", err)
		}
		exd, err := expected[i].MarshalJSON()
		if err != nil {
			t.Fatalf("error marshal expected frames %s", err)
		}

		if !bytes.Equal(d, exd) {
			t.Fatalf("unexpected metric %s want %s", d, exd)
		}
	}
}

func TestDatasourceQueryRequestWithRetry(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(_ http.ResponseWriter, _ *http.Request) {
		t.Fatalf("should not be called")
	})
	c := -1
	mux.HandleFunc("/api/v1/query", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST method got %s", r.Method)
		}
		c++
		switch c {
		case 0:
			_, err := w.Write([]byte(`{"status":"success","data":{"resultType":"scalar","result":[1583786142, "1"]}}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 1:
			conn, _, _ := w.(http.Hijacker).Hijack()
			_ = conn.Close()
		case 2:
			_, err := w.Write([]byte(`{"status":"success","data":{"resultType":"scalar","result":[1583786142, "2"]}}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		case 3:
			conn, _, _ := w.(http.Hijacker).Hijack()
			_ = conn.Close()
		case 4:
			conn, _, _ := w.(http.Hijacker).Hijack()
			_ = conn.Close()
		}
	})

	srv := httptest.NewServer(mux)
	defer srv.Close()

	ctx := context.Background()
	settings := backend.DataSourceInstanceSettings{
		URL:      srv.URL,
		JSONData: []byte(`{"httpMethod":"POST","customQueryParameters":""}`),
	}

	instance, err := NewDatasource(ctx, settings)
	if err != nil {
		t.Fatalf("unexpected %s", err)
	}

	datasource := instance.(*Datasource)

	expErr := func(err string) {
		rsp, gotErr := datasource.QueryData(ctx, &backend.QueryDataRequest{
			Queries: []backend.DataQuery{
				{
					RefID:     "A",
					QueryType: instantQueryPath,
					JSON: []byte(`{
    "refId": "A",
    "instant": true,
    "range": false,
    "interval": "10s",
    "intervalMs": 10000,
    "timeInterval": "",
    "expr": "sum(vm_http_request_total)",
    "legendFormat": "__auto"
}`),
				},
			},
		})

		response := rsp.Responses["A"]

		if response.Error == nil {
			t.Fatalf("expected %v got nil", err)
		}

		if !strings.Contains(response.Error.Error(), err) {
			t.Fatalf("expected err %q; got %q", err, gotErr)
		}
	}

	expValue := func(v float64) {
		rsp, gotErr := datasource.QueryData(ctx, &backend.QueryDataRequest{
			Queries: []backend.DataQuery{
				{
					RefID:     "A",
					QueryType: instantQueryPath,
					JSON: []byte(`{
    "refId": "A",
    "instant": true,
    "range": false,
    "interval": "10s",
    "intervalMs": 10000,
    "timeInterval": "",
    "expr": "sum(vm_http_request_total)",
    "legendFormat": "__auto"
}`),
				},
			},
		})

		response := rsp.Responses["A"]
		if gotErr != nil {
			t.Fatalf("unexpected %s", gotErr)
		}
		if response.Error != nil {
			t.Fatalf("unexpected error: %s", response.Error.Error())
		}
		if len(response.Frames) != 1 {
			t.Fatalf("expected 1 frame got %d", len(response.Frames))
		}
		for _, frame := range response.Frames {
			if len(frame.Fields) != 2 {
				t.Fatalf("expected 2 fields got %d", len(frame.Fields))
			}
			if frame.Fields[1].At(0) != v {
				t.Fatalf("unexpected value %v", frame.Fields[1].At(0))
			}
		}
	}

	expValue(1)   // 0
	expValue(2)   // 1 - fail, 2 - retry
	expErr("EOF") // 3, 4 - retries
}
