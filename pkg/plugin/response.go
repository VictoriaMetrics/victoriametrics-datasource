package plugin

import (
	"encoding/json"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

const (
	vector, matrix, scalar = "vector", "matrix", "scalar"
)

const legendFormatAuto = "__auto"

var legendFormatRegexp = regexp.MustCompile(`\{\{\s*(.+?)\s*\}\}`)

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
	Status string `json:"status"`
	Data   Data   `json:"data"`
}

func addMetadataToMultiFrame(q Query, frame *data.Frame) {
	if frame.Meta == nil {
		frame.Meta = &data.FrameMeta{}
	}
	if len(frame.Fields) < 2 {
		return
	}

	customName := getName(q, frame.Fields[1])
	if customName != "" {
		frame.Fields[1].Config = &data.FieldConfig{DisplayNameFromDS: customName}
	}

	frame.Name = customName
}

func metricNameFromLabels(f *data.Field) string {
	labels := f.Labels
	metricName, hasName := labels["__name__"]
	numLabels := len(labels) - 1
	if !hasName {
		numLabels = len(labels)
	}
	labelStrings := make([]string, 0, numLabels)
	for label, value := range labels {
		if label != "__name__" {
			labelStrings = append(labelStrings, fmt.Sprintf("%s=%q", label, value))
		}
	}

	switch numLabels {
	case 0:
		if hasName {
			return metricName
		}
		return "{}"
	default:
		sort.Strings(labelStrings)
		return fmt.Sprintf("%s{%s}", metricName, strings.Join(labelStrings, ", "))
	}
}

func getName(q Query, field *data.Field) string {
	labels := field.Labels
	legend := metricNameFromLabels(field)

	if q.LegendFormat == legendFormatAuto {
		if len(labels) > 0 {
			legend = ""
		}
	} else if q.LegendFormat != "" {
		result := legendFormatRegexp.ReplaceAllFunc([]byte(q.LegendFormat), func(in []byte) []byte {
			labelName := strings.Replace(string(in), "{{", "", 1)
			labelName = strings.Replace(labelName, "}}", "", 1)
			labelName = strings.TrimSpace(labelName)
			if val, exists := labels[labelName]; exists {
				return []byte(val)
			}
			return []byte{}
		})
		legend = string(result)
	}

	// If legend is empty brackets, use query expression
	if legend == "{}" {
		return q.Expr
	}

	return legend
}

type promInstant struct {
	Result []Result `json:"result"`
}

func (pi promInstant) dataframes(q Query) (data.Frames, error) {
	frames := make(data.Frames, len(pi.Result))
	for i, res := range pi.Result {
		f, err := strconv.ParseFloat(res.Value[1].(string), 64)
		if err != nil {
			return nil, fmt.Errorf("metric %v, unable to parse float64 from %s: %w", res, res.Value[1], err)
		}

		ts := time.Unix(int64(res.Value[0].(float64)), 0)
		frames[i] = data.NewFrame("",
			data.NewField(data.TimeSeriesTimeFieldName, nil, []time.Time{ts}),
			data.NewField(data.TimeSeriesValueFieldName, data.Labels(res.Labels), []float64{f}))
		addMetadataToMultiFrame(q, frames[i])
	}

	return frames, nil
}

type promRange struct {
	Result []Result `json:"result"`
}

func (pr promRange) dataframes(q Query) (data.Frames, error) {
	frames := make(data.Frames, len(pr.Result))
	for i, res := range pr.Result {
		timestamps := make([]time.Time, len(res.Values))
		values := make([]float64, len(res.Values))
		for j, value := range res.Values {
			v, ok := value[0].(float64)
			if !ok {
				return nil, fmt.Errorf("error get time from dataframes")
			}
			timestamps[j] = time.Unix(int64(v), 0)

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
			data.NewField(data.TimeSeriesValueFieldName, data.Labels(res.Labels), values))
		addMetadataToMultiFrame(q, frames[i])
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
	label := fmt.Sprintf("%g", f)

	frames = append(frames,
		data.NewFrame(label,
			data.NewField("time", nil, []time.Time{time.Unix(int64(ps[0].(float64)), 0)}),
			data.NewField("value", nil, []float64{f})))

	return frames, nil
}

func (r *Response) getDataFrames(q Query) (data.Frames, error) {
	switch r.Data.ResultType {
	case vector:
		var pi promInstant
		if err := json.Unmarshal(r.Data.Result, &pi.Result); err != nil {
			return nil, fmt.Errorf("umarshal err %s; \n %#v", err, string(r.Data.Result))
		}
		return pi.dataframes(q)
	case matrix:
		var pr promRange
		if err := json.Unmarshal(r.Data.Result, &pr.Result); err != nil {
			return nil, fmt.Errorf("umarshal err %s; \n %#v", err, string(r.Data.Result))
		}
		return pr.dataframes(q)
	case scalar:
		var ps promScalar
		if err := json.Unmarshal(r.Data.Result, &ps); err != nil {
			return nil, fmt.Errorf("umarshal err %s; \n %#v", err, string(r.Data.Result))
		}
		return ps.dataframes()
	default:
		return nil, fmt.Errorf("unknown result type %q", r.Data.ResultType)
	}
}
