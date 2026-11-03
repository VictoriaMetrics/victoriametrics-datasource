import { AbstractLabelOperator } from '@grafana/data';

import { PrometheusDatasource } from './datasource';
import LanguageProvider from './language_provider';

describe('Language completion provider', () => {
  const datasource: PrometheusDatasource = {
    getRequest: () => ({ data: [] }),
    getTimeRangeParams: () => ({ start: '0', end: '1' }),
    interpolateString: (string: string) => string,
    hasLabelsMatchAPISupport: () => false,
    getLimitMetrics: () => 0,
    useOptimizedLabelsApi: () => false,
  } as unknown as PrometheusDatasource;

  describe('fetchSeries', () => {
    it('should use match[] parameter', () => {
      const languageProvider = new LanguageProvider(datasource);
      const fetchSeries = languageProvider.fetchSeries;
      const requestSpy = jest.spyOn(languageProvider, 'request');
      fetchSeries('{job="grafana"}');
      expect(requestSpy).toHaveBeenCalled();
      expect(requestSpy).toHaveBeenCalledWith(
        '/api/v1/series',
        {},
        { end: '1', 'match[]': '{job="grafana"}', start: '0', limit: 0 }
      );
    });
  });

  describe('fetchSeriesLabels', () => {
    it('should interpolate variable in series', () => {
      const languageProvider = new LanguageProvider({
        ...datasource,
        interpolateString: (string: string) => string.replace(/\$/, 'interpolated-'),
      } as PrometheusDatasource);
      const fetchSeriesLabels = languageProvider.fetchSeriesLabels;
      const requestSpy = jest.spyOn(languageProvider, 'request');
      fetchSeriesLabels('$metric');
      expect(requestSpy).toHaveBeenCalled();
      expect(requestSpy).toHaveBeenCalledWith('/api/v1/series', [], {
        end: '1',
        'match[]': 'interpolated-metric',
        start: '0',
        limit: 0,
      });
    });
  });

  describe('fetchLabelValues', () => {
    it('should interpolate variable in series', () => {
      const languageProvider = new LanguageProvider({
        ...datasource,
        interpolateString: (string: string) => string.replace(/\$/, 'interpolated-'),
      } as PrometheusDatasource);
      const fetchLabelValues = languageProvider.fetchLabelValues;
      const requestSpy = jest.spyOn(languageProvider, 'request');
      fetchLabelValues('$job');
      expect(requestSpy).toHaveBeenCalled();
      expect(requestSpy).toHaveBeenCalledWith('/api/v1/label/interpolated-job/values', [], {
        end: '1',
        start: '0',
        limit: 0,
      });
    });
  });

  describe('getSeries', () => {
    it('does not re-fetch default labels', async () => {
      const datasource: PrometheusDatasource = {
        getRequest: jest.fn(() => ({ data: [] })),
        getTimeRangeParams: jest.fn(() => ({ start: '0', end: '1' })),
        interpolateString: (string: string) => string,
        getLimitMetrics: () => 0,
      } as unknown as PrometheusDatasource;

      const mockedGetRequest = jest.mocked(datasource.getRequest);

      const instance = new LanguageProvider(datasource);
      const promise1 = instance.getSeries('{}');
      // one call for 2 default labels job, instance
      expect(mockedGetRequest.mock.calls.length).toBe(2);
      const promise2 = instance.getSeries('{}');
      expect(mockedGetRequest.mock.calls.length).toBe(2);
      await Promise.all([promise1, promise2]);
      expect(mockedGetRequest.mock.calls.length).toBe(2);
    });

    it('does not issue any requests when lookup is disabled', async () => {
      const datasource: PrometheusDatasource = {
        getRequest: jest.fn(() => ({ data: ['foo', 'bar'] as string[] })),
        getTimeRangeParams: jest.fn(() => ({ start: '0', end: '1' })),
        lookupsDisabled: true,
        getLimitMetrics: () => 0,
      } as unknown as PrometheusDatasource;
      const mockedGetRequest = jest.mocked(datasource.getRequest);
      const instance = new LanguageProvider(datasource);

      expect(await instance.getSeries('{}')).toEqual({});
      expect(mockedGetRequest.mock.calls.length).toBe(0);
    });
  });

  describe('disabled metrics lookup', () => {
    it('does not issue any metadata requests when lookup is disabled', async () => {
      const datasource: PrometheusDatasource = {
        getRequest: jest.fn(() => ({ data: ['foo', 'bar'] as string[] })),
        getTimeRangeParams: jest.fn(() => ({ start: '0', end: '1' })),
        lookupsDisabled: true,
        getLimitMetrics: () => 0,
      } as unknown as PrometheusDatasource;
      const mockedGetRequest = jest.mocked(datasource.getRequest);
      const instance = new LanguageProvider(datasource);

      expect(mockedGetRequest.mock.calls.length).toBe(0);
      await instance.start();
      expect(mockedGetRequest.mock.calls.length).toBe(0);
    });
    it('issues metadata requests when lookup is not disabled', async () => {
      const datasource: PrometheusDatasource = {
        getRequest: jest.fn(() => ({ data: ['foo', 'bar'] as string[] })),
        getTimeRangeParams: jest.fn(() => ({ start: '0', end: '1' })),
        lookupsDisabled: false,
        interpolateString: (string: string) => string,
        getLimitMetrics: () => 0,
      } as unknown as PrometheusDatasource;
      const mockedGetRequest = jest.mocked(datasource.getRequest);
      const instance = new LanguageProvider(datasource);

      expect(mockedGetRequest.mock.calls.length).toBe(0);
      await instance.start();
      expect(mockedGetRequest.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Query imports', () => {
    it('returns empty queries', async () => {
      const instance = new LanguageProvider(datasource);
      const result = await instance.importFromAbstractQuery({ refId: 'bar', labelMatchers: [] });
      expect(result).toEqual({ refId: 'bar', expr: '', range: true });
    });

    describe('exporting to abstract query', () => {
      it('exports labels with metric name', async () => {
        const instance = new LanguageProvider(datasource);
        const abstractQuery = instance.exportToAbstractQuery({
          refId: 'bar',
          expr: 'metric_name{label1="value1", label2!="value2", label3=~"value3", label4!~"value4"}',
          instant: true,
          range: false,
        });
        expect(abstractQuery).toMatchObject({
          refId: 'bar',
          labelMatchers: [
            { name: 'label1', operator: AbstractLabelOperator.Equal, value: 'value1' },
            { name: 'label2', operator: AbstractLabelOperator.NotEqual, value: 'value2' },
            { name: 'label3', operator: AbstractLabelOperator.EqualRegEx, value: 'value3' },
            { name: 'label4', operator: AbstractLabelOperator.NotEqualRegEx, value: 'value4' },
            { name: '__name__', operator: AbstractLabelOperator.Equal, value: 'metric_name' },
          ],
        });
      });
    });
  });
});
