package plugin

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	instantQueryPath = "/api/v1/query"
	rangeQueryPath   = "/api/v1/query_range"
)

// Query represents backend query object
type Query struct {
	RefId         string `json:"refId"`
	Instant       bool   `json:"instant"`
	Range         bool   `json:"range"`
	Interval      string `json:"interval"`
	IntervalMs    int64  `json:"intervalMs"`
	TimeInterval  string `json:"timeInterval"`
	Expr          string `json:"expr"`
	LegendFormat  string `json:"legendFormat"`
	MaxDataPoints int64
	TimeRange     TimeRange
	url           *url.URL
}

// TimeRange represents time range backend object
type TimeRange struct {
	From time.Time
	To   time.Time
}

// GetQueryURL calculates step and clear expression from template variables,
// and after builds query url depends on query type
func (q *Query) getQueryURL(minInterval time.Duration, rawURL string) (string, error) {
	if rawURL == "" {
		return "", fmt.Errorf("url can't be blank")
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("failed to parse datasource url: %s", err)
	}

	q.url = u
	from := q.TimeRange.From
	to := q.TimeRange.To
	timerange := to.Sub(from)

	step := calculateStep(minInterval, from, to, q.MaxDataPoints)
	expr := replaceTemplateVariable(q.Expr, timerange, minInterval, q.Interval)

	if expr == "" {
		return "", fmt.Errorf("expression can't be blank")
	}

	if q.Instant {
		return q.queryInstantURL(expr, step), nil
	}
	return q.queryRangeURL(expr, step), nil
}

// withIntervalVariable checks does query has interval variable
func (q *Query) withIntervalVariable() bool {
	return q.Interval == varInterval || q.Interval == varIntervalMs || q.Interval == varRateInterval
}

// calculateMinInterval tries to calculate interval from requested params
// in duration representation or return error if
func (q *Query) calculateMinInterval() (time.Duration, error) {
	return getIntervalFrom(q.TimeInterval, q.Interval, q.IntervalMs, defaultScrapeInterval)
}

// queryInstantURL prepare query url for instant query
func (q *Query) queryInstantURL(expr string, step time.Duration) string {
	q.url.Path = instantQueryPath
	values := q.url.Query()

	values.Add("query", expr)
	values.Add("time", strconv.FormatInt(q.TimeRange.To.Unix(), 10))
	values.Add("step", step.String())

	q.url.RawQuery = values.Encode()
	return q.url.String()
}

// queryRangeURL prepare query url for range query
func (q *Query) queryRangeURL(expr string, step time.Duration) string {
	q.url.Path = rangeQueryPath
	values := q.url.Query()

	values.Add("query", expr)
	values.Add("start", strconv.FormatInt(q.TimeRange.From.Unix(), 10))
	values.Add("end", strconv.FormatInt(q.TimeRange.To.Unix(), 10))
	values.Add("step", step.String())

	q.url.RawQuery = values.Encode()
	return q.url.String()
}

func (q *Query) parseLegend() string {
	repl := strings.NewReplacer("{{", "", "}}", "")
	legend := repl.Replace(q.LegendFormat)

	if legend == "{}" {
		return q.Expr
	}
	return legend
}
