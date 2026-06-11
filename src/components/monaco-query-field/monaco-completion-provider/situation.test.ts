import { getSituation, Situation } from './situation';

// we use the `^` character as the cursor-marker in the string.
function assertSituation(situation: string, expectedSituation: Situation | null) {
  // first we find the cursor-position
  const pos = situation.indexOf('^');
  if (pos === -1) {
    throw new Error('cursor missing');
  }

  // we remove the cursor-marker from the string
  const text = situation.replace('^', '');

  // sanity check, make sure no more cursor-markers remain
  if (text.indexOf('^') !== -1) {
    throw new Error('multiple cursors');
  }

  const result = getSituation(text, pos);

  if (expectedSituation === null) {
    expect(result).toStrictEqual(null);
  } else {
    expect(result).toMatchObject(expectedSituation);
  }
}

describe('situation', () => {
  it('handles things', () => {
    assertSituation('^', {
      type: 'EMPTY',
    });

    assertSituation('sum(one) ^', {
      type: 'AT_ROOT',
    });

    assertSituation('sum(^)', {
      type: 'IN_FUNCTION',
    });

    assertSituation('sum(one) / sum(^)', {
      type: 'IN_FUNCTION',
    });

    assertSituation('something{}[^]', {
      type: 'IN_DURATION',
    });

    assertSituation('something{label~^}', null);
  });

  it('handles label names', () => {
    assertSituation('something{^}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      metricName: 'something',
      otherLabels: [],
    });

    assertSituation('sum(something) by (^)', {
      type: 'IN_GROUPING',
      metricName: 'something',
      otherLabels: [],
    });

    assertSituation('sum by (^) (something)', {
      type: 'IN_GROUPING',
      metricName: 'something',
      otherLabels: [],
    });

    assertSituation('something{one="val1",two!="val2",three=~"val3",four!~"val4",^}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      metricName: 'something',
      otherLabels: [
        { name: 'one', value: 'val1', op: '=' },
        { name: 'two', value: 'val2', op: '!=' },
        { name: 'three', value: 'val3', op: '=~' },
        { name: 'four', value: 'val4', op: '!~' },
      ],
    });

    assertSituation('{^}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      otherLabels: [],
    });

    assertSituation('{one="val1",^}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      otherLabels: [{ name: 'one', value: 'val1', op: '=' }],
    });

    // single-quoted label-values with escape
    assertSituation("{one='val\\'1',^}", {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      otherLabels: [{ name: 'one', value: "val'1", op: '=' }],
    });

    // double-quoted label-values with escape
    assertSituation('{one="val\\"1",^}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      otherLabels: [{ name: 'one', value: 'val"1', op: '=' }],
    });

    // backticked label-values with escape (the escape should not be interpreted)
    assertSituation('{one=`val\\"1`,^}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      otherLabels: [{ name: 'one', value: 'val\\"1', op: '=' }],
    });
  });

  it('handles label names after a middle comma', () => {
    assertSituation('something{job="j1",^host="h2"}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      hasMatcherAfterCursor: true,
      metricName: 'something',
      otherLabels: [
        { name: 'job', value: 'j1', op: '=' },
        { name: 'host', value: 'h2', op: '=' },
      ],
    });

    // with whitespace around the cursor
    assertSituation('something{job="j1", ^ host="h2"}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      hasMatcherAfterCursor: true,
      metricName: 'something',
      otherLabels: [
        { name: 'job', value: 'j1', op: '=' },
        { name: 'host', value: 'h2', op: '=' },
      ],
    });

    // three labels, cursor after the first comma (nested LabelMatchList)
    assertSituation('something{a="1",^b="2",c="3"}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      hasMatcherAfterCursor: true,
      metricName: 'something',
      otherLabels: [
        { name: 'a', value: '1', op: '=' },
        { name: 'b', value: '2', op: '=' },
        { name: 'c', value: '3', op: '=' },
      ],
    });

    // three labels, cursor after the second comma
    assertSituation('something{a="1",b="2",^c="3"}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      hasMatcherAfterCursor: true,
      metricName: 'something',
      otherLabels: [
        { name: 'a', value: '1', op: '=' },
        { name: 'b', value: '2', op: '=' },
        { name: 'c', value: '3', op: '=' },
      ],
    });

    // without a metric name
    assertSituation('{job="j1",^host="h2"}', {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      hasMatcherAfterCursor: true,
      otherLabels: [
        { name: 'job', value: 'j1', op: '=' },
        { name: 'host', value: 'h2', op: '=' },
      ],
    });

    // cursor before the comma must not trigger label-name suggestions
    assertSituation('something{job="j1"^,host="h2"}', null);
  });

  it('handles label values', () => {
    assertSituation('something{job=^}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'job',
      betweenQuotes: false,
      otherLabels: [],
    });

    assertSituation('something{job!=^}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'job',
      betweenQuotes: false,
      otherLabels: [],
    });

    assertSituation('something{job=~^}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'job',
      betweenQuotes: false,
      otherLabels: [],
    });

    assertSituation('something{job!~^}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'job',
      betweenQuotes: false,
      otherLabels: [],
    });

    assertSituation('something{job=^,host="h1"}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'job',
      betweenQuotes: false,
      otherLabels: [{ name: 'host', value: 'h1', op: '=' }],
    });

    assertSituation('something{job="j1",host="^"}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'host',
      betweenQuotes: true,
      otherLabels: [{ name: 'job', value: 'j1', op: '=' }],
    });

    assertSituation('something{job="j1"^}', null);
    assertSituation('something{job="j1" ^ }', null);
    assertSituation('something{job="j1" ^   ,   }', null);

    assertSituation('{job=^,host="h1"}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      labelName: 'job',
      betweenQuotes: false,
      otherLabels: [{ name: 'host', value: 'h1', op: '=' }],
    });

    assertSituation('something{one="val1",two!="val2",three=^,four=~"val4",five!~"val5"}', {
      type: 'IN_LABEL_SELECTOR_WITH_LABEL_NAME',
      metricName: 'something',
      labelName: 'three',
      betweenQuotes: false,
      otherLabels: [
        { name: 'one', value: 'val1', op: '=' },
        { name: 'two', value: 'val2', op: '!=' },
        { name: 'four', value: 'val4', op: '=~' },
        { name: 'five', value: 'val5', op: '!~' },
      ],
    });
  });
});
