import { render, screen, act } from '@testing-library/react';
import React from 'react';

import { PrometheusDatasource } from "../datasource";

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
  }
]

describe("Prettyfied Query", () => {
  testQueries.forEach(async ({ name, got, want }) => {
    it(`should prettify the query ${name}`, async () => {
      const datasource = {
        languageProvider: {
          start: () => Promise.resolve([]),
          syntax: () => {},
          getLabelKeys: () => [],
          metrics: [],
        },
        getInitHints: () => [],
        prettifyRequest: async (_: string) => {
          return {
            data: {
              query: got,
              status: 'success'
            }
          }
        }
      } as unknown as PrometheusDatasource;

      const mockCallback = jest.fn(resp => {
        const { expr } = resp;
        expect(expr).toBe(want)
      });

      act(() => {
        render(<PrettifyQuery
          datasource={datasource}
          query={{ expr: got, refId: 'A' }}
          onChange={mockCallback}
        />);
      });

      const btn = await screen.findByRole('button');

      await act(async () => {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });
  });
});
