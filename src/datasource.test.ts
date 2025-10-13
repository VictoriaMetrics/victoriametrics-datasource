import { cloneDeep } from 'lodash';
import { of } from 'rxjs';

import {
  CoreApp,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  dateTime,
  getFieldDisplayName,
  ScopedVar,
  ScopedVars,
  toDataFrame,
} from '@grafana/data';
import { getBackendSrv, setBackendSrv, TemplateSrv } from '@grafana/runtime';

import {
  extractRuleMappingFromGroups,
  PrometheusDatasource,
  prometheusRegularEscape,
  prometheusSpecialRegexEscape,
} from './datasource';
import { TimeSrv } from './services/TimeSrv';
import { PromOptions, PromQuery } from './types';

const fetchMock = jest.fn().mockReturnValue(of(createDefaultPromResponse()));

jest.mock('./metric_find_query');

setBackendSrv({
  ...getBackendSrv(),
  fetch: fetchMock,
});

const getAdhocFiltersMock = jest.fn().mockImplementation(() => []);
const replaceMock = jest.fn().mockImplementation((a: string) => a);

const templateSrvStub = {
  getAdhocFilters: getAdhocFiltersMock,
  replace: replaceMock,
} as unknown as TemplateSrv;

const timeSrvStub = {
  timeRange() {
    return {
      from: dateTime(1531468681),
      to: dateTime(1531489712),
    };
  },
} as unknown as TimeSrv;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PrometheusDatasource', () => {
  let ds: PrometheusDatasource;
  const instanceSettings = {
    url: 'proxied',
    id: 1,
    uid: 'ABCDEF',
    directUrl: 'direct',
    user: 'test',
    password: 'mupp',
    jsonData: {},
  } as unknown as DataSourceInstanceSettings<PromOptions>;

  beforeEach(() => {
    ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);
  });

  describe('Datasource metadata requests', () => {
    it('should perform a GET request with the default config', () => {
      ds.getRequest('foo', { bar: 'baz baz', foo: 'foo' });
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('GET');
      expect(fetchMock.mock.calls[0][0].params).toEqual({ bar: 'baz baz', foo: 'foo' });
    });

    it('should still perform a GET request with the DS HTTP method set to POST and not POST-friendly endpoint', () => {
      const postSettings = cloneDeep(instanceSettings);
      postSettings.jsonData.httpMethod = 'POST';
      const promDs = new PrometheusDatasource(postSettings, templateSrvStub, timeSrvStub);
      promDs.getRequest('foo');
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('GET');
    });

    it('should try to perform a GET request with the DS HTTP method set to GET and GET-friendly endpoint', () => {
      const postSettings = cloneDeep(instanceSettings);
      const promDs = new PrometheusDatasource(postSettings, templateSrvStub, timeSrvStub);
      promDs.getRequest('api/v1/series', { bar: 'baz baz', foo: 'foo' });
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('GET');
      expect(fetchMock.mock.calls[0][0].url).not.toContain('bar=baz%20baz&foo=foo');
      expect(fetchMock.mock.calls[0][0].params).toEqual({ bar: 'baz baz', foo: 'foo' });
    });

    it('should perform a GET request with the custom query params', () => {
      const postSettings = cloneDeep(instanceSettings);
      const promDs = new PrometheusDatasource({
        ...postSettings,
        jsonData: { customQueryParameters: "extra_filter[]={foo: \"bar\"}" }
      }, templateSrvStub, timeSrvStub);
      promDs.getRequest('api/v1/label/id/values', { bar: 'baz baz', foo: 'foo' });
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('GET');
      expect(fetchMock.mock.calls[0][0].params).toEqual({
        bar: 'baz baz',
        foo: 'foo',
        "extra_filter[]": "{foo: \"bar\"}",
      });
    });
  });

  describe('customQueryParams', () => {
    const target: PromQuery = { expr: 'test{job="testjob"}', format: 'time_series', refId: '' };

    function makeQuery(target: PromQuery) {
      return {
        range: { from: time({ seconds: 63 }), to: time({ seconds: 183 }) },
        targets: [target],
        interval: '60s',
      } as DataQueryRequest<PromQuery>;
    }

    describe('with GET http method', () => {
      const promDs = new PrometheusDatasource(
        { ...instanceSettings, jsonData: {} },
        templateSrvStub,
        timeSrvStub
      );

      it('adds params to timeseries query', () => {
        promDs.query(makeQuery(target));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].url).toBe(
          '/api/ds/query?ds_type=victoriametrics-metrics-datasource'
        );
      });

      it('adds params to instant query', () => {
        promDs.query(makeQuery({ ...target, instant: true }));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].url).toEqual('/api/ds/query?ds_type=victoriametrics-metrics-datasource');
        expect(fetchMock.mock.calls[0][0].data).toEqual({
          from: '63000',
          queries: [
            {
              datasource: {
                type: 'victoriametrics-metrics-datasource',
                uid: 'ABCDEF',
              },
              datasourceId: 1,
              expr: 'test{job="testjob"}',
              format: 'time_series',
              instant: true,
              interval: undefined,
              intervalMs: undefined,
              legendFormat: undefined,
              maxDataPoints: undefined,
              queryCachingTTL: undefined,
              queryType: 'timeSeriesQuery',
              refId: '',
              requestId: 'undefined',
              utcOffsetSec: -0,
            },
          ],
          to: '183000',
        });
      });
    });

    describe('with POST http method', () => {
      const promDs = new PrometheusDatasource(
        { ...instanceSettings, jsonData: {} },
        templateSrvStub,
        timeSrvStub
      );

      it('adds params to timeseries query', () => {
        promDs.query(makeQuery(target));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].data).toEqual({
          queries: [
            {
              datasource: {
                type: 'victoriametrics-metrics-datasource',
                uid: 'ABCDEF',
              },
              datasourceId: 1,
              expr: 'test{job="testjob"}',
              format: 'time_series',
              interval: undefined,
              intervalMs: undefined,
              legendFormat: undefined,
              maxDataPoints: undefined,
              queryCachingTTL: undefined,
              queryType: 'timeSeriesQuery',
              refId: '',
              requestId: 'undefined',
              utcOffsetSec: -0,
            },
          ],
          to: '183000',
          from: '63000',
        });
      });

      it('adds params to instant query', () => {
        promDs.query(makeQuery({ ...target, instant: true }));
        expect(fetchMock.mock.calls.length).toBe(1);
      });
    });
  });

  describe('extractRuleMappingFromGroups()', () => {
    it('returns empty mapping for no rule groups', () => {
      expect(extractRuleMappingFromGroups([])).toEqual({});
    });

    it('returns a mapping for recording rules only', () => {
      const groups = [
        {
          rules: [
            {
              name: 'HighRequestLatency',
              query: 'job:request_latency_seconds:mean5m{job="myjob"} > 0.5',
              type: 'alerting',
            },
            {
              name: 'job:http_inprogress_requests:sum',
              query: 'sum(http_inprogress_requests) by (job)',
              type: 'recording',
            },
          ],
          file: '/rules.yaml',
          interval: 60,
          name: 'example',
        },
      ];
      const mapping = extractRuleMappingFromGroups(groups);
      expect(mapping).toEqual({ 'job:http_inprogress_requests:sum': 'sum(http_inprogress_requests) by (job)' });
    });
  });

  describe('Prometheus regular escaping', () => {
    it('should not escape non-string', () => {
      expect(prometheusRegularEscape(12)).toEqual(12);
    });

    it('should not escape simple string', () => {
      expect(prometheusRegularEscape('cryptodepression')).toEqual('cryptodepression');
    });

    it("should escape '", () => {
      expect(prometheusRegularEscape("looking'glass")).toEqual("looking\\\\'glass");
    });

    it('should escape \\', () => {
      expect(prometheusRegularEscape('looking\\glass')).toEqual('looking\\\\glass');
    });

    it('should escape multiple characters', () => {
      expect(prometheusRegularEscape("'looking'glass'")).toEqual("\\\\'looking\\\\'glass\\\\'");
    });

    it('should escape multiple different characters', () => {
      expect(prometheusRegularEscape("'loo\\king'glass'")).toEqual("\\\\'loo\\\\king\\\\'glass\\\\'");
    });
  });

  describe('Prometheus regexes escaping', () => {
    it('should not escape simple string', () => {
      expect(prometheusSpecialRegexEscape('cryptodepression')).toEqual('cryptodepression');
    });

    it('should escape $^*+?.()|\\', () => {
      expect(prometheusSpecialRegexEscape("looking'glass")).toEqual("looking\\\\'glass");
      expect(prometheusSpecialRegexEscape('looking{glass')).toEqual('looking\\\\{glass');
      expect(prometheusSpecialRegexEscape('looking}glass')).toEqual('looking\\\\}glass');
      expect(prometheusSpecialRegexEscape('looking[glass')).toEqual('looking\\\\[glass');
      expect(prometheusSpecialRegexEscape('looking]glass')).toEqual('looking\\\\]glass');
      expect(prometheusSpecialRegexEscape('looking$glass')).toEqual('looking\\\\$glass');
      expect(prometheusSpecialRegexEscape('looking^glass')).toEqual('looking\\\\^glass');
      expect(prometheusSpecialRegexEscape('looking*glass')).toEqual('looking\\\\*glass');
      expect(prometheusSpecialRegexEscape('looking+glass')).toEqual('looking\\\\+glass');
      expect(prometheusSpecialRegexEscape('looking?glass')).toEqual('looking\\\\?glass');
      expect(prometheusSpecialRegexEscape('looking.glass')).toEqual('looking\\\\.glass');
      expect(prometheusSpecialRegexEscape('looking(glass')).toEqual('looking\\\\(glass');
      expect(prometheusSpecialRegexEscape('looking)glass')).toEqual('looking\\\\)glass');
      expect(prometheusSpecialRegexEscape('looking\\glass')).toEqual('looking\\\\\\\\glass');
      expect(prometheusSpecialRegexEscape('looking|glass')).toEqual('looking\\\\|glass');
    });

    it('should escape multiple special characters', () => {
      expect(prometheusSpecialRegexEscape('+looking$glass?')).toEqual('\\\\+looking\\\\$glass\\\\?');
    });
  });

  describe('When interpolating variables', () => {
    let customVariable: any;
    beforeEach(() => {
      customVariable = {
        id: '',
        global: false,
        multi: false,
        includeAll: false,
        allValue: null,
        query: '',
        options: [],
        current: {},
        name: '',
        type: 'custom',
        label: null,
        skipUrlSync: false,
        index: -1,
        initLock: null,
      };
    });

    describe('and value is a string', () => {
      it('should only escape single quotes', () => {
        expect(ds.interpolateQueryExpr("abc'$^*{}[]+?.()|", customVariable)).toEqual("abc\\\\'$^*{}[]+?.()|");
      });
    });

    describe('and value is a number', () => {
      it('should return a number', () => {
        expect(ds.interpolateQueryExpr(1000 as any, customVariable)).toEqual(1000);
      });
    });

    describe('and variable allows multi-value', () => {
      beforeEach(() => {
        customVariable.multi = true;
      });

      it('should regex escape values if the value is a string', () => {
        expect(ds.interpolateQueryExpr('looking*glass', customVariable)).toEqual('looking\\\\*glass');
      });

      it('should return pipe separated values if the value is an array of strings', () => {
        expect(ds.interpolateQueryExpr(['a|bc', 'de|f'], customVariable)).toEqual('(a\\\\|bc|de\\\\|f)');
      });

      it('should return 1 regex escaped value if there is just 1 value in an array of strings', () => {
        expect(ds.interpolateQueryExpr(['looking*glass'], customVariable)).toEqual('looking\\\\*glass');
      });
    });

    describe('and variable allows all', () => {
      beforeEach(() => {
        customVariable.includeAll = true;
      });

      it('should regex escape values if the array is a string', () => {
        expect(ds.interpolateQueryExpr('looking*glass', customVariable)).toEqual('looking\\\\*glass');
      });

      it('should return pipe separated values if the value is an array of strings', () => {
        expect(ds.interpolateQueryExpr(['a|bc', 'de|f'], customVariable)).toEqual('(a\\\\|bc|de\\\\|f)');
      });

      it('should return 1 regex escaped value if there is just 1 value in an array of strings', () => {
        expect(ds.interpolateQueryExpr(['looking*glass'], customVariable)).toEqual('looking\\\\*glass');
      });
    });
  });

  describe('interpolateVariablesInQueries', () => {
    it('should call replace function 2 times', () => {
      const query: PromQuery = {
        expr: 'test{job="testjob"}',
        format: 'time_series',
        interval: '$Interval',
        refId: 'A',
      };
      const interval = '10m';
      replaceMock.mockReturnValue(interval);

      const queries = ds.interpolateVariablesInQueries([query], { Interval: { text: interval, value: interval } });
      expect(templateSrvStub.replace).toHaveBeenCalledTimes(2);
      expect(queries[0].interval).toBe(interval);
    });
  });

  describe('applyTemplateVariables', () => {
    afterAll(() => {
      getAdhocFiltersMock.mockImplementation(() => []);
      replaceMock.mockImplementation((a: string) => a);
    });

    it('should call replace function for legendFormat', () => {
      const query = {
        expr: 'test{job="bar"}',
        legendFormat: '$legend',
        refId: 'A',
      };
      const legend = 'baz';
      replaceMock.mockReturnValue(legend);

      const interpolatedQuery = ds.applyTemplateVariables(query, { legend: { text: legend, value: legend } });
      expect(interpolatedQuery.legendFormat).toBe(legend);
    });

    it('should call replace function for interval', () => {
      const query = {
        expr: 'test{job="bar"}',
        interval: '$step',
        refId: 'A',
      };
      const step = '5s';
      replaceMock.mockReturnValue(step);

      const interpolatedQuery = ds.applyTemplateVariables(query, { step: { text: step, value: step } });
      expect(interpolatedQuery.interval).toBe(step);
    });

    it('should call replace function for expr', () => {
      const query = {
        expr: 'test{job="$job"}',
        refId: 'A',
      };
      const job = 'bar';
      replaceMock.mockReturnValue(job);

      const interpolatedQuery = ds.applyTemplateVariables(query, { job: { text: job, value: job } });
      expect(interpolatedQuery.expr).toBe(job);
    });

    it('should add ad-hoc filters to expr', () => {
      replaceMock.mockImplementation((a: string) => a);
      getAdhocFiltersMock.mockReturnValue([
        {
          key: 'k1',
          operator: '=',
          value: 'v1',
        },
        {
          key: 'k2',
          operator: '!=',
          value: 'v2',
        },
      ]);

      const query = {
        expr: 'test{job="bar"}',
        refId: 'A',
      };

      const result = ds.applyTemplateVariables(query, {});
      expect(result).toMatchObject({ expr: 'test{job="bar", k1="v1", k2!="v2"}' });
    });

    it('AdhocFilters should not add filters', () => {
      getAdhocFiltersMock.mockReturnValue([
        {
          key: 'k1',
          operator: '=',
          value: 'v1',
        }
      ]);
      replaceMock.mockImplementation((str, params) => {
        const topk = params['topk'] as ScopedVar;
        return str?.replace('$topk', topk.value);
      });
      const query: PromQuery = {
        expr: 'topk_max($topk, vmalert_iteration_duration_seconds_sum)',
        refId: 'A'
      };
      const result = ds.applyTemplateVariables(query, { 'topk': { text: 'topk', value: '5' } } as ScopedVars);
      expect(result).toMatchObject({ expr: 'topk_max(5, vmalert_iteration_duration_seconds_sum{k1="v1"})' });
    });
  });

  describe('metricFindQuery', () => {
    beforeEach(() => {
      const query = 'query_result(topk(5,rate(http_request_duration_microseconds_count[$__interval])))';
      ds.metricFindQuery(query, { range: timeSrvStub.timeRange() });
    });

    it('should call templateSrv.replace with scopedVars', () => {
      expect(replaceMock.mock.calls[0][1]).toBeDefined();
    });

    it('should have the correct range and range_ms', () => {
      const range = replaceMock.mock.calls[0][1].__range;
      const rangeMs = replaceMock.mock.calls[0][1].__range_ms;
      const rangeS = replaceMock.mock.calls[0][1].__range_s;
      expect(range).toEqual({ text: '21s', value: '21s' });
      expect(rangeMs).toEqual({ text: 21031, value: 21031 });
      expect(rangeS).toEqual({ text: 21, value: 21 });
    });

    it('should pass the default interval value', () => {
      const interval = replaceMock.mock.calls[0][1].__interval;
      const intervalMs = replaceMock.mock.calls[0][1].__interval_ms;
      expect(interval).toEqual({ text: '15s', value: '15s' });
      expect(intervalMs).toEqual({ text: 15000, value: 15000 });
    });
  });
});

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const time = ({ hours = 0, seconds = 0, minutes = 0 }) => dateTime(hours * HOUR + minutes * MINUTE + seconds * SECOND);

