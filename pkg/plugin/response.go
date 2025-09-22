package plugin

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

const (
	vector, matrix, scalar = "vector", "matrix", "scalar"
)

type CustomMeta struct {
	*Trace `json:",inline"`
	// ResultType represents the type of the query response: "vector" | "matrix" | "scalar" | "trace"
	ResultType string `json:"resultType"`
}

// Result represents timeseries from query
type Result struct {
	Labels Labels  `json:"metric"`
	Values []Value `json:"values"`
	Value  Value   `json:"value"`
}

// Value represents timestamp and value of the timeseries
type Value [2]interface{}

// Labels represents timeseries labels
type Labels map[string]string

// Data contains fields
// ResultType which defines type of the query response
// Result resents json of the query response
type Data struct {
	ResultType string          `json:"resultType"`
	Result     json.RawMessage `json:"result"`
}

// Response contains fields from query response
type Response struct {
	Status      string `json:"status"`
	Data        Data   `json:"data"`
	Trace       *Trace `json:"trace,omitempty"`
	ForAlerting bool   `json:"-"`
}

// Trace represents data for query tracing
type Trace struct {
	Duration float64 `json:"duration_msec"`
	Message  string  `json:"message"`
	Children []Trace `json:"children,omitempty"`
}

type promInstant struct {
	Result []Result `json:"result"`
}

func (pi promInstant) dataframes() (data.Frames, error) {
	frames := make(data.Frames, len(pi.Result))
	for i, res := range pi.Result {
		f, err := strconv.ParseFloat(res.Value[1].(string), 64)
		if err != nil {
			return nil, fmt.Errorf("metric %v, unable to parse float64 from %s: %w", res, res.Value[1], err)
		}

		v, ok := res.Value[0].(float64)
		if !ok {
			return nil, fmt.Errorf("error get time from dataframes")
		}

		ts, err := parseFloatToTime(v)
		if err != nil {
			return nil, fmt.Errorf("error get time from dataframes: %s", err)
		}

		frames[i] = data.NewFrame("",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{ts}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels(res.Labels), []float64{f}),
		).SetMeta(&data.FrameMeta{
			Custom: &CustomMeta{
				ResultType: vector,
			},
		})
	}

	return frames, nil
}

func (pi promInstant) alertingDataFrames() (data.Frames, error) {
	frames := make(data.Frames, len(pi.Result))
	for i, res := range pi.Result {
		f, err := strconv.ParseFloat(res.Value[1].(string), 64)
		if err != nil {
			return nil, fmt.Errorf("metric %v, unable to parse float64 from %s: %w", res, res.Value[1], err)
		}

		frames[i] = data.NewFrame("",
			data.NewField(data.TimeSeriesValueFieldName, data.Labels(res.Labels), []float64{f}))

		// to show instant alert response with the table we need to define the type of the frame
		// and it should be [0, 1] like it set in the Grafana
		frames[i].Meta = &data.FrameMeta{Type: data.FrameTypeNumericMulti, TypeVersion: data.FrameTypeVersion{0, 1}, Custom: &CustomMeta{ResultType: vector}}
	}

	return frames, nil
}

type promRange struct {
	Result []Result `json:"result"`
}

func (pr promRange) dataframes() (data.Frames, error) {
	frames := make(data.Frames, len(pr.Result))
	for i, res := range pr.Result {
		timestamps := make([]time.Time, len(res.Values))
		values := make([]float64, len(res.Values))
		for j, value := range res.Values {
			v, ok := value[0].(float64)
			if !ok {
				return nil, fmt.Errorf("error get time from dataframes")
			}

			var err error
			timestamps[j], err = parseFloatToTime(v)
			if err != nil {
				return nil, fmt.Errorf("error get time from dataframes: %s", err)
			}

			f, err := strconv.ParseFloat(value[1].(string), 64)
			if err != nil {
				return nil, fmt.Errorf("erro get value from dataframes: %s", err)
			}
			values[j] = f
		}

		if len(values) < 1 || len(timestamps) < 1 {
			return nil, fmt.Errorf("metric %v contains no values", res)
		}

		frames[i] = data.NewFrame("",
			data.NewField(data.TimeSeriesTimeFieldName, nil, timestamps),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels(res.Labels), values),
		).SetMeta(&data.FrameMeta{
			Custom: &CustomMeta{
				ResultType: matrix,
			},
		})
	}

	return frames, nil
}

type promScalar Value

func (ps promScalar) dataframes() (data.Frames, error) {
	var frames data.Frames
	f, err := strconv.ParseFloat(ps[1].(string), 64)
	if err != nil {
		return nil, fmt.Errorf("metric %v, unable to parse float64 from %s: %w", ps, ps[1], err)
	}

	v, ok := ps[0].(float64)
	if !ok {
		return nil, fmt.Errorf("error get time from dataframes")
	}

	ts, err := parseFloatToTime(v)
	if err != nil {
		return nil, fmt.Errorf("error get time from dataframes: %s", err)
	}

	frames = append(frames,
		data.NewFrame("",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{ts}),
			data.NewField(data.TimeSeriesValueFieldName, nil, []float64{f}),
		).SetMeta(&data.FrameMeta{
			Custom: &CustomMeta{
				ResultType: scalar,
			},
		}),
	)

	return frames, nil
}

type dataframe interface {
	dataframes() (data.Frames, error)
}

func (r *Response) getDataFrames() (fss data.Frames, err error) {
	if r.Trace != nil {
		fss = append(fss, &data.Frame{
			Meta: &data.FrameMeta{
				Custom: &CustomMeta{
					Trace:      r.Trace,
					ResultType: "trace",
				},
			},
		})
	}
	var df dataframe
	switch r.Data.ResultType {
	case vector:
		var pi promInstant
		if err = json.Unmarshal(r.Data.Result, &pi.Result); err != nil {
			return nil, fmt.Errorf("unmarshal err %w; \n %#v", err, string(r.Data.Result))
		}
		if r.ForAlerting {
			return pi.alertingDataFrames()
		}
		df = pi
	case matrix:
		var pr promRange
		if err = json.Unmarshal(r.Data.Result, &pr.Result); err != nil {
			return nil, fmt.Errorf("unmarshal err %w; \n %#v", err, string(r.Data.Result))
		}
		df = pr
	case scalar:
		var ps promScalar
		if err = json.Unmarshal(r.Data.Result, &ps); err != nil {
			return nil, fmt.Errorf("unmarshal err %w; \n %#v", err, string(r.Data.Result))
		}
		df = ps
	default:
		return nil, fmt.Errorf("unknown result type %q", r.Data.ResultType)
	}
	if frames, err := df.dataframes(); err != nil {
		return nil, err
	} else {
		return append(fss, frames...), nil
	}
}
