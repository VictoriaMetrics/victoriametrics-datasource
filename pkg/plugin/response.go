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

type Result struct {
	Labels Labels  `json:"metric"`
	Values []Value `json:"values"`
	Value  Value   `json:"value"`
}

type Value [2]interface{}
type Labels map[string]string

type Data struct {
	ResultType string          `json:"resultType"`
	Result     json.RawMessage `json:"result"`
}

type Response struct {
	Status string `json:"status"`
	Data   Data   `json:"data"`
}

type promInstant struct {
	Result []Result `json:"result"`
}

func (pi promInstant) response(expr string) (data.Frames, error) {
	frames := make(data.Frames, len(pi.Result))
	for i, res := range pi.Result {
		f, err := strconv.ParseFloat(res.Value[1].(string), 64)
		if err != nil {
			return nil, fmt.Errorf("metric %v, unable to parse float64 from %s: %w", res, res.Value[1], err)
		}
		timestamps := []time.Time{time.Unix(int64(res.Value[0].(float64)), 0)}
		values := []float64{f}

		frames[i] = data.NewFrame(expr,
			data.NewField("time", nil, timestamps),
			data.NewField("values", data.Labels(res.Labels), values))
	}

	return frames, nil
}

type promRange struct {
	Result []Result `json:"result"`
}

func (pr promRange) response(expr string) (data.Frames, error) {
	frames := make(data.Frames, len(pr.Result))
	for i, res := range pr.Result {
		timestamps := make([]time.Time, len(res.Values))
		values := make([]float64, len(res.Values))
		for _, value := range res.Values {
			v, ok := value[0].(float64)
			if !ok {
				return nil, fmt.Errorf("error get time from response")
			}
			timestamps = append(timestamps, time.Unix(int64(v), 0))

			f, err := strconv.ParseFloat(value[1].(string), 64)
			if err != nil {
				return nil, fmt.Errorf("erro get value from response: %s", err)
			}
			values = append(values, f)
		}

		if len(values) < 1 || len(timestamps) < 1 {
			return nil, fmt.Errorf("metric %v contains no values", res)
		}

		frames[i] = data.NewFrame(expr,
			data.NewField("time", nil, timestamps),
			data.NewField("values", data.Labels(res.Labels), values))
	}

	return frames, nil
}

type promScalar Value

func (ps promScalar) response(expr string) (data.Frames, error) {
	var frames data.Frames
	f, err := strconv.ParseFloat(ps[1].(string), 64)
	if err != nil {
		return nil, fmt.Errorf("metric %v, unable to parse float64 from %s: %w", ps, ps[1], err)
	}
	frames = append(frames,
		data.NewFrame(expr,
			data.NewField("time", nil, time.Unix(int64(ps[0].(float64)), 0)),
			data.NewField("value", nil, f)))

	return frames, nil
}

func (r *Response) getDataFrames(expr string) (data.Frames, error) {
	switch r.Data.ResultType {
	case vector:
		var pi promInstant
		if err := json.Unmarshal(r.Data.Result, &pi.Result); err != nil {
			return nil, fmt.Errorf("umarshal err %s; \n %#v", err, string(r.Data.Result))
		}
		return pi.response(expr)
	case matrix:
		var pr promRange
		if err := json.Unmarshal(r.Data.Result, &pr.Result); err != nil {
			return nil, fmt.Errorf("umarshal err %s; \n %#v", err, string(r.Data.Result))
		}
		return pr.response(expr)
	case scalar:
		var ps promScalar
		if err := json.Unmarshal(r.Data.Result, &ps); err != nil {
			return nil, fmt.Errorf("umarshal err %s; \n %#v", err, string(r.Data.Result))
		}
		return ps.response(expr)
	default:
		return nil, fmt.Errorf("unknown result type %q", r.Data.ResultType)
	}
}