describe('PrometheusDatasource for POST', () => {
  const instanceSettings = {
    url: 'proxied',
    directUrl: 'direct',
    user: 'test',
    password: 'mupp',
    jsonData: { httpMethod: 'POST' },
  } as unknown as DataSourceInstanceSettings<PromOptions>;

  let ds: PrometheusDatasource;
  beforeEach(() => {
    ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);
  });

  describe('When querying prometheus with one target using query editor target spec - time_series format', () => {
    let results: DataQueryResponse;
    const urlExpected = '/api/ds/query?ds_type=victoriametrics-metrics-datasource';
    const dataExpected = {
      from: '63000',
      to: '123000',
      queries: [
        {
          datasource: {
            type: 'victoriametrics-metrics-datasource',
            uid: undefined,
          },
          datasourceId: undefined,
          expr: 'test{job="testjob"}',
          format: 'time_series',
          interval: undefined,
          intervalMs: undefined,
          legendFormat: undefined,
          maxDataPoints: undefined,
          queryCachingTTL: undefined,
          queryType: 'timeSeriesQuery',
          requestId: 'undefinedA',
          utcOffsetSec: -0,
          refId: 'A'
        },
      ],
    };
    const query = {
      range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
      targets: [{ expr: 'test{job="testjob"}', format: 'time_series', refId: 'A' }],
      interval: '60s',
    } as DataQueryRequest<PromQuery>;

    beforeEach(async () => {
      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                },
              ],
            },
          },
        },
      };
      fetchMock.mockImplementation(() => of(response));
      ds.query(query).subscribe((data) => {
        results = data;
      });
    });

    it('should generate the correct query', () => {
      const res = fetchMock.mock.calls[0][0];
      expect(res.method).toBe('POST');
      expect(res.url).toBe(urlExpected);
      expect(res.data).toEqual(dataExpected);
    });

    it('should return series list', () => {
      expect(results.data.length).toBe(1);

      const graphFrame = toDataFrame(results.data[0]);
      expect(graphFrame.meta?.preferredVisualisationType).toBe('graph');
      expect(getFieldDisplayName(graphFrame.fields[1], graphFrame)).toEqual("{__name__=\"test\", job=\"testjob\"}");
    });

  });
  describe('When querying prometheus with one target using query editor target spec - time_series format and instant/range option', () => {
    let results: DataQueryResponse;
    it('with instant: true and range: true should return 2 visualizations - graph and table', async () => {
      const query = {
        range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
        targets: [{ expr: 'test{job="testjob"}', format: 'time_series', refId: 'A', instant: true, range: true }],
        interval: '60s',
      } as DataQueryRequest<PromQuery>;

      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                },
              ],
            },
            A_instant: {
              series: [
                {
                  refId: 'A_instant',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                  meta: {
                    custom: {
                      resultType: 'vector',
                    }
                  }
                },
              ],
            },
          },
        },
      };
      fetchMock.mockImplementation(() => of(response));
      await new Promise((resolve) => {
        ds.query(query).subscribe((data) => {
          results = data;
          resolve('');
        });
      });


      expect(results.data.length).toBe(2);
      expect(results.data[0].meta.preferredVisualisationType).toStrictEqual('graph');
      expect(results.data[1].meta.preferredVisualisationType).toStrictEqual('graph');
    });

    it('with instant: true and range:false should return 1 visualizations - table', async () => {
      const query = {
        range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
        targets: [{ expr: 'test{job="testjob"}', format: 'time_series', refId: 'A', instant: true, range: false }],
        interval: '60s',
        app: CoreApp.Explore
      } as DataQueryRequest<PromQuery>;

      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                  meta: {
                    custom: {
                      resultType: 'vector',
                    }
                  }
                },
              ],
            },
          },
        },
      };
      fetchMock.mockImplementation(() => of(response));
      await new Promise((resolve) => {
        ds.query(query).subscribe((data) => {
          results = data;
          resolve('');
        });
      });

      expect(results.data.length).toBe(1);
      expect(results.data[0].meta.preferredVisualisationType).toStrictEqual('table');
    });

    it('with instant: false and range:true should return 1 visualizations - graph', async () => {
      const query = {
        range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
        targets: [{ expr: 'test{job="testjob"}', format: 'time_series', refId: 'A', instant: false, range: true }],
        interval: '60s',
      } as DataQueryRequest<PromQuery>;

      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                },
              ],
            },
          },
        },
      };
      fetchMock.mockImplementation(() => of(response));
      await new Promise((resolve) => {
        ds.query(query).subscribe((data) => {
          results = data;
          resolve('');
        });
      });

      expect(results.data.length).toBe(1);
      expect(results.data[0].meta.preferredVisualisationType).toStrictEqual('graph');
    });


    it('with instant: false and range:true without format should return 1 visualizations - graph', async () => {
      const query = {
        range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
        targets: [{ expr: 'test{job="testjob"}', format: undefined, refId: 'A', instant: false, range: true }],
        interval: '60s',
      } as DataQueryRequest<PromQuery>;

      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                },
              ],
            },
          },
        },
      };
      fetchMock.mockImplementation(() => of(response));
      await new Promise((resolve) => {
        ds.query(query).subscribe((data) => {
          results = data;
          resolve('');
        });
      });

      expect(results.data.length).toBe(1);
      expect(results.data[0].meta.preferredVisualisationType).toStrictEqual('graph');
    });

    it('with instant: true and range:true with traces', async () => {
      const query = {
        range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
        targets: [{
          expr: 'test{job="testjob"}',
          format: 'time_series',
          refId: 'A',
          instant: true,
          range: true,
          trace: 1
        }],
        interval: '60s',
      } as DataQueryRequest<PromQuery>;

      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [],
                  meta: {
                    custom: {
                      resultType: 'trace',
                    }
                  }
                },
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                  meta: {
                    custom: {
                      resultType: 'matrix',
                    }
                  }
                },
                {
                  refId: 'A_instant',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [],
                  meta: {
                    custom: {
                      resultType: 'trace',
                    }
                  }
                },
                {
                  refId: 'A_instant',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [2 * 60],
                  meta: {
                    custom: {
                      resultType: 'vector',
                    }
                  }
                },
              ],
            },
          },
        },
      };

      fetchMock.mockImplementation(() => of(response));
      await new Promise((resolve) => {
        ds.query(query).subscribe((data) => {
          results = data;
          resolve('');
        });
      });

      expect(results.data.length).toBe(4);
      expect(results.data[0].meta.preferredVisualisationType).toStrictEqual('graph');
      expect(results.data[0].refId).toStrictEqual('A');
      expect(results.data[1].meta.preferredVisualisationType).toStrictEqual('graph');
      expect(results.data[1].refId).toStrictEqual('A_instant');
      expect(results.data[2].meta.custom.resultType).toStrictEqual('trace');
      expect(results.data[2].refId).toStrictEqual('A');
      expect(results.data[3].meta.custom.resultType).toStrictEqual('trace');
      expect(results.data[3].refId).toStrictEqual('A');
    });


  });

  describe('When querying prometheus with one target using query editor target spec - table format', () => {
    let results: DataQueryResponse;
    const urlExpected = '/api/ds/query?ds_type=victoriametrics-metrics-datasource';
    const dataExpected = {
      from: '63000',
      to: '123000',
      queries: [
        {
          datasource: {
            type: 'victoriametrics-metrics-datasource',
            uid: undefined,
          },
          datasourceId: undefined,
          expr: 'test{job="testjob"}',
          format: 'table',
          interval: undefined,
          intervalMs: undefined,
          legendFormat: undefined,
          maxDataPoints: undefined,
          queryCachingTTL: undefined,
          queryType: 'timeSeriesQuery',
          requestId: 'undefinedA',
          utcOffsetSec: -0,
          refId: 'A'
        },
      ],
    };
    const query = {
      range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
      targets: [{ expr: 'test{job="testjob"}', format: 'table', refId: 'A' }],
      interval: '60s',
    } as DataQueryRequest<PromQuery>;

    beforeEach(async () => {
      const response = {
        status: 200,
        data: {
          resultType: 'matrix',
          results: {
            A: {
              series: [
                {
                  refId: 'A',
                  tags: { __name__: 'test', job: 'testjob' },
                  points: [[2 * 60, '3846']],
                },
              ],
            },
          },
        },
      };
      fetchMock.mockImplementation(() => of(response));
      ds.query(query).subscribe((data) => {
        results = data;
      });
    });

    it('should generate the correct query', () => {
      const res = fetchMock.mock.calls[0][0];
      expect(res.method).toBe('POST');
      expect(res.url).toBe(urlExpected);
      expect(res.data).toEqual(dataExpected);
    });

    it('should return series list', () => {
      const frame = toDataFrame(results.data[0]);
      expect(results.data.length).toBe(1);
      ['Time', '__name__', 'job', 'Value'].forEach((name, index) => {
        expect(frame.fields[index].name).toBe(name);
      });
    });
  });
});

