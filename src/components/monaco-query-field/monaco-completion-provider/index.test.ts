import type { Monaco, monacoTypes } from '@grafana/ui';

import { DataProvider } from './completions';

import { getCompletionProvider } from './index';

const INSERT_AS_SNIPPET = 4;

const monacoMock = {
  Range: {
    lift: (range: unknown) => range,
    fromPositions: (position: { lineNumber: number; column: number }) => ({
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: position.column,
      endColumn: position.column,
    }),
  },
  languages: {
    CompletionItemKind: {
      Unit: 0,
      Variable: 1,
      Snippet: 2,
      Enum: 3,
      EnumMember: 4,
      Constructor: 5,
      Constant: 6,
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: INSERT_AS_SNIPPET,
    },
  },
} as unknown as Monaco;

function makeModel(text: string): monacoTypes.editor.ITextModel {
  return {
    getValue: () => text,
    getOffsetAt: (position: { lineNumber: number; column: number }) => position.column - 1,
    getWordAtPosition: () => null,
    getLineContent: () => text,
  } as unknown as monacoTypes.editor.ITextModel;
}

function makeDataProvider(): DataProvider {
  return {
    getHistory: jest.fn().mockResolvedValue([]),
    getAllMetricNames: jest.fn().mockResolvedValue([]),
    getAllWithTemplates: jest.fn().mockResolvedValue([]),
    getAllLabelNames: jest.fn().mockResolvedValue([]),
    getLabelValues: jest.fn().mockResolvedValue([]),
    getSeries: jest.fn().mockResolvedValue({ job: ['j1'], host: ['h2'], instance: ['i1'] }),
  };
}

describe('getCompletionProvider', () => {
  it('marks label-name suggestions after a middle comma as snippets', async () => {
    const text = 'something{job="j1",host="h2"}';
    const position = {
      lineNumber: 1,
      column: 'something{job="j1",'.length + 1,
    } as monacoTypes.Position;

    const provider = getCompletionProvider(monacoMock, makeDataProvider());
    const result = await provider.provideCompletionItems(
      makeModel(text),
      position,
      {} as monacoTypes.languages.CompletionContext,
      {} as monacoTypes.CancellationToken
    );

    const suggestions = result?.suggestions ?? [];
    expect(suggestions).toEqual([
      expect.objectContaining({
        label: 'instance',
        insertText: 'instance=$0,',
        insertTextRules: INSERT_AS_SNIPPET,
      }),
    ]);
  });

  it('does not mark label-name suggestions at the end of a selector as snippets', async () => {
    const text = 'something{job="j1",host="h2",}';
    const position = {
      lineNumber: 1,
      column: 'something{job="j1",host="h2",'.length + 1,
    } as monacoTypes.Position;

    const provider = getCompletionProvider(monacoMock, makeDataProvider());
    const result = await provider.provideCompletionItems(
      makeModel(text),
      position,
      {} as monacoTypes.languages.CompletionContext,
      {} as monacoTypes.CancellationToken
    );

    const suggestions = result?.suggestions ?? [];
    expect(suggestions).toEqual([
      expect.objectContaining({
        label: 'instance',
        insertText: 'instance=',
        insertTextRules: undefined,
      }),
    ]);
  });
});
