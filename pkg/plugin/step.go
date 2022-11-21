package plugin

import (
	"fmt"
	"math"
	"regexp"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/gtime"
)

var (
	defaultResolution int64 = 1500
	year                    = time.Hour * 24 * 365
	day                     = time.Hour * 24
)

// getIntervalFrom returns the minimum interval.
// dsInterval is the string representation of data source min interval, if configured.
// queryInterval is the string representation of query interval (min interval), e.g. "10ms" or "10s".
// queryIntervalMS is a pre-calculated numeric representation of the query interval in milliseconds.
func getIntervalFrom(dsInterval, queryInterval string, queryIntervalMS int64, defaultInterval time.Duration) (time.Duration, error) {
	// Apparently we are setting default value of queryInterval to 0s now
	interval := queryInterval
	if interval == "0s" {
		interval = ""
	}
	if interval == "" {
		if queryIntervalMS != 0 {
			return time.Duration(queryIntervalMS) * time.Millisecond, nil
		}
	}
	if interval == "" && dsInterval != "" {
		interval = dsInterval
	}
	if interval == "" {
		return defaultInterval, nil
	}

	parsedInterval, err := parseIntervalStringToTimeDuration(interval)
	if err != nil {
		return time.Duration(0), err
	}

	return parsedInterval, nil
}

func parseIntervalStringToTimeDuration(interval string) (time.Duration, error) {
	formattedInterval := strings.Replace(strings.Replace(interval, "<", "", 1), ">", "", 1)
	isPureNum, err := regexp.MatchString(`^\d+$`, formattedInterval)
	if err != nil {
		return time.Duration(0), err
	}
	if isPureNum {
		formattedInterval += "s"
	}
	parsedInterval, err := gtime.ParseDuration(formattedInterval)
	if err != nil {
		return time.Duration(0), err
	}
	return parsedInterval, nil
}

func calcStep(minInterval time.Duration, timerange backend.TimeRange, maxDataPoints int64) time.Duration {
	to := timerange.To.UnixNano()
	from := timerange.From.UnixNano()
	resolution := maxDataPoints
	if resolution == 0 {
		resolution = defaultResolution
	}

	calculatedInterval := time.Duration((to - from) / resolution)
	if calculatedInterval < minInterval {
		return minInterval
	}

	return calculatedInterval
}

func calculateRateInterval(interval time.Duration, scrapeInterval string) time.Duration {
	scrape := scrapeInterval
	if scrape == "" {
		scrape = "15s"
	}

	scrapeIntervalDuration, err := parseIntervalStringToTimeDuration(scrape)
	if err != nil {
		return time.Duration(0)
	}

	rateInterval := time.Duration(int64(math.Max(float64(interval+scrapeIntervalDuration), float64(4)*float64(scrapeIntervalDuration))))
	return rateInterval
}

func interpolateVariables(q Query, interval time.Duration, timeInterval string) string {
	expr := q.Expr

	var rateInterval time.Duration
	if q.Interval == varRateInterval {
		rateInterval = interval
	} else {
		rateInterval = calculateRateInterval(interval, timeInterval)
	}

	expr = strings.ReplaceAll(expr, varInterval, formatDuration(interval))
	expr = strings.ReplaceAll(expr, varRateInterval, rateInterval.String())

	return expr
}

func formatDuration(inter time.Duration) string {
	switch {
	case inter >= year:
		return fmt.Sprintf("%dy", inter/year)
	case inter >= day:
		return fmt.Sprintf("%dd", inter/day)
	case inter >= time.Hour:
		return fmt.Sprintf("%dh", inter/time.Hour)
	case inter >= time.Minute:
		return fmt.Sprintf("%dm", inter/time.Minute)
	case inter >= time.Second:
		return fmt.Sprintf("%ds", inter/time.Second)
	case inter >= time.Millisecond:
		return fmt.Sprintf("%dms", inter/time.Millisecond)
	default:
		return "1ms"
	}
}
