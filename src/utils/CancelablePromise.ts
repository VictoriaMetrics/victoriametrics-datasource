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

// https://github.com/facebook/react/issues/5465

export interface CancelablePromise<T> {
  promise: Promise<T>;
  cancel: () => void;
}

export interface CancelablePromiseRejection {
  isCanceled: boolean;
}

export function isCancelablePromiseRejection(promise: unknown): promise is CancelablePromiseRejection {
  return typeof promise === "object" && promise !== null && "isCanceled" in promise;
}

export const makePromiseCancelable = <T>(promise: Promise<T>): CancelablePromise<T> => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    const canceledPromiseRejection: CancelablePromiseRejection = { isCanceled: true };
    promise.then((val) => (hasCanceled_ ? reject(canceledPromiseRejection) : resolve(val)));
    promise.catch((error) => (hasCanceled_ ? reject(canceledPromiseRejection) : reject(error)));
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};
