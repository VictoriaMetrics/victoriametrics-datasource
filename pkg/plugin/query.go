package plugin

import (
	"fmt"
	"net/url"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type Query struct {
	RefId      string        `json:"refId"`
	Instant    bool          `json:"instant"`
	Range      bool          `json:"range"`
	IntervalMs time.Duration `json:"intervalMs"`
	Expr       string        `json:"expr"`
	From       time.Time
	To         time.Time
	sourceURL  string
}

type instantQuery struct {
	RefId string
	Expr  string
	Step  time.Duration
	From  time.Time
}

func (i *instantQuery) String() string {
	query := url.QueryEscape(i.Expr)
	t := url.QueryEscape(i.From.Format(time.RFC3339))
	return fmt.Sprintf("/api/v1/query?query=%s&time=%s", query, t)
}

type queryRange struct {
	RefId string `json:"refId"`
	Expr  string `json:"expr"`
	From  time.Time
	To    time.Time
	Step  time.Duration
}

func (qr *queryRange) String() string {
	query := url.QueryEscape(qr.Expr)
	start := url.QueryEscape(qr.From.Format(time.RFC3339))
	end := url.QueryEscape(qr.To.Format(time.RFC3339))
	return fmt.Sprintf("/api/v1/query_range?query=%s&start=%s&end=%s", query, start, end)
}

func (q *Query) GetQueryURL(query backend.DataQuery) string {
	var reqURL string
	if q.Instant {
		iq := instantQuery{
			RefId: query.RefID,
			Expr:  q.Expr,
			Step:  q.IntervalMs,
			From:  query.TimeRange.From,
		}
		reqURL = fmt.Sprintf("%s%s", q.sourceURL, iq.String())
	}
	if q.Range {
		qr := queryRange{
			RefId: query.RefID,
			Expr:  q.Expr,
			From:  query.TimeRange.From,
			To:    query.TimeRange.To,
			Step:  q.IntervalMs,
		}
		reqURL = fmt.Sprintf("%s%s", q.sourceURL, qr.String())
	}
	return reqURL
}
