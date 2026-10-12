package plugin

import (
	"fmt"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

const (
	instantQueryPath        = "/api/v1/query"
	rangeQueryPath          = "/api/v1/query_range"
	legendFormatAuto        = "__auto"
	metricsName             = "__name__"
	legendName              = "name"
	instantQueryDefaultStep = 5 * time.Minute
)

// Query represents backend query object
type Query struct {
	RefID                string `json:"refId"`
	Instant              bool   `json:"instant"`
	Range                bool   `json:"range"`
	Interval             string `json:"interval"`
	IntervalMs           int64  `json:"intervalMs"`
	TimeInterval         string `json:"timeInterval"`
	Expr                 string `json:"expr"`
	LegendFormat         string `json:"legendFormat"`
	Trace                int    `json:"trace,omitempty"`
	UTCOffsetSec         int64  `json:"utcOffsetSec"` // dashboard time zone offset from UTC, used to align range query start/end to step
	MaxDataPoints        int64
	TimeRange            TimeRange
	BackendQueryInterval time.Duration
}

// queryParamKeys are the request params set per query by the plugin
var queryParamKeys = []string{"query", "start", "end", "time", "step", "trace"}

// getQueryURLAndParams builds the query endpoint URL and the request parameters for the query.
// The datasource URL params and the custom query params stay in the URL query string,
// the per-query params are returned separately, so the caller decides whether to send them
// in the URL or in the request body
func (q *Query) getQueryURLAndParams(rawURL string, queryParams url.Values) (*url.URL, url.Values, error) {
	from := q.TimeRange.From
	to := q.TimeRange.To
	timerange := to.Sub(from)
	originalQueryInterval := q.Interval
	minInterval, err := q.calculateMinInterval()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to calculate minimal interval: %w", err)
	}

	step := q.calculateStep(minInterval)
	q.IntervalMs = step.Milliseconds()
	expr := replaceTemplateVariable(q.Expr, q.BackendQueryInterval, step, originalQueryInterval, q.TimeInterval, timerange)

	if expr == "" {
		return nil, nil, fmt.Errorf("expression can't be blank")
	}

	queryPath := instantQueryPath
	if q.Range || !q.Instant {
		queryPath = rangeQueryPath
	}
	u, err := newURL(rawURL, queryPath, false)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to build query url: %w", err)
	}
	urlValues := u.Query()
	for k, vl := range queryParams {
		for _, v := range vl {
			urlValues.Add(k, v)
		}
	}
	// The per-query params always win: a datasource or custom param with the same name is dropped,
	// otherwise VictoriaMetrics would pick the URL value first for GET requests.
	for _, k := range queryParamKeys {
		urlValues.Del(k)
	}
	u.RawQuery = urlValues.Encode()

	values := url.Values{}
	if queryPath == rangeQueryPath {
		aligned := q.TimeRange.alignToStep(step, q.UTCOffsetSec)
		values.Add("start", formatTimestamp(aligned.From))
		values.Add("end", formatTimestamp(aligned.To))
	} else {
		values.Set("time", formatTimestamp(q.TimeRange.To))
	}
	if q.Trace > 0 {
		values.Set("trace", strconv.Itoa(q.Trace))
	}
	values.Set("query", expr)
	values.Set("step", step.String())

	return u, values, nil
}

// withIntervalVariable checks does query has interval variable
func (q *Query) withIntervalVariable() bool {
	return q.Interval == varInterval || q.Interval == varIntervalMs || q.Interval == varRateInterval
}

// calculateMinInterval tries to calculate interval from requested params
// in duration representation or return error if
func (q *Query) calculateMinInterval() (time.Duration, error) {
	if q.withIntervalVariable() {
		q.Interval = ""
	}
	return q.getIntervalFrom(defaultScrapeInterval)
}

var legendReplacer = regexp.MustCompile(`\{\{\s*(.+?)\s*\}\}`)

func (q *Query) parseLegend(labels data.Labels) string {
	if q.LegendFormat == legendFormatAuto || q.LegendFormat == "" {
		legend := labelsToString(labels)
		if legend == "{}" {
			return q.Expr
		}
		return legend
	}

	result := legendReplacer.ReplaceAllStringFunc(q.LegendFormat, func(in string) string {
		labelName := strings.Replace(in, "{{", "", 1)
		labelName = strings.Replace(labelName, "}}", "", 1)
		labelName = strings.TrimSpace(labelName)
		if val, ok := labels[labelName]; ok {
			return val
		}
		return ""
	})
	if result == "" {
		return q.Expr
	}
	return result
}

func (q *Query) addMetadataToMultiFrame(frame *data.Frame) {
	if len(frame.Fields) < 2 {
		return
	}

	customName := q.parseLegend(frame.Fields[1].Labels)
	if customName != "" {
		frame.Fields[1].Config = &data.FieldConfig{DisplayNameFromDS: customName}
	}

	frame.Name = customName
}

func (q *Query) addIntervalToFrame(frame *data.Frame) {
	if len(frame.Fields) > 0 && q.IntervalMs > 0 {
		if frame.Fields[0].Config == nil {
			frame.Fields[0].Config = &data.FieldConfig{}
		}
		frame.Fields[0].Config.Interval = float64(q.IntervalMs)
	}
}

func labelsToString(labels data.Labels) string {
	if labels == nil || len(labels) < 1 {
		return "{}"
	}

	var labelStrings []string
	for label, value := range labels {
		if label == metricsName {
			continue
		}
		if len(labels) == 1 {
			return value
		}
		labelStrings = append(labelStrings, fmt.Sprintf("%s=%q", label, value))
	}

	var metricName string
	mn, ok := labels[metricsName]
	if ok {
		metricName = mn
	}

	if len(labelStrings) < 1 {
		return metricName
	}

	sort.Strings(labelStrings)
	lbs := strings.Join(labelStrings, ",")

	return fmt.Sprintf("%s{%s}", metricName, lbs)
}
