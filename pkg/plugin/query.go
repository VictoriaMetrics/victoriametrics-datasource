package plugin

import (
	"fmt"
	"net/url"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

const (
	varInterval     = "$__interval"
	varRateInterval = "$__rate_interval"

	instantQueryPath = "/api/v1/query"
	rangeQueryPath   = "/api/v1/query_range"
)

type Query struct {
	RefId        string `json:"refId"`
	Instant      bool   `json:"instant"`
	Range        bool   `json:"range"`
	Interval     string `json:"interval"`
	IntervalMs   int64  `json:"intervalMs"`
	TimeInterval string `json:"timeInterval"`
	Expr         string `json:"expr"`
	From         time.Time
	To           time.Time
	Step         time.Duration
}

type instantQuery struct {
	Expr string
	Step time.Duration
	Time time.Time
}

func (i *instantQuery) String() string {
	query := url.QueryEscape(i.Expr)
	return fmt.Sprintf("%s?query=%s&time=%d&step=%f", instantQueryPath, query, i.Time.Unix(), i.Step.Seconds())
}

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

func (q *Query) GetQueryURL(timeRange backend.TimeRange, url string) string {
	var reqURL string
	if q.Instant {
		iq := instantQuery{
			Expr: q.Expr,
			Step: q.Step,
			Time: timeRange.To,
		}
		reqURL = fmt.Sprintf("%s%s", url, iq.String())
	}
	if q.Range {
		qr := queryRange{
			Expr:  q.Expr,
			Start: timeRange.From,
			End:   timeRange.To,
			Step:  q.Step,
		}
		reqURL = fmt.Sprintf("%s%s", url, qr.String())
	}
	log.DefaultLogger.Info("REQUEST URL => %s", reqURL)
	return reqURL
}

func (q *Query) WithIntervalVariable() bool {
	return q.Interval == varInterval || q.Interval == varRateInterval
}
