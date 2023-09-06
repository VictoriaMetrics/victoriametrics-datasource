package plugin

import (
	"reflect"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestResponse_getDataFrames(t *testing.T) {
	type fields struct {
		Status string
		Data   Data
	}
	tests := []struct {
		name    string
		label   string
		fields  fields
		query   Query
		want    func() data.Frames
		wantErr bool
	}{
		{
			name: "empty data",
			fields: fields{
				Status: "",
				Data: Data{
					ResultType: "",
					Result:     nil,
				},
			},
			query: Query{},
			want: func() data.Frames {
				return nil
			},
			wantErr: true,
		},
		{
			name: "incorrect result type",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "abc",
					Result:     nil,
				},
			},
			query: Query{LegendFormat: "legend {{app}}"},
			want: func() data.Frames {
				return nil
			},
			wantErr: true,
		},
		{
			name: "bad json",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "success",
					Result:     []byte("{"),
				},
			},
			query: Query{LegendFormat: "legend {{app}}"},
			want: func() data.Frames {
				return nil
			},
			wantErr: true,
		},
		{
			name: "scalar response",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "scalar",
					Result:     []byte(`[1583786142, "1"]`),
				},
			},
			query: Query{LegendFormat: "legend {{app}}"},
			label: "123",
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
			name: "vector response",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "vector",
					Result:     []byte(`[{"metric":{"__name__":"vm_rows"},"value":[1583786142,"13763"]},{"metric":{"__name__":"vm_requests"},"value":[1583786140,"2000"]}]`),
				},
			},
			query: Query{LegendFormat: "legend {{app}}"},
			label: "123",
			want: func() data.Frames {
				return []*data.Frame{
					data.NewFrame("",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786142, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_rows"}, []float64{13763}),
					),
					data.NewFrame("",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1583786140, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "vm_requests"}, []float64{2000}),
					),
				}
			},
			wantErr: false,
		},
		{
			name: "matrix response",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "matrix",
					Result:     []byte(`[{"metric":{"__name__":"ingress_nginx_request_qps","status":"100"},"values":[[1670324477.542,"1"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"500"},"values":[[1670324477.542,"2"]]}, {"metric":{"__name__":"ingress_nginx_request_qps","status":"200"},"values":[[1670324477.542,"3"]]}]`),
				},
			},
			label: "123",
			want: func() data.Frames {
				return []*data.Frame{
					data.NewFrame("",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "100"}, []float64{1}),
					),
					data.NewFrame("",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "500"}, []float64{2}),
					),
					data.NewFrame("",
						data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{time.Unix(1670324477, 0)}),
						data.NewField(data.TimeSeriesValueFieldName, data.Labels{"__name__": "ingress_nginx_request_qps", "status": "200"}, []float64{3}),
					),
				}
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &Response{
				Status: tt.fields.Status,
				Data:   tt.fields.Data,
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

			if !reflect.DeepEqual(got, w) {
				t.Errorf("getDataFrames() got = %v, want %v", got, w)
			}
		})
	}
}
