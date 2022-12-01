package plugin

import (
	"fmt"
	"net/url"
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
	MaxDataPoints int64
	TimeRange     TimeRange
	url           *url.URL
}

// TimeRange represents time range backend object
type TimeRange struct {
	From time.Time
	To   time.Time
}

// queryInstant represents instant query with it params
type queryInstant struct {
	Expr string
	Step time.Duration
	Time time.Time
}

func (i *queryInstant) String() string {
	query := url.QueryEscape(i.Expr)
	return fmt.Sprintf("%s?query=%s&time=%d&step=%f", instantQueryPath, query, i.Time.Unix(), i.Step.Seconds())
}

// queryRange represents instant query with it params
type queryRange struct {
	Expr  string
	Start time.Time
	End   time.Time
	Step  time.Duration
}

func (qr *queryRange) String() string {
	query := url.QueryEscape(qr.Expr)
	return fmt.Sprintf("%s?query=%s&start=%d&end=%d&step=%f", rangeQueryPath, query, qr.Start.Unix(), qr.End.Unix(), qr.Step.Seconds())
}

// GetQueryURL calculates step and clear expression from template variables,
// and after builds query url depends on query type
func (q *Query) getQueryURL(minInterval time.Duration, rawURL string) (string, error) {
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
	iq := queryInstant{
		Expr: expr,
		Step: step,
		Time: q.TimeRange.To,
	}
	q.url.RawQuery = iq.String()
	return q.url.String()
}

// queryRangeURL prepare query url for range query
func (q *Query) queryRangeURL(expr string, step time.Duration) string {
	qr := queryRange{
		Expr:  expr,
		Start: q.TimeRange.From,
		End:   q.TimeRange.To,
		Step:  step,
	}
	q.url.RawQuery = qr.String()
	return q.url.String()
}
