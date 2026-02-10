import { render, screen, act } from '@testing-library/react';
import React from 'react';

import { BackendSrvRequest } from '@grafana/runtime';

import { PrometheusDatasource } from '../datasource';

import PrettifyQuery from './PrettifyQuery';



const testQueries = [
  {
    name: 'empty query',
    got:'',
    want:''
  },
  {
    name: 'query with defined lookbehind window',
    got:'sum(rate(node_cpu_seconds_total{mode="idle"}[5m]))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}[5m]))'
  },
  {
    name: 'query with grafana $__interval variable',
    got:'sum(rate(node_cpu_seconds_total{mode="idle"}[$__interval]))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}[$__interval]))'
  },
  {
    name: 'query with grafana variable and lookbehind window',
    got:'sum(rate(node_cpu_seconds_total{mode="idle"}))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}))'
  },
  {
    name: 'query with grafana $__interval_ms variable',
    got: 'sum(rate(node_cpu_seconds_total{mode="idle"}[$__interval_ms]))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}[$__interval_ms]))'
  },
  {
    name: 'query with grafana $__range variable',
    got: 'sum(rate(node_cpu_seconds_total{mode="idle"}[$__range]))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}[$__range]))'
  },
  {
    name: 'query with grafana $__range variable',
    got: 'sum(rate(node_cpu_seconds_total{mode="idle"}[$__range_s]))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}[$__range_s]))'
  },
  {
    name: 'query with grafana $__rate_interval variable',
    got: 'sum(rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval]))',
    want:'sum(rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval]))'
  },
  {
    name: 'query with two grafana variables',
    got: 'rate(metric_name[$__interval]) + rate(metric_name[$__range]) ',
    want:'rate(metric_name[$__interval]) + rate(metric_name[$__range]) '
  },
  {
    name: 'query with grafana variable and label value as lookbehind window',
    got: 'rate(metric_name{mode="idle"}[$__interval]) + up{instance="[1i]"} ',
    want:'rate(metric_name{mode="idle"}[$__interval]) + up{instance="[1i]"} '
  }
]

const datasource = {
  languageProvider: {
    start: () => Promise.resolve([]),
    syntax: () => {},
    getLabelKeys: () => [],
    metrics: [],
  },
  getInitHints: () => [],
  getRequest: async (path: string, params = { query: '' }, options?: Partial<BackendSrvRequest>) => {
    return {
      data: {
        query: params.query,
        status: 'success'
      }
    }
  }
} as unknown as PrometheusDatasource;

describe('Prettyfied Query', () => {
  testQueries.forEach(async ({ name, got, want }) => {
    it(`should prettify the query ${name}`, async () => {

      const mockCallback = jest.fn(resp => {
        const { expr } = resp;
        expect(expr).toBe(want)
      });

      act(() => {
        render(
          <PrettifyQuery
            datasource={datasource}
            query={{ expr: got, refId: 'A' }}
            onChange={mockCallback}
          />
        ); 
      });

      const btn = await screen.findByRole('button');

      await act(async () => {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });
  });
});
