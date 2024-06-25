
import { cloneDeep } from 'lodash';
import { of } from 'rxjs';
import { ScopedVar, ScopedVars } from '@grafana/data';

import {
  CoreApp,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  dateTime,
  getFieldDisplayName,
  toDataFrame,
} from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';

import {
  alignRange,
  extractRuleMappingFromGroups,
  PrometheusDatasource,
  prometheusRegularEscape,
  prometheusSpecialRegexEscape,
} from './datasource';
import PromQlLanguageProvider from './language_provider';
import { TimeSrv } from './services/TimeSrv';
import { PromOptions, PromQuery, PromQueryRequest } from './types';

const fetchMock = jest.fn().mockReturnValue(of(createDefaultPromResponse()));

jest.mock('./metric_find_query');
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    fetch: fetchMock,
  }),
}));

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
    jsonData: {
      customQueryParameters: '',
    },
  } as unknown as DataSourceInstanceSettings<PromOptions>;

  beforeEach(() => {
    ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);
  });

  describe('Datasource metadata requests', () => {
    it('should perform a GET request with the default config', () => {
      ds.metadataRequest('/foo', { bar: 'baz baz', foo: 'foo' });
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('GET');
      expect(fetchMock.mock.calls[0][0].url).toContain('bar=baz%20baz&foo=foo');
    });
    it('should still perform a GET request with the DS HTTP method set to POST and not POST-friendly endpoint', () => {
      const postSettings = cloneDeep(instanceSettings);
      postSettings.jsonData.httpMethod = 'POST';
      const promDs = new PrometheusDatasource(postSettings, templateSrvStub, timeSrvStub);
      promDs.metadataRequest('/foo');
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('GET');
    });
    it('should try to perform a POST request with the DS HTTP method set to POST and POST-friendly endpoint', () => {
      const postSettings = cloneDeep(instanceSettings);
      postSettings.jsonData.httpMethod = 'POST';
      const promDs = new PrometheusDatasource(postSettings, templateSrvStub, timeSrvStub);
      promDs.metadataRequest('api/v1/series', { bar: 'baz baz', foo: 'foo' });
      expect(fetchMock.mock.calls.length).toBe(1);
      expect(fetchMock.mock.calls[0][0].method).toBe('POST');
      expect(fetchMock.mock.calls[0][0].url).not.toContain('bar=baz%20baz&foo=foo');
      expect(fetchMock.mock.calls[0][0].data).toEqual({ bar: 'baz baz', foo: 'foo' });
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
        { ...instanceSettings, jsonData: { customQueryParameters: 'customQuery=123', httpMethod: 'GET' } },
        templateSrvStub,
        timeSrvStub
      );

      it('adds params to timeseries query', () => {
        promDs.query(makeQuery(target));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].url).toBe(
          'proxied/api/v1/query_range?query=test%7Bjob%3D%22testjob%22%7D&start=60&end=180&step=60&customQuery=123'
        );
      });

      it('adds params to instant query', () => {
        promDs.query(makeQuery({ ...target, instant: true }));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].url).toContain('&customQuery=123');
      });
    });

    describe('with POST http method', () => {
      const promDs = new PrometheusDatasource(
        { ...instanceSettings, jsonData: { customQueryParameters: 'customQuery=123', httpMethod: 'POST' } },
        templateSrvStub,
        timeSrvStub
      );

      it('adds params to timeseries query', () => {
        promDs.query(makeQuery(target));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].url).toBe('proxied/api/v1/query_range');
        expect(fetchMock.mock.calls[0][0].data).toEqual({
          customQuery: '123',
          query: 'test{job="testjob"}',
          step: 60,
          end: 180,
          start: 60,
        });
      });

      it('adds params to instant query', () => {
        promDs.query(makeQuery({ ...target, instant: true }));
        expect(fetchMock.mock.calls.length).toBe(1);
        expect(fetchMock.mock.calls[0][0].data.customQuery).toBe('123');
      });
    });
  });

  describe('When using adhoc filters', () => {
    const DEFAULT_QUERY_EXPRESSION = 'metric{job="foo"} - metric';
    const target: PromQuery = { expr: DEFAULT_QUERY_EXPRESSION, refId: 'A' };

    afterAll(() => {
      getAdhocFiltersMock.mockImplementation(() => []);
    });

    it('should not modify expression with no filters', () => {
      const result = ds.createQuery(target, { interval: '15s' } as DataQueryRequest<PromQuery>, 0, 0);
      expect(result).toMatchObject({ expr: DEFAULT_QUERY_EXPRESSION });
    });

    it('should add filters to expression', () => {
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
      const result = ds.createQuery(target, { interval: '15s' } as DataQueryRequest<PromQuery>, 0, 0);
      expect(result).toMatchObject({ expr: 'metric{job="foo", k1="v1", k2!="v2"} - metric{k1="v1", k2!="v2"}' });
    });

    it('should add escaping if needed to regex filter expressions', () => {
      getAdhocFiltersMock.mockReturnValue([
        {
          key: 'k1',
          operator: '=~',
          value: 'v.*',
        },
        {
          key: 'k2',
          operator: '=~',
          value: `v'.*`,
        },
      ]);
      const result = ds.createQuery(target, { interval: '15s' } as DataQueryRequest<PromQuery>, 0, 0);
      expect(result).toMatchObject({
        expr: `metric{job="foo", k1=~"v.*", k2=~"v\\\\'.*"} - metric{k1=~"v.*", k2=~"v\\\\'.*"}`,
      });
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
        return str.replace('$topk', topk.value);
      });
      const caseTarget: PromQuery = { expr: 'topk_max($topk, vmalert_iteration_duration_seconds_sum)', refId: 'A' };
      const result = ds.createQuery(caseTarget, { interval: '15s', scopedVars: { 'topk': { text: 'topk', value: '5' } } as ScopedVars} as DataQueryRequest<PromQuery>, 0, 0);
      expect(result).toMatchObject({ expr: 'topk_max(5, vmalert_iteration_duration_seconds_sum{k1="v1"})'});
    });
  });

  describe('alignRange', () => {
    it('does not modify already aligned intervals with perfect step', () => {
      const range = alignRange(0, 3, 3, 0);
      expect(range.start).toEqual(0);
      expect(range.end).toEqual(3);
    });

    it('does modify end-aligned intervals to reflect number of steps possible', () => {
      const range = alignRange(1, 6, 3, 0);
      expect(range.start).toEqual(0);
      expect(range.end).toEqual(6);
    });

    it('does align intervals that are a multiple of steps', () => {
      const range = alignRange(1, 4, 3, 0);
      expect(range.start).toEqual(0);
      expect(range.end).toEqual(3);
    });

    it('does align intervals that are not a multiple of steps', () => {
      const range = alignRange(1, 5, 3, 0);
      expect(range.start).toEqual(0);
      expect(range.end).toEqual(3);
    });

    it('does align intervals with local midnight -UTC offset', () => {
      //week range, location 4+ hours UTC offset, 24h step time
      const range = alignRange(4 * 60 * 60, (7 * 24 + 4) * 60 * 60, 24 * 60 * 60, -4 * 60 * 60); //04:00 UTC, 7 day range
      expect(range.start).toEqual(4 * 60 * 60);
      expect(range.end).toEqual((7 * 24 + 4) * 60 * 60);
    });

    it('does align intervals with local midnight +UTC offset', () => {
      //week range, location 4- hours UTC offset, 24h step time
      const range = alignRange(20 * 60 * 60, (8 * 24 - 4) * 60 * 60, 24 * 60 * 60, 4 * 60 * 60); //20:00 UTC on day1, 7 days later is 20:00 on day8
      expect(range.start).toEqual(20 * 60 * 60);
      expect(range.end).toEqual((8 * 24 - 4) * 60 * 60);
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
      expect(templateSrvStub.replace).toBeCalledTimes(2);
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
      expect(result).toMatchObject({ expr: 'topk_max(5, vmalert_iteration_duration_seconds_sum{k1="v1"})'});
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

  describe('When querying prometheus with one target using query editor target spec', () => {
    let results: DataQueryResponse;
    const urlExpected = 'proxied/api/v1/query_range';
    const dataExpected = {
      query: 'test{job="testjob"}',
      start: 60,
      end: 2 * 60,
      step: 60,
    };
    const query = {
      range: { from: time({ minutes: 1, seconds: 3 }), to: time({ minutes: 2, seconds: 3 }) },
      targets: [{ expr: 'test{job="testjob"}', format: 'time_series' }],
      interval: '60s',
    } as DataQueryRequest<PromQuery>;

    beforeEach(async () => {
      const response = {
        status: 'success',
        data: {
          data: {
            resultType: 'matrix',
            result: [
              {
                metric: { __name__: 'test', job: 'testjob' },
                values: [[2 * 60, '3846']],
              },
            ],
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
      expect(getFieldDisplayName(frame.fields[1], frame)).toBe('test{job="testjob"}');
    });
  });
});

function getPrepareTargetsContext({
  targets,
  app,
  queryOptions,
  languageProvider,
}: {
  targets: PromQuery[];
  app?: CoreApp;
  queryOptions?: PromQueryRequest
  languageProvider?: PromQlLanguageProvider;
}) {
  const instanceSettings = {
    url: 'proxied',
    directUrl: 'direct',
    access: 'proxy',
    user: 'test',
    password: 'mupp',
    jsonData: { httpMethod: 'POST' },
  } as unknown as DataSourceInstanceSettings<PromOptions>;
  const start = 0;
  const end = 1;
  const panelId = '2';
  const options = {
    targets,
    interval: '1s',
    panelId,
    app,
    ...queryOptions,
  } as unknown as DataQueryRequest<PromQuery>;

  const ds = new PrometheusDatasource(instanceSettings, templateSrvStub, timeSrvStub);
  if (languageProvider) {
    ds.languageProvider = languageProvider;
  }
  const { queries, activeTargets } = ds.prepareTargets(options, start, end);

  return {
    queries,
    activeTargets,
    start,
    end,
    panelId,
  };
}

describe('prepareTargets', () => {
  describe('when run from a Panel', () => {
    it('then it should just add targets', () => {
      const target: PromQuery = {
        refId: 'A',
        expr: 'up',
        requestId: '2A',
      };

      const { queries, activeTargets, panelId, end, start } = getPrepareTargetsContext({ targets: [target] });

      expect(queries.length).toBe(1);
      expect(activeTargets.length).toBe(1);
      expect(queries[0]).toEqual({
        end,
        expr: 'up',
        headers: {
          'X-Dashboard-Id': undefined,
          'X-Dashboard-UID': '',
          'X-Panel-Id': panelId,
        },
        hinting: undefined,
        instant: undefined,
        refId: target.refId,
        requestId: panelId + target.refId,
        start,
        step: 1,
      });
      expect(activeTargets[0]).toEqual(target);
    });

    it('should give back 1 target when exemplar and instant are enabled', () => {
      const target: PromQuery = {
        refId: 'A',
        expr: 'up',
        exemplar: true,
        instant: true,
      };

      const { queries, activeTargets } = getPrepareTargetsContext({ targets: [target] });
      expect(queries).toHaveLength(1);
      expect(activeTargets).toHaveLength(1);
      expect(activeTargets[0].instant).toBe(true);
    });
  });

  describe('when run from Explore', () => {
    describe('when query type Both is selected', () => {
      it('should give back 6 targets when multiple queries with exemplar enabled', () => {
        const targetA: PromQuery = {
          refId: 'A',
          expr: 'histogram_quantile(0.95, sum(rate(tns_request_duration_seconds_bucket[5m])) by (le))',
          instant: true,
          range: true,
          exemplar: true,
        };
        const targetB: PromQuery = {
          refId: 'B',
          expr: 'histogram_quantile(0.5, sum(rate(tns_request_duration_bucket[5m])) by (le))',
          exemplar: true,
          instant: true,
          range: true,
        };

        const { queries, activeTargets } = getPrepareTargetsContext({
          targets: [targetA, targetB],
          app: CoreApp.Explore,
          languageProvider: {
            histogramMetrics: ['tns_request_duration_seconds_bucket'],
          } as PromQlLanguageProvider,
        });
        expect(queries).toHaveLength(4);
        expect(activeTargets).toHaveLength(4);
      });

      it('should give back 5 targets when multiple queries with exemplar enabled and same metric', () => {
        const targetA: PromQuery = {
          refId: 'A',
          expr: 'histogram_quantile(0.95, sum(rate(tns_request_duration_seconds_bucket[5m])) by (le))',
          instant: true,
          range: true,
          exemplar: true,
        };
        const targetB: PromQuery = {
          refId: 'B',
          expr: 'histogram_quantile(0.5, sum(rate(tns_request_duration_seconds_bucket[5m])) by (le))',
          exemplar: true,
          instant: true,
          range: true,
        };

        const { queries, activeTargets } = getPrepareTargetsContext({
          targets: [targetA, targetB],
          app: CoreApp.Explore,
          languageProvider: {
            histogramMetrics: ['tns_request_duration_seconds_bucket'],
          } as PromQlLanguageProvider,
        });
        expect(queries).toHaveLength(4);
        expect(activeTargets).toHaveLength(4);
      });

      it('then it should return both instant and time series related objects', () => {
        const target: PromQuery = {
          refId: 'A',
          expr: 'up',
          range: true,
          instant: true,
          requestId: '2A',
        };

        const { queries, activeTargets, panelId, end, start } = getPrepareTargetsContext({
          targets: [target],
          app: CoreApp.Explore,
        });

        expect(queries.length).toBe(2);
        expect(activeTargets.length).toBe(2);
        expect(queries[0]).toEqual({
          end,
          expr: 'up',
          headers: {
            'X-Dashboard-Id': undefined,
            'X-Dashboard-UID': '',
            'X-Panel-Id': panelId,
          },
          hinting: undefined,
          instant: true,
          refId: target.refId,
          requestId: panelId + target.refId + '_instant',
          start,
          step: 1,
        });
        expect(activeTargets[0]).toEqual({
          ...target,
          format: 'table',
          instant: true,
          requestId: panelId + target.refId + '_instant',
          valueWithRefId: true,
        });
        expect(queries[1]).toEqual({
          end,
          expr: 'up',
          headers: {
            'X-Dashboard-Id': undefined,
            'X-Dashboard-UID': '',
            'X-Panel-Id': panelId,
          },
          hinting: undefined,
          instant: false,
          refId: target.refId,
          requestId: panelId + target.refId,
          start,
          step: 1,
        });
        expect(activeTargets[1]).toEqual({
          ...target,
          format: 'time_series',
          instant: false,
          requestId: panelId + target.refId,
        });
      });
    });

    describe('when query type Instant is selected', () => {
      it('then it should target and modify its format to table', () => {
        const target: PromQuery = {
          refId: 'A',
          expr: 'up',
          instant: true,
          range: false,
          requestId: '2A',
        };

        const { queries, activeTargets, panelId, end, start } = getPrepareTargetsContext({
          targets: [target],
          app: CoreApp.Explore,
        });

        expect(queries.length).toBe(1);
        expect(activeTargets.length).toBe(1);
        expect(queries[0]).toEqual({
          end,
          expr: 'up',
          headers: {
            'X-Dashboard-Id': undefined,
            'X-Dashboard-UID': '',
            'X-Panel-Id': panelId,
          },
          hinting: undefined,
          instant: true,
          refId: target.refId,
          requestId: panelId + target.refId,
          start,
          step: 1,
        });
        expect(activeTargets[0]).toEqual({ ...target, format: 'table' });
      });
    });
  });

  describe('when query type Range is selected', () => {
    it('then it should just add targets', () => {
      const target: PromQuery = {
        refId: 'A',
        expr: 'up',
        range: true,
        instant: false,
        requestId: '2A',
      };

      const { queries, activeTargets, panelId, end, start } = getPrepareTargetsContext({
        targets: [target],
        app: CoreApp.Explore,
      });

      expect(queries.length).toBe(1);
      expect(activeTargets.length).toBe(1);
      expect(queries[0]).toEqual({
        end,
        expr: 'up',
        headers: {
          'X-Dashboard-Id': undefined,
          'X-Dashboard-UID': '',
          'X-Panel-Id': panelId,
        },
        hinting: undefined,
        instant: false,
        refId: target.refId,
        requestId: panelId + target.refId,
        start,
        step: 1,
        trace: undefined
      });
      expect(activeTargets[0]).toEqual(target);
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
