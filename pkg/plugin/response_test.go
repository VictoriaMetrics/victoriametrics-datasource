package plugin

import (
	"reflect"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TestResponse_getDataResponse(t *testing.T) {
	type fields struct {
		Status  string
		Data    Data
		Instant bool
		Range   bool
	}
	tests := []struct {
		name      string
		fields    fields
		getFrames func() []*data.Frame
		want      backend.DataResponse
		wantErr   bool
	}{
		{
			name: "empty data",
			fields: fields{
				Status:  "",
				Data:    Data{},
				Instant: false,
				Range:   false,
			},
			getFrames: func() []*data.Frame {
				var times []time.Time
				var values []float64

				return []*data.Frame{
					data.NewFrame("response",
						data.NewField("time", nil, times),
						data.NewField("values", nil, values),
					),
				}
			},
			want: backend.DataResponse{
				Error:  nil,
				Status: 0,
				Frames: nil,
			},
			wantErr: false,
		},
		{
			name: "range request",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "vector",
					Result: []Result{
						{
							Metric: map[string]string{
								"__name__": "ingress_nginx_request_qps",
								"status":   "502",
							},
							Values: []Value{
								{
									1669973610.804,
									"170669.68542938",
								},
							},
							Value: Value{},
						},
					},
				},
				Instant: false,
				Range:   true,
			},
			getFrames: func() []*data.Frame {
				return []*data.Frame{
					data.NewFrame("response",
						data.NewField("time", nil, []time.Time{
							time.Date(2022, time.December, 2, 11, 33, 30, 0, time.Local),
						}),
						data.NewField("values", nil, []float64{
							170669.68542938,
						}),
					),
				}
			},
			want: backend.DataResponse{
				Error:  nil,
				Status: 0,
				Frames: nil,
			},
			wantErr: false,
		},
		{
			name: "instant request",
			fields: fields{
				Status: "success",
				Data: Data{
					ResultType: "vector",
					Result: []Result{
						{
							Metric: map[string]string{
								"__name__": "ingress_nginx_request_qps",
								"status":   "502",
							},
							Values: []Value{},
							Value: Value{
								1669973610.804,
								"170669.68542938",
							},
						},
					},
				},
				Instant: true,
				Range:   false,
			},
			getFrames: func() []*data.Frame {
				return []*data.Frame{
					data.NewFrame("response",
						data.NewField("time", nil, []time.Time{
							time.Date(2022, time.December, 2, 11, 33, 30, 0, time.Local),
						}),
						data.NewField("values", nil, []float64{
							170669.68542938,
						}),
					),
				}
			},
			want: backend.DataResponse{
				Error:  nil,
				Status: 0,
				Frames: nil,
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			r := &Response{
				Status:  tt.fields.Status,
				Data:    tt.fields.Data,
				Instant: tt.fields.Instant,
				Range:   tt.fields.Range,
			}
			got, err := r.getDataResponse()
			if (err != nil) != tt.wantErr {
				t.Errorf("getDataResponse() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			tt.want.Frames = append(tt.want.Frames, tt.getFrames()...)

			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("getDataResponse() got = %#v, want %#v", got, tt.want)
			}
		})
	}
}
