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
}

// TimeRange represents time range backend object
type TimeRange struct {
	From time.Time
	To   time.Time
}

// instantQuery represents instant query with it params
type instantQuery struct {
	Expr string
	Step time.Duration
	Time time.Time
}

func (i *instantQuery) String() string {
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
func (q *Query) GetQueryURL(minInterval time.Duration, url string) string {
	from := q.TimeRange.From
	to := q.TimeRange.To
	step := calculateStep(minInterval, from, to, q.MaxDataPoints)

	timerange := to.Sub(from)
	expr := replaceTemplateVariable(q.Expr, timerange, minInterval, q.Interval)

	var reqURL string
	if q.Instant {
		iq := instantQuery{
			Expr: expr,
			Step: step,
			Time: q.TimeRange.To,
		}
		reqURL = fmt.Sprintf("%s%s", url, iq.String())
	}
	if q.Range {
		qr := queryRange{
			Expr:  expr,
			Start: q.TimeRange.From,
			End:   q.TimeRange.To,
			Step:  step,
		}
		reqURL = fmt.Sprintf("%s%s", url, qr.String())
	}
	return reqURL
}

// WithIntervalVariable checks does query has interval variable
func (q *Query) WithIntervalVariable() bool {
	return q.Interval == varInterval || q.Interval == varIntervalMs || q.Interval == varRateInterval
}

// CalculateMinInterval tries to calculate interval from requested params
// in duration representation or return error if
func (q *Query) CalculateMinInterval() (time.Duration, error) {
	return getIntervalFrom(q.TimeInterval, q.Interval, q.IntervalMs, defaultScrapeInterval)
}
