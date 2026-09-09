package plugin

import (
	"strconv"
	"time"
)

type TimeRange struct {
	From time.Time
	To   time.Time
}

// alignToStep rounds both ends of the range down to a multiple of step,
// the same way Grafana Prometheus datasource does for query_range requests.
// It keeps start/end stable between about-same-time queries
func (tr TimeRange) alignToStep(step time.Duration, utcOffsetSec int64) TimeRange {
	stepMs := step.Milliseconds()
	if stepMs <= 0 {
		return tr
	}
	offsetMs := utcOffsetSec * 1000
	return TimeRange{
		From: alignTime(tr.From, stepMs, offsetMs),
		To:   alignTime(tr.To, stepMs, offsetMs),
	}
}

// alignTime rounds t down to a multiple of step relative to the Unix epoch shifted by offset.
func alignTime(t time.Time, stepMs, offsetMs int64) time.Time {
	shifted := t.UnixMilli() + offsetMs
	q := shifted / stepMs
	if shifted%stepMs < 0 {
		q--
	}
	return time.UnixMilli(q*stepMs - offsetMs).UTC()
}

// formatTimestamp formats t as unix milliseconds for the start/end/time query params.
func formatTimestamp(t time.Time) string {
	return strconv.FormatInt(t.UnixMilli(), 10)
}
