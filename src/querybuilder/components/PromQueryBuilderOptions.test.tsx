import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CoreApp } from '@grafana/data';

import { PromQuery } from '../../types';

import { PromQueryBuilderOptions } from './PromQueryBuilderOptions';

describe('PromQueryBuilderOptions', () => {
  const renderOptions = async (query: Partial<PromQuery>) => {
    const onChange = jest.fn();
    const props = { app: CoreApp.Explore, onChange, onRunQuery: jest.fn() };
    const { rerender } = render(<PromQueryBuilderOptions query={{ refId: 'A', expr: 'up', ...query }} {...props} />);
    await userEvent.click(screen.getByText('Options'));
    return {
      onChange,
      rerender: (query: Partial<PromQuery>) =>
        rerender(<PromQueryBuilderOptions query={{ refId: 'A', expr: 'up', ...query }} {...props} />),
    };
  };

  it('shows Min step of the previous query after the browser Back button', async () => {
    const { onChange, rerender } = await renderOptions({ interval: '30s' });
    const minStep = screen.getByLabelText('Set lower limit for the step parameter');

    await userEvent.clear(minStep);
    await userEvent.type(minStep, '2m{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ interval: '2m' }));
    rerender({ interval: '2m' });

    rerender({ interval: '30s' });
    expect(minStep).toHaveValue('30s');
  });

  it('shows the custom legend of the previous query after the browser Back button', async () => {
    const { onChange, rerender } = await renderOptions({ legendFormat: '{{job}}' });
    const legend = screen.getByDisplayValue('{{job}}');

    await userEvent.clear(legend);
    // `{{` types a literal `{`
    await userEvent.type(legend, '{{{{instance}}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ legendFormat: '{{instance}}' }));
    rerender({ legendFormat: '{{instance}}' });

    rerender({ legendFormat: '{{job}}' });
    expect(legend).toHaveValue('{{job}}');
  });
});
