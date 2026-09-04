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
	if step <= 0 {
		return tr
	}
	offset := time.Duration(utcOffsetSec) * time.Second
	return TimeRange{
		From: alignTime(tr.From, step, offset),
		To:   alignTime(tr.To, step, offset),
	}
}

// alignTime rounds t down to a multiple of step relative to the Unix epoch shifted by offset.
func alignTime(t time.Time, step, offset time.Duration) time.Time {
	shifted := t.UnixNano() + int64(offset)
	aligned := floorDiv(shifted, int64(step))*int64(step) - int64(offset)
	return time.Unix(0, aligned).UTC()
}

// floorDiv returns a/b rounded towards negative infinity.
func floorDiv(a, b int64) int64 {
	q := a / b
	if a%b != 0 && (a < 0) != (b < 0) {
		q--
	}
	return q
}

// formatTimestamp formats t as unix milliseconds for the start/end/time query params.
func formatTimestamp(t time.Time) string {
	return strconv.FormatInt(t.UnixMilli(), 10)
}
