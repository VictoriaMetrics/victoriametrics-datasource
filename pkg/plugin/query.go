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
	MaxDataPoints        int64
	TimeRange            TimeRange
	BackendQueryInterval time.Duration
}

// TimeRange represents time range backend object
type TimeRange struct {
	From time.Time
	To   time.Time
}

// getQueryURL calculates step and clear expression from template variables,
// and after builds query url depends on query type
func (q *Query) getQueryURL(rawURL string, queryParams url.Values) (string, error) {
	from := q.TimeRange.From
	to := q.TimeRange.To
	timerange := to.Sub(from)
	originalQueryInterval := q.Interval
	minInterval, err := q.calculateMinInterval()
	if err != nil {
		return "", fmt.Errorf("failed to calculate minimal interval: %w", err)
	}

	step := q.calculateStep(minInterval)
	expr := replaceTemplateVariable(q.Expr, q.BackendQueryInterval, step, originalQueryInterval, q.TimeInterval, timerange)

	if expr == "" {
		return "", fmt.Errorf("expression can't be blank")
	}

	var u *url.URL
	var values url.Values

	if q.Range || !q.Instant {
		u, err = newURL(rawURL, rangeQueryPath, false)
		if err != nil {
			return "", fmt.Errorf("failed to build query url: %w", err)
		}
		values = u.Query()
		for k, vl := range queryParams {
			for _, v := range vl {
				values.Add(k, v)
			}
		}
		values.Add("start", strconv.FormatInt(q.TimeRange.From.Unix(), 10))
		values.Add("end", strconv.FormatInt(q.TimeRange.To.Unix(), 10))
	} else {
		u, err = newURL(rawURL, instantQueryPath, false)
		if err != nil {
			return "", fmt.Errorf("failed to build query url: %w", err)
		}
		values = u.Query()
		for k, vl := range queryParams {
			for _, v := range vl {
				values.Add(k, v)
			}
		}
		values.Set("time", strconv.FormatInt(q.TimeRange.To.Unix(), 10))
	}
	if q.Trace > 0 {
		values.Set("trace", strconv.Itoa(q.Trace))
	}
	values.Set("query", expr)
	values.Set("step", step.String())

	u.RawQuery = values.Encode()
	return u.String(), nil
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

func labelsToString(labels data.Labels) string {
	if labels == nil || len(labels) < 1 {
		return "{}"
	}

	var labelStrings []string
	for label, value := range labels {
		if label == metricsName {
			continue
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
