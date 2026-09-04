package plugin

import (
	"testing"
	"time"
)

func TestTimeRange_alignToStep(t *testing.T) {
	f := func(tr TimeRange, step time.Duration, utcOffsetSec int64, wantFrom, wantTo int64) {
		t.Helper()
		got := tr.alignToStep(step, utcOffsetSec)
		if got.From.Unix() != wantFrom {
			t.Errorf("alignToStep() From = %d, want %d", got.From.Unix(), wantFrom)
		}
		if got.To.Unix() != wantTo {
			t.Errorf("alignToStep() To = %d, want %d", got.To.Unix(), wantTo)
		}
	}

	// 2022-12-05 08:32:13 UTC .. 08:33:13 UTC
	tr := TimeRange{From: time.Unix(1670226733, 0), To: time.Unix(1670226793, 0)}

	// both ends are rounded down to a multiple of step
	f(tr, 5*time.Second, 0, 1670226730, 1670226790)
	f(tr, 30*time.Second, 0, 1670226720, 1670226780)

	// range shorter than step collapses to a single aligned point
	f(tr, time.Hour, 0, 1670223600, 1670223600)

	// already aligned range is left untouched
	aligned := TimeRange{From: time.Unix(1670223600, 0), To: time.Unix(1670227200, 0)}
	f(aligned, time.Hour, 0, 1670223600, 1670227200)

	// sub-second part of the range boundary is dropped by the alignment
	withMillis := TimeRange{From: time.Unix(1670226733, 0), To: time.Unix(1670226733, 100_000_000)}
	f(withMillis, 30*time.Second, 0, 1670226720, 1670226720)

	// utc offset shifts the alignment grid so that 1d step lands on local midnight
	f(tr, 24*time.Hour, 0, 1670198400, 1670198400)      // 2022-12-05 00:00 UTC
	f(tr, 24*time.Hour, 14400, 1670184000, 1670184000)  // 2022-12-05 00:00 UTC+4
	f(tr, 24*time.Hour, -18000, 1670216400, 1670216400) // 2022-12-05 00:00 UTC-5

	// utc offset does not change alignment when it is a multiple of step
	f(tr, time.Hour, 14400, 1670223600, 1670223600)

	// non-positive step disables alignment
	f(tr, 0, 0, 1670226733, 1670226793)
	f(tr, -time.Second, 0, 1670226733, 1670226793)
}
