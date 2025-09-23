package plugin

import (
	"fmt"
	"strconv"
	"time"
)

// parseFloatToTime converts a floating-point timestamp to a time.Time instance with millisecond precision.
func parseFloatToTime(timestamp float64) (time.Time, error) {
	if timestamp < 0 {
		return time.Now(), fmt.Errorf("error negative timestamp: %f", timestamp)
	}
	seconds := int64(timestamp)
	// convert fractional part to string with 3 decimal places to avoid floating-point precision issues
	frac := strconv.FormatFloat(timestamp, 'f', 3, 64)
	frac = frac[len(frac)-3:]
	ms, err := strconv.Atoi(frac)
	if err != nil {
		return time.Now(), fmt.Errorf("error convert fractional string to int: %s", err)
	}
	nanos := int64(ms) * 1e6
	return time.Unix(seconds, nanos), nil
}
