package plugin

import (
	"bytes"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestResponse_getDataFrames(t *testing.T) {
	type opts struct {
		status      string
		data        Data
		forAlerting bool
		query       Query
		want        func() data.Frames
		wantErr     bool
	}
	f := func(opts opts) {
		t.Helper()
		r := &Response{
			Status:      opts.status,
			Data:        opts.data,
			ForAlerting: opts.forAlerting,
		}
		got, err := r.getDataFrames()
		if (err != nil) != opts.wantErr {
			t.Errorf("getDataFrames() error = %v, wantErr %v", err, opts.wantErr)
			return
		}

		w := opts.want()
		for i := range w {
			opts.query.addMetadataToMultiFrame(w[i])
		}
		for i := range got {
			opts.query.addMetadataToMultiFrame(got[i])
		}

		gotResponse, err := got.MarshalJSON()
		if err != nil {
			t.Errorf("getDataFrames() error = %v, wantErr %v", err, opts.wantErr)
			return
		}
		wResponse, err := w.MarshalJSON()
		if err != nil {
			t.Errorf("getDataFrames() error = %v, wantErr %v", err, opts.wantErr)
			return
		}

		if !bytes.EqualFold(gotResponse, wResponse) {
			t.Errorf("getDataFrames() = %s, want %s", gotResponse, wResponse)
		}
	}

	// empty data
	o := opts{
		data:  Data{},
		query: Query{},
		want: func() data.Frames {
			return nil
		},
		wantErr: true,
	}
	f(o)

	// incorrect result type
	o = opts{
		status: "success",
		data: Data{
			ResultType: "abc",
		},
		query: Query{LegendFormat: "legend {{app}}"},
		want: func() data.Frames {
			return nil
		},
		wantErr: true,
	}
	f(o)

	// bad json
	o = opts{
		status: "success",
		data: Data{
			ResultType: "success",
			Result:     []byte("{"),
		},
		query: Query{LegendFormat: "legend {{app}}"},
		want: func() data.Frames {
			return nil
		},
		wantErr: true,
	}
	f(o)

	// scalar response
	o = opts{
		status: "success",
		data: Data{
			ResultType: "scalar",
			Result:     []byte(`[1583786142.050, "1"]`),
		},
		query: Query{LegendFormat: "legend {{app}}"},
		want: func() data.Frames {
			return []*data.Frame{
				data.NewFrame("",
					data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786142, 50*1e6)}),
					data.NewField(data.TimeSeriesValueFieldName, nil, []float64{1}),
				).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: scalar}}),
			}
		},
	}
	f(o)

	// vector response
	o = opts{
		status: "success",
		data: Data{
			ResultType: "vector",
			Result:     []byte(`[{"metric":{"__name__":"vm_rows"},"value":[1583786142.05,"13763"]},{"metric":{"__name__":"vm_requests"},"value":[1583786140.05,"2000"]}]`),
		},
		query: Query{LegendFormat: "legend {{app}}"},
		want: func() data.Frames {
			return []*data.Frame{
				data.NewFrame("legend ",
					data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786142, 50*1e6)}),
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_rows"}, []float64{13763}),
				).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: vector}}),
				data.NewFrame("legend ",
					data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786140, 50*1e6)}),
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_requests"}, []float64{2000}),
				).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: vector}}),
			}
		},
	}
	f(o)

	// matrix response
	o = opts{
		status: "success",
		data: Data{
			ResultType: "matrix",
			Result:     []byte(`[{"metric":{"__name__":"ingress_nginx_request_qps","status":"100"},"values":[[1670324477.542,"1"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"500"},"values":[[1670324477.542,"2"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"200"},"values":[[1670324477.542,"3"]]}]`),
		},
		query: Query{LegendFormat: "legend {{app}}"},
		want: func() data.Frames {
			return []*data.Frame{
				data.NewFrame("legend ",
					data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}),
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "100"}, []float64{1}),
				).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
				data.NewFrame("legend ",
					data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}),
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "500"}, []float64{2}),
				).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
				data.NewFrame("legend ",
					data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 542*1e6)}),
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "200"}, []float64{3}),
				).SetMeta(&data.FrameMeta{Custom: &CustomMeta{ResultType: matrix}}),
			}
		},
	}
	f(o)

	// vector response for alerting
	o = opts{
		status: "success",
		data: Data{
			ResultType: "vector",
			Result:     []byte(`[{"metric":{"__name__":"vm_rows"},"value":[1583786142,"13763"]},{"metric":{"__name__":"vm_requests"},"value":[1583786140,"2000"]}]`),
		},
		forAlerting: true,
		query:       Query{LegendFormat: "legend {{app}}"},
		want: func() data.Frames {
			return []*data.Frame{
				data.NewFrame("",
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_rows"}, []float64{13763}),
				).SetMeta(&data.FrameMeta{Type: data.FrameTypeNumericMulti, TypeVersion: data.FrameTypeVersion{0, 1}, Custom: &CustomMeta{ResultType: vector}}),
				data.NewFrame("",
					data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_requests"}, []float64{2000}),
				).SetMeta(&data.FrameMeta{Type: data.FrameTypeNumericMulti, TypeVersion: data.FrameTypeVersion{0, 1}, Custom: &CustomMeta{ResultType: vector}}),
			}
		},
	}
	f(o)
}
