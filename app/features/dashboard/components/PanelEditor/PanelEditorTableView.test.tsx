import { act, render, screen } from '@testing-library/react';
import { getTimeSrv, TimeSrv, setTimeSrv } from 'app/features/dashboard/services/TimeSrv';
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { ReplaySubject } from 'rxjs';
import { TimeSrvStub } from 'test/specs/helpers';

import {
  dateTime,
  EventBusSrv,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  PanelPlugin,
  PanelProps,
  TimeRange,
} from '@grafana/data';

import { PanelQueryRunner } from '../../../query/state/PanelQueryRunner';
import { DashboardModel, PanelModel } from '../../state';

import { PanelEditorTableView, Props } from './PanelEditorTableView';

jest.mock('../../utils/panel', () => ({
  applyPanelTimeOverrides: jest.fn((panel, timeRange) => ({
    ...timeRange,
  })),
}));

jest.mock('app/features/panel/components/PanelRenderer', () => ({
  PanelRenderer: jest.fn(() => <div>PanelRenderer Mock</div>),
}));

function setupTestContext(options: Partial<Props> = {}) {
  const mockStore = configureMockStore();
  const subject: ReplaySubject<PanelData> = new ReplaySubject<PanelData>();
  const panelQueryRunner = {
    getData: () => subject,
    run: () => {
      subject.next({ state: LoadingState.Done, series: [], timeRange: getDefaultTimeRange() });
    },
  } as unknown as PanelQueryRunner;

  const defaults = {
    panel: new PanelModel({
      id: 123,
      hasTitle: jest.fn(),
      replaceVariables: jest.fn(),
      events: new EventBusSrv(),
      getQueryRunner: () => panelQueryRunner,
      getOptions: jest.fn(),
      getDisplayTitle: jest.fn(),
      runAllPanelQueries: jest.fn(),
    }),
    dashboard: new DashboardModel({
      id: 1,
      uid: 'super-unique-id',
      panelInitialized: jest.fn(),
      events: new EventBusSrv(),
      meta: {
        isPublic: false,
      },
      panels: [],
    }),
    plugin: {
      meta: { skipDataQuery: false },
      panel: TestPanelComponent,
    } as unknown as PanelPlugin,
    isViewing: false,
    isEditing: true,
    isInView: false,
    width: 100,
    height: 100,
    onInstanceStateChange: () => {},
  };

  // Set up the mock store with the defaults
  const store = mockStore({ dashboard: defaults.dashboard });
  const timeSrv = getTimeSrv();

  const props = { ...defaults, ...options };
  const { rerender } = render(
    <Provider store={store}>
      <PanelEditorTableView {...props} />
    </Provider>
  );

  return { rerender, props, subject, store, timeSrv };
}

describe('PanelEditorTableView', () => {
  beforeAll(() => {
    // Mock the timeSrv singleton
    const timeSrvMock2 = new TimeSrvStub() as unknown as TimeSrv;
    setTimeSrv(timeSrvMock2);
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', async () => {
    const { rerender, props, subject, store } = setupTestContext({});

    // only render the panel when loading is done
    act(() => {
      subject.next({ state: LoadingState.Loading, series: [], timeRange: getDefaultTimeRange() });
      subject.next({ state: LoadingState.Done, series: [], timeRange: getDefaultTimeRange() });
    });

    const newProps = { ...props, isInView: true };
    rerender(
      <Provider store={store}>
        <PanelEditorTableView {...newProps} />
      </Provider>
    );
    expect(screen.getByText(/PanelRenderer Mock/i)).toBeInTheDocument();
  });

  it('should run all panel queries if time changes', async () => {
    const { rerender, props, subject, store, timeSrv } = setupTestContext({});

    const timeRangeUpdated = {
      from: dateTime([2019, 1, 11, 12, 0]),
      to: dateTime([2019, 1, 11, 18, 0]),
    } as unknown as TimeRange;

    // only render the panel when loading is done
    act(() => {
      subject.next({ state: LoadingState.Loading, series: [], timeRange: getDefaultTimeRange() });
      subject.next({ state: LoadingState.Done, series: [], timeRange: getDefaultTimeRange() });
    });

    const newProps = { ...props, isInView: true };
    rerender(
      <Provider store={store}>
        <PanelEditorTableView {...newProps} />
      </Provider>
    );

    expect(screen.getByText(/PanelRenderer Mock/i)).toBeInTheDocument();

    // updating the global time range
    act(() => {
      timeSrv.setTime(timeRangeUpdated);
      props.panel.refresh();
    });

    // panel queries should have the updated time range
    expect(props.panel.runAllPanelQueries).toHaveBeenNthCalledWith(1, {
      dashboardId: props.dashboard.id,
      dashboardTimezone: '',
      dashboardUID: props.dashboard.uid,
      timeData: timeRangeUpdated,
      width: 100,
    });

    // update global time  second time

    const timeRangeUpdated2 = {
      from: dateTime([2018, 1, 11, 12, 0]),
      to: dateTime([2018, 1, 11, 18, 0]),
    } as unknown as TimeRange;

    act(() => {
      timeSrv.setTime(timeRangeUpdated2);
      props.panel.refresh();
    });

    // panel queries should have the updated time range
    expect(props.panel.runAllPanelQueries).toHaveBeenLastCalledWith({
      dashboardId: props.dashboard.id,
      dashboardTimezone: '',
      dashboardUID: props.dashboard.uid,
      timeData: timeRangeUpdated2,
      width: 100,
    });
  });
});

const TestPanelComponent: FC<PanelProps> = () => <div>Plugin Panel to Render</div>;
