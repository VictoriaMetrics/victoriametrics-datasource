import { createFunction } from "../../operations";
import { PromOperationId } from "../../types";

// @ts-ignore
const timezones = Intl?.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];

export function getTimezoneOffset() {
  return createFunction({
    id: PromOperationId.TimezoneOffset,
    params: [{ name: 'tz', type: 'string', options: timezones }],
    defaultParams: [''],
  })
}
