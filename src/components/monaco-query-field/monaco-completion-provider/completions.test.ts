import { getCompletions, DataProvider } from './completions';
import { Situation } from './situation';

function makeDataProvider(): DataProvider {
  return {
    getHistory: jest.fn().mockResolvedValue([]),
    getAllMetricNames: jest.fn().mockResolvedValue([]),
    getAllWithTemplates: jest.fn().mockResolvedValue([]),
    getAllLabelNames: jest.fn().mockResolvedValue(['instance', 'job']),
    getLabelValues: jest.fn().mockResolvedValue([]),
    getSeries: jest.fn().mockResolvedValue({ job: ['j1'], host: ['h2'], instance: ['i1'] }),
  };
}

describe('getCompletions', () => {
  it('suggests label names with a `=` suffix in a label selector', async () => {
    const situation: Situation = {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      metricName: 'something',
      otherLabels: [{ name: 'job', value: 'j1', op: '=' }],
    };

    const completions = await getCompletions(situation, makeDataProvider());
    const labelNames = completions.filter((c) => c.type === 'LABEL_NAME');

    expect(labelNames).toEqual([
      expect.objectContaining({ label: 'host', insertText: 'host=', triggerOnInsert: true }),
      expect.objectContaining({ label: 'instance', insertText: 'instance=', triggerOnInsert: true }),
    ]);
    expect(labelNames[0].isSnippet).toBeFalsy();
  });

  it('suggests label names as a snippet with a trailing comma when a matcher follows the cursor', async () => {
    const situation: Situation = {
      type: 'IN_LABEL_SELECTOR_NO_LABEL_NAME',
      metricName: 'something',
      otherLabels: [
        { name: 'job', value: 'j1', op: '=' },
        { name: 'host', value: 'h2', op: '=' },
      ],
      hasMatcherAfterCursor: true,
    };

    const completions = await getCompletions(situation, makeDataProvider());
    const labelNames = completions.filter((c) => c.type === 'LABEL_NAME');

    expect(labelNames).toEqual([
      expect.objectContaining({
        label: 'instance',
        insertText: 'instance=$0,',
        triggerOnInsert: true,
        isSnippet: true,
      }),
    ]);
  });
});
