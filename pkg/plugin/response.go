package plugin

import (
	"fmt"
	"strconv"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

type Metric struct {
	Name   string `json:"__name__"`
	Status string `json:"status"`
}

type Result struct {
	Metric Metric  `json:"metric"`
	Values []Value `json:"values"`
	Value  Value   `json:"value"`
}

type Value [2]interface{}

type Data struct {
	ResultType string   `json:"resultType"`
	Result     []Result `json:"result"`
}

type Response struct {
	Status  string `json:"status"`
	Data    Data   `json:"data"`
	Instant bool
	Range   bool
}

func (r *Response) getDataResponse() (backend.DataResponse, error) {
	if r.Instant {
		return r.processInstanceResponse()
	}
	return r.processRangeResponse()
}

func (r *Response) processRangeResponse() (backend.DataResponse, error) {
	var response backend.DataResponse
	var times []time.Time
	var values []float64

	for _, result := range r.Data.Result {
		for _, value := range result.Values {
			v, ok := value[0].(float64)
			if !ok {
				return response, fmt.Errorf("error get time from response")
			}
			times = append(times, time.Unix(int64(v), 0))

			f, err := strconv.ParseFloat(value[1].(string), 64)
			if err != nil {
				return response, fmt.Errorf("erro get value from response: %s", err)
			}
			values = append(values, f)
		}
	}

	response.Frames = append(
		response.Frames,
		data.NewFrame(
			"response",
			data.NewField("time", nil, times),
			data.NewField("values", nil, values),
		),
	)
	return response, nil
}

func (r *Response) processInstanceResponse() (backend.DataResponse, error) {
	var response backend.DataResponse
	var times []time.Time
	var values []float64

	for _, result := range r.Data.Result {
		for i, v := range result.Value {
			if i == 0 {
				v, ok := v.(float64)
				if !ok {
					return response, fmt.Errorf("error get time from response")
				}
				times = append(times, time.Unix(int64(v), 0))
			} else {
				f, err := strconv.ParseFloat(v.(string), 64)
				if err != nil {
					return response, fmt.Errorf("erro get value from response: %s", err)
				}
				values = append(values, f)
			}
		}
	}

	response.Frames = append(
		response.Frames,
		data.NewFrame(
			"response",
			data.NewField("time", nil, times),
			data.NewField("values", nil, values),
		),
	)

	return response, nil
}
