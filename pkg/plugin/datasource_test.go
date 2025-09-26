package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestDatasourceQueryRequest(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(_ http.ResponseWriter, _ *http.Request) {
		t.Fatalf("should not be called")
	})
	c := -1
	mux.HandleFunc("/api/v1/query", func(w http.ResponseWriter, _ *http.Request) {
		c++

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
		case 7:
			_, err := w.Write([]byte(`{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"__name__":"ingress_nginx_request_qps","status":"100"},"values":[[1670324477.542,"1"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"500"},"values":[[1670324477.542,"2"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"200"},"values":[[1670324477.542,"3"]]}]}}`))
			if err != nil {
				t.Fatalf("error write reposne: %s", err)
			}
		}
	})

	srv := httptest.NewServer(mux)
	defer srv.Close()

	ctx := context.Background()
	ds := NewDatasource()
	pluginCtx := backend.PluginContext{
		DataSourceInstanceSettings: &backend.DataSourceInstanceSettings{
			URL:      srv.URL,
			JSONData: []byte(`{"httpMethod":"POST","customQueryParameters":""}`),
		},
	}

	expErr := func(ctx context.Context, err string) {
		rsp, gotErr := ds.QueryData(ctx, &backend.QueryDataRequest{
			PluginContext: pluginCtx,
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
	rsp, gotErr := ds.QueryData(ctx, &backend.QueryDataRequest{
		PluginContext: pluginCtx,
		Queries: []backend.DataQuery{
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
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "100"}, []float64{1}),
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "500"}, []float64{2}),
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "200"}, []float64{3}),
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
	}

	for j := range expected {
		q.addMetadataToMultiFrame(expected[j])
		q.addIntervalToFrame(expected[j])
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
	rsp, gotErr = ds.QueryData(ctx, &backend.QueryDataRequest{
		PluginContext: pluginCtx,
		Queries: []backend.DataQuery{
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
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: scalar}}),
	}

	response = rsp.Responses["A"]

	for j := range expected {
		q.addMetadataToMultiFrame(expected[j])
		q.addIntervalToFrame(expected[j])
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

	// 7 - test time field config with intervalMs
	queryJSON = []byte(`{
							"refId": "A",
							"instant": true,
							"range": false,
							"interval": "10s",
							"intervalMs": 7777,
							"timeInterval": "",
							"expr": "sum(ingress_nginx_request_qps)",
							"legendFormat": "__auto"
						 }`)

	if err := json.Unmarshal(queryJSON, &q); err != nil {
		t.Fatalf("error parse query %s", err)
	}
	rsp, gotErr = ds.QueryData(ctx, &backend.QueryDataRequest{
		PluginContext: pluginCtx,
		Queries: []backend.DataQuery{
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

	response = rsp.Responses["A"]
	if len(response.Frames) != 3 {
		t.Fatalf("expected 2 metrics got %d in %+v", len(response.Frames), response.Frames)
	}

	expected = []*data.Frame{
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}).SetConfig(&data.FieldConfig{Interval: 7777}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "100"}, []float64{1}),
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}).SetConfig(&data.FieldConfig{Interval: 7777}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "500"}, []float64{2}),
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
		data.NewFrame("sum(ingress_nginx_request_qps)",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}).SetConfig(&data.FieldConfig{Interval: 7777}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "200"}, []float64{3}),
		).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
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
}

