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

// getQueryURLAndParams builds the query endpoint URL and the per-query request params.
// The datasource URL params and the custom query params stay in the URL query string,
// the per-query params are returned separately, so the caller decides whether to send them
// in the URL or in the request body
func (q *Query) getQueryURLAndParams(rawURL string, customParams url.Values) (*url.URL, url.Values, error) {
	if q.Expr == "" {
		return nil, nil, fmt.Errorf("expression can't be blank")
	}
	step, err := q.resolveStep()
	if err != nil {
		return nil, nil, err
	}
	params := q.queryParams(q.renderExpr(step), step)
	u, err := buildQueryURL(rawURL, q.queryPath(), customParams, params)
	if err != nil {
		return nil, nil, err
	}
	return u, params, nil
}

// isRange reports whether the query goes to the range endpoint
func (q *Query) isRange() bool {
	return q.Range || !q.Instant
}

// queryPath returns the API path of the endpoint the query goes to
func (q *Query) queryPath() string {
	if q.isRange() {
		return rangeQueryPath
	}
	return instantQueryPath
}

// resolveStep computes the effective step and records it in q.IntervalMs,
// which calculateStep and the frame interval rely on later
func (q *Query) resolveStep() (time.Duration, error) {
	minInterval, err := q.calculateMinInterval()
	if err != nil {
		return 0, fmt.Errorf("failed to calculate minimal interval: %w", err)
	}
	step := q.calculateStep(minInterval)
	q.IntervalMs = step.Milliseconds()
	return step, nil
}

// renderExpr replaces the Grafana template variables in the expression using the given step
func (q *Query) renderExpr(step time.Duration) string {
	timerange := q.TimeRange.To.Sub(q.TimeRange.From)
	return replaceTemplateVariable(q.Expr, q.BackendQueryInterval, step, q.Interval, q.TimeInterval, timerange)
}

// queryParams builds the per-query request params
func (q *Query) queryParams(expr string, step time.Duration) url.Values {
	params := url.Values{}
	params.Set("query", expr)
	params.Set("step", step.String())
	if q.isRange() {
		aligned := q.TimeRange.alignToStep(step, q.UTCOffsetSec)
		params.Set("start", formatTimestamp(aligned.From))
		params.Set("end", formatTimestamp(aligned.To))
	} else {
		params.Set("time", formatTimestamp(q.TimeRange.To))
	}
	if q.Trace > 0 {
		params.Set("trace", strconv.Itoa(q.Trace))
	}
	return params
}

// buildQueryURL joins the endpoint path to the datasource URL and merges the custom params
// into its query string. A key that perQuery defines is dropped from the URL, so the per-query
// value always wins, whichever method the request uses
func buildQueryURL(rawURL, path string, custom, perQuery url.Values) (*url.URL, error) {
	u, err := newURL(rawURL, path, false)
	if err != nil {
		return nil, fmt.Errorf("failed to build query url: %w", err)
	}
	urlQuery := u.Query()
	mergeValues(urlQuery, custom)
	for k := range perQuery {
		urlQuery.Del(k)
	}
	u.RawQuery = urlQuery.Encode()
	return u, nil
}

// withIntervalVariable checks does query has interval variable
func (q *Query) withIntervalVariable() bool {
	return q.Interval == varInterval || q.Interval == varIntervalMs || q.Interval == varRateInterval
}

// calculateMinInterval tries to calculate interval from requested params
// in duration representation or return error if
func (q *Query) calculateMinInterval() (time.Duration, error) {
	interval := q.Interval
	if q.withIntervalVariable() {
		interval = ""
	}
	return q.getIntervalFrom(interval, defaultScrapeInterval)
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