describe('modifyQuery', () => {
  describe('when called with ADD_FILTER', () => {
    describe('and query has no labels', () => {
      it('then the correct label should be added', () => {
        const query: PromQuery = { refId: 'A', expr: 'go_goroutines' };
        const action = { options: { key: 'cluster', value: 'us-cluster' }, type: 'ADD_FILTER' };
        const instanceSettings = { jsonData: {} } as unknown as DataSourceInstanceSettings<PromOptions>;
        const ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);

        const result = ds.modifyQuery(query, action);

        expect(result.refId).toEqual('A');
        expect(result.expr).toEqual('go_goroutines{cluster="us-cluster"}');
      });
    });

    describe('and query has labels', () => {
      it('then the correct label should be added', () => {
        const query: PromQuery = { refId: 'A', expr: 'go_goroutines{cluster="us-cluster"}' };
        const action = { options: { key: 'pod', value: 'pod-123' }, type: 'ADD_FILTER' };
        const instanceSettings = { jsonData: {} } as unknown as DataSourceInstanceSettings<PromOptions>;
        const ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);

        const result = ds.modifyQuery(query, action);

        expect(result.refId).toEqual('A');
        expect(result.expr).toEqual('go_goroutines{cluster="us-cluster", pod="pod-123"}');
      });
    });
  });

  describe('when called with ADD_FILTER_OUT', () => {
    describe('and query has no labels', () => {
      it('then the correct label should be added', () => {
        const query: PromQuery = { refId: 'A', expr: 'go_goroutines' };
        const action = { options: { key: 'cluster', value: 'us-cluster' }, type: 'ADD_FILTER_OUT' };
        const instanceSettings = { jsonData: {} } as unknown as DataSourceInstanceSettings<PromOptions>;
        const ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);

        const result = ds.modifyQuery(query, action);

        expect(result.refId).toEqual('A');
        expect(result.expr).toEqual('go_goroutines{cluster!="us-cluster"}');
      });
    });

    describe('and query has labels', () => {
      it('then the correct label should be added', () => {
        const query: PromQuery = { refId: 'A', expr: 'go_goroutines{cluster="us-cluster"}' };
        const action = { options: { key: 'pod', value: 'pod-123' }, type: 'ADD_FILTER_OUT' };
        const instanceSettings = { jsonData: {} } as unknown as DataSourceInstanceSettings<PromOptions>;
        const ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);

        const result = ds.modifyQuery(query, action);

        expect(result.refId).toEqual('A');
        expect(result.expr).toEqual('go_goroutines{cluster="us-cluster", pod!="pod-123"}');
      });
    });
  });
});

