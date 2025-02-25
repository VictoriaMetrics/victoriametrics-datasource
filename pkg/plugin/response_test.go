package plugin

import (
	"bytes"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestResponse_getDataFrames(t *testing.T) {
	tests := []struct {
		name        string
		status      string
		data        Data
		forAlerting bool
		query       Query
		want        func() data.Frames
		wantErr     bool
	}{
		{
			name:   "empty data",
			status: "",
			data: Data{
				ResultType: "",
				Result:     nil,
			},
			query: Query{},
			want: func() data.Frames {
				return nil
			},
			wantErr: true,
		},
		{
			name:   "incorrect result type",
			status: "success",
			data: Data{
				ResultType: "abc",
				Result:     nil,
			},
			query: Query{LegendFormat: "legend {{app}}"},
			want: func() data.Frames {
				return nil
			},
			wantErr: true,
		},
		{
			name:   "bad json",
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
		},
		{
			name:   "scalar response",
			status: "success",
			data: Data{
				ResultType: "scalar",
				Result:     []byte(`[1583786142, "1"]`),
			},
			query: Query{LegendFormat: "legend {{app}}"},
			want: func() data.Frames {
				return []*data.Frame{
					data.NewFrame("",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786142, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, nil, []float64{1}),
					),
				}
			},
			wantErr: false,
		},
		{
			name:   "vector response",
			status: "success",
			data: Data{
				ResultType: "vector",
				Result:     []byte(`[{"metric":{"__name__":"vm_rows"},"value":[1583786142,"13763"]},{"metric":{"__name__":"vm_requests"},"value":[1583786140,"2000"]}]`),
			},
			query: Query{LegendFormat: "legend {{app}}"},
			want: func() data.Frames {
				return []*data.Frame{
					data.NewFrame("legend ",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786142, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_rows"}, []float64{13763}),
					),
					data.NewFrame("legend ",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786140, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_requests"}, []float64{2000}),
					),
				}
			},
			wantErr: false,
		},
		{
			name:   "matrix response",
			status: "success",
			data: Data{
				ResultType: "matrix",
				Result:     []byte(`[{"metric":{"__name__":"ingress_nginx_request_qps","status":"100"},"values":[[1670324477.542,"1"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"500"},"values":[[1670324477.542,"2"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"200"},"values":[[1670324477.542,"3"]]}]`),
			},
			query: Query{LegendFormat: "legend {{app}}"},
			want: func() data.Frames {
				return []*data.Frame{
					data.NewFrame("legend ",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "100"}, []float64{1}),
					),
					data.NewFrame("legend ",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "500"}, []float64{2}),
					),
					data.NewFrame("legend ",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "200"}, []float64{3}),
					),
				}
			},
			wantErr: false,
		},
		{
			name:   "vector response for alerting",
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
					).SetMeta(&data.FrameMeta{Type: data.FrameTypeNumericMulti, TypeVersion: data.FrameTypeVersion{0, 1}}),
					data.NewFrame("",
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_requests"}, []float64{2000}),
					).SetMeta(&data.FrameMeta{Type: data.FrameTypeNumericMulti, TypeVersion: data.FrameTypeVersion{0, 1}}),
				}
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &Response{
				Status:      tt.status,
				Data:        tt.data,
				ForAlerting: tt.forAlerting,
			}
			got, err := r.getDataFrames()
			if (err != nil) != tt.wantErr {
				t.Errorf("getDataFrames() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			w := tt.want()
			for i := range w {
				tt.query.addMetadataToMultiFrame(w[i])
			}
			for i := range got {
				tt.query.addMetadataToMultiFrame(got[i])
			}

			gotResponse, err := got.MarshalJSON()
			if err != nil {
				t.Errorf("getDataFrames() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			wResponse, err := w.MarshalJSON()
			if err != nil {
				t.Errorf("getDataFrames() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !bytes.EqualFold(gotResponse, wResponse) {
				t.Errorf("getDataFrames() = %s, want %s", gotResponse, wResponse)
			}
		})
	}
}
