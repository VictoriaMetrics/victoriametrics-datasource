// Copyright (c) 2022 Grafana Labs
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { defaultIntervals } from '@grafana/ui';

interface Args {
  urlRefresh: string | null;
  currentRefresh: string | boolean | undefined;
  isAllowedIntervalFn: (interval: string) => boolean;
  minRefreshInterval: string;
  refreshIntervals?: string[];
}

// getRefreshFromUrl function returns the value from the supplied &refresh= param in url.
// If the supplied interval is not allowed or does not exist in the refresh intervals for the dashboard then we
// try to find the first refresh interval that matches the minRefreshInterval (min_refresh_interval in ini)
// or just take the first interval.
export function getRefreshFromUrl({
                                    urlRefresh,
                                    currentRefresh,
                                    isAllowedIntervalFn,
                                    minRefreshInterval,
                                    refreshIntervals = defaultIntervals,
                                  }: Args): string | boolean | undefined {
  if (!urlRefresh) {
    return currentRefresh;
  }

  const isAllowedInterval = isAllowedIntervalFn(urlRefresh);
  const isExistingInterval = refreshIntervals.find((interval) => interval === urlRefresh);

  if (!isAllowedInterval || !isExistingInterval) {
    const minRefreshIntervalInIntervals = minRefreshInterval
      ? refreshIntervals.find((interval) => interval === minRefreshInterval)
      : undefined;
    const lowestRefreshInterval = refreshIntervals?.length ? refreshIntervals[0] : undefined;

    return minRefreshIntervalInIntervals ?? lowestRefreshInterval ?? currentRefresh;
  }

  return urlRefresh || currentRefresh;
}
