export const formatDescriptions: Record<string, string> = {
  'YYYY': 'Year (4 digits)',
  'YY': 'Year (2 digits)',
  'MMMM': 'Month (full name)',
  'MMM': 'Month (short name)',
  'MM': 'Month (2 digits)',
  'DD': 'Day (2 digits)',
  'HH': 'Hour (24-hour format)',
  'hh': 'Hour (12-hour format)',
  'mm': 'Minute',
  'ss': 'Second',
  'SSSSSSSSS': 'Nanosecond',
  'SSS': 'Millisecond',
  'ZZZ': 'Timezone abbreviation',
  'Z': 'Timezone offset',
  'A': 'AM/PM',
} as const;

const mapping: Record<string, string> = {
  'YYYY': '2006',
  'YY': '06',
  'MMMM': 'January',
  'MMM': 'Jan',
  'MM': '01',
  'DD': '02',
  'HH': '15',
  'hh': '03',
  'mm': '04',
  'ss': '05',
  'SSSSSSSSS': '000000000',
  'SSS': '000',
  'ZZZ': 'MST',
  'Z': '-0700',
  'A': 'PM',
} as const;

export const convertLDMLLayoutToGoTimeLayout = (layout: string) => {
  let result = layout;
  for (const [ldml, goLayout] of Object.entries(mapping)) {
    result = result.replaceAll(ldml, goLayout);
  }

  return result;
};