function createDefaultPromResponse() {
  return {
    data: {
      data: {
        result: [
          {
            metric: {
              __name__: 'test_metric',
            },
            values: [[1568369640, 1]],
          },
        ],
        resultType: 'matrix',
      },
    },
  };
}

describe('processTargetV2', () => {
  let datasource: PrometheusDatasource;

  beforeEach(() => {
    datasource = new PrometheusDatasource(
      {
        id: 1,
        url: 'http://example.com',
        access: 'proxy',
        jsonData: {
          timeInterval: '15s',
        },
      } as any,
      undefined,
      {
        timeRange: jest.fn().mockReturnValue({
          to: {
            utcOffset: () => 0,
          },
        }),
      } as any
    );
  });

  it('should merge template with query and adjust target properties', () => {
    const target = { expr: 'sr', refId: 'A', range: false, instant: false, } as any;
    const request = {
      dashboardUID: 'dashboard_1',
      targets: [],
      panelId: 2,
      app: 'app_1',
    } as unknown as DataQueryRequest<PromQuery>;

    datasource.withTemplates = [{ uid: 'dashboard_1', expr: 'sr = sum(rate(request_total[5m]))' } as any];

    const result = datasource.processTargetV2(target, request);

    expect(result).toEqual({
      "expr": "WITH(\n  sr = sum(rate(request_total[5m]))\n)\nsr",
      "instant": false,
      "queryType": "timeSeriesQuery",
      "range": false,
      "refId": "A",
      "requestId": "2A",
      "utcOffsetSec": 0
    });
  });

  it('should generate two queries for Both range and instant query type', () => {
    const target = { expr: 'metric_name', refId: 'A', range: true, instant: true } as any;
    const request = {
      dashboardUID: 'dashboard_1',
      targets: [],
      panelId: 2,
      app: 'app_1',
    } as unknown as DataQueryRequest<PromQuery>;

    const result = datasource.processTargetV2(target, request);

    expect(result).toHaveLength(2);
    if (Array.isArray(result)) {
      expect(result[0]).toEqual({
        expr: 'metric_name',
        queryType: 'timeSeriesQuery',
        requestId: '2A',
        utcOffsetSec: 0,
        refId: 'A',
        range: true,
        instant: false,
      });
      expect(result[1]).toEqual({
        expr: 'metric_name',
        queryType: 'timeSeriesQuery',
        requestId: '2A',
        utcOffsetSec: 0,
        refId: 'A_instant',
        range: false,
        instant: true,
        format: undefined,
      });
    }
  });

  it('should handle case where no matching template is found', () => {
    const target = { expr: 'metric_name', refId: 'A', range: false, instant: false } as any;
    const request = {
      dashboardUID: 'unknown_dashboard',
      targets: [],
      panelId: 2,
      app: 'unknown_app',
    } as unknown as DataQueryRequest<PromQuery>;

    const result = datasource.processTargetV2(target, request);

    expect(result).toEqual({
      expr: 'metric_name',
      queryType: 'timeSeriesQuery',
      requestId: '2A',
      utcOffsetSec: 0,
      refId: 'A',
      range: false,
      instant: false,
    });
  });

  it('should handle a target with no range or instant properties and not apply WITH template', () => {
    const target = { expr: 'metric_name', refId: 'A' } as any;
    const request = {
      dashboardUID: 'dashboard_1',
      targets: [],
      panelId: 2,
      app: 'app_1',
    } as unknown as DataQueryRequest<PromQuery>;

    datasource.withTemplates = [{ uid: 'dashboard_1', config: ['cf = {label="dashboard"}'] } as any];

    const result = datasource.processTargetV2(target, request);

    expect(result).toEqual({
      expr: 'metric_name',
      queryType: 'timeSeriesQuery',
      requestId: '2A',
      utcOffsetSec: 0,
      refId: 'A',
    });
  });
});