func TestDatasourceQueryRequestWithRetry(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(_ http.ResponseWriter, _ *http.Request) {
		t.Fatalf("should not be called")
	})
	c := -1
	mux.HandleFunc("/api/v1/query", func(w http.ResponseWriter, _ *http.Request) {
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
	ds := NewDatasource()
	pluginCtx := backend.PluginContext{
		DataSourceInstanceSettings: &backend.DataSourceInstanceSettings{
			URL:      srv.URL,
			JSONData: []byte(`{"httpMethod":"POST","customQueryParameters":""}`),
		},
	}

	expErr := func(err string) {
		rsp, gotErr := ds.QueryData(ctx, &backend.QueryDataRequest{
			PluginContext: pluginCtx,
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
		rsp, gotErr := ds.QueryData(ctx, &backend.QueryDataRequest{
			PluginContext: pluginCtx,
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

func TestDatasource_checkAlertingRequest(t *testing.T) {
	type opts struct {
		headers map[string]string
		want    bool
		wantErr bool
	}
	f := func(opts opts) {
		t.Helper()
		got, err := checkAlertingRequest(opts.headers)
		if (err != nil) != opts.wantErr {
			t.Errorf("checkAlertingRequest() error = %v, wantErr %v", err, opts.wantErr)
			return
		}
		if got != opts.want {
			t.Errorf("checkAlertingRequest() got = %v, want %v", got, opts.want)
		}
	}

	// no alerting header
	o := opts{
		headers: map[string]string{},
	}
	f(o)

	// alerting header
	o = opts{
		headers: map[string]string{"FromAlert": "true"},
		want:    true,
	}
	f(o)

	// invalid alerting header
	o = opts{
		headers: map[string]string{"FromAlert": "invalid"},
		wantErr: true,
	}
	f(o)

	// false alerting header
	o = opts{
		headers: map[string]string{"FromAlert": "false"},
	}
	f(o)

	// irrelevant header
	o = opts{
		headers: map[string]string{"SomeOtherHeader": "true"},
	}
	f(o)
}

func TestDatasourceQueryDataRace(t *testing.T) {
	ctx := context.Background()
	ds := NewDatasource()
	pluginCtx := backend.PluginContext{
		DataSourceInstanceSettings: &backend.DataSourceInstanceSettings{
			URL:      "http://localhost", // Use a valid test server if needed
			JSONData: []byte(`{"httpMethod":"POST","customQueryParameters":""}`),
		},
	}

	var queries []backend.DataQuery
	for i := 0; i < 20; i++ {
		queries = append(queries, backend.DataQuery{
			RefID:     fmt.Sprintf("A%d", i),
			QueryType: instantQueryPath,
			JSON:      []byte(`{"refId":"A","instant":true,"range":false,"expr":"sum(vm_http_request_total)"}`),
		})
	}

	_, err := ds.QueryData(ctx, &backend.QueryDataRequest{
		PluginContext: pluginCtx,
		Queries:       queries,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNewURL(t *testing.T) {
	tests := []struct {
		name      string
		urlStr    string
		path      string
		root      bool
		expected  string
		expectErr bool
	}{
		{
			name:      "valid URL with path joining",
			urlStr:    "http://example.com/base",
			path:      "api/v1/resource",
			root:      false,
			expected:  "http://example.com/base/api/v1/resource",
			expectErr: false,
		},
		{
			name:      "empty URL string",
			urlStr:    "",
			path:      "api/v1/resource",
			root:      false,
			expected:  "",
			expectErr: true,
		},
		{
			name:      "invalid URL string",
			urlStr:    ":invalid-url",
			path:      "api/v1/resource",
			root:      false,
			expected:  "",
			expectErr: true,
		},
		{
			name:      "valid URL with root slicing",
			urlStr:    "http://example.com/base/select/prometheus?param=value",
			path:      "api/v1/resource",
			root:      true,
			expected:  "http://example.com/base/api/v1/resource?param=value",
			expectErr: false,
		},
		{
			name:      "valid URL without root slicing",
			urlStr:    "http://example.com/base/select?param=value",
			path:      "api/v1/resource",
			root:      false,
			expected:  "http://example.com/base/select/api/v1/resource?param=value",
			expectErr: false,
		},
		{
			name:      "valid URL with trailing slash in base",
			urlStr:    "http://example.com/base/",
			path:      "api/v1/resource",
			root:      false,
			expected:  "http://example.com/base/api/v1/resource",
			expectErr: false,
		},
		{
			name:      "valid URL with empty path",
			urlStr:    "http://example.com/base",
			path:      "",
			root:      false,
			expected:  "http://example.com/base",
			expectErr: false,
		},
		{
			name:      "valid root slicing without select path",
			urlStr:    "http://example.com/base/somepath",
			path:      "api/v1/resource",
			root:      true,
			expected:  "http://example.com/base/somepath/api/v1/resource",
			expectErr: false,
		},
		{
			name:      "valid root slicing for single url",
			urlStr:    "http://localhost:8428/",
			path:      "/-/healthy",
			root:      true,
			expected:  "http://localhost:8428/-/healthy",
			expectErr: false,
		},
		{
			name:      "valid root slicing for cluster url with auth",
			urlStr:    "http://localhost:8427/select/0/prometheus",
			path:      "/-/healthy",
			root:      true,
			expected:  "http://localhost:8427/-/healthy",
			expectErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := newURL(tt.urlStr, tt.path, tt.root)
			if (err != nil) != tt.expectErr {
				t.Errorf("newURL() error = %v, expectErr %v", err, tt.expectErr)
				return
			}
			if err == nil && got.String() != tt.expected {
				t.Errorf("newURL() got = %v, expected %v", got.String(), tt.expected)
			}
		})
	}
}
