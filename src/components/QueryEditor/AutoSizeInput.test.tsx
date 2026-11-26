import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AutoSizeInput } from './AutoSizeInput';

describe('AutoSizeInput', () => {
  it('shows a new value', () => {
    const { rerender } = render(<AutoSizeInput aria-label='input' value='30s' />);
    expect(screen.getByLabelText('input')).toHaveValue('30s');

    rerender(<AutoSizeInput aria-label='input' value='2m' />);
    expect(screen.getByLabelText('input')).toHaveValue('2m');
  });

  it('replaces the committed text when the value changes back', async () => {
    const committed: string[] = [];
    const onCommitChange = (event: React.FormEvent<HTMLInputElement>) => committed.push(event.currentTarget.value);
    const { rerender } = render(<AutoSizeInput aria-label='input' value='30s' onCommitChange={onCommitChange} />);
    const input = screen.getByLabelText('input');

    await userEvent.clear(input);
    await userEvent.type(input, '2m{Enter}');
    expect(committed).toEqual(['2m']);

    rerender(<AutoSizeInput aria-label='input' value='2m' onCommitChange={onCommitChange} />);
    expect(input).toHaveValue('2m');

    // e.g. the browser Back button restores the previous query
    rerender(<AutoSizeInput aria-label='input' value='30s' onCommitChange={onCommitChange} />);
    expect(input).toHaveValue('30s');
  });

  it('clears the input when the value is removed', () => {
    const { rerender } = render(<AutoSizeInput aria-label='input' value='30s' />);

    rerender(<AutoSizeInput aria-label='input' />);
    expect(screen.getByLabelText('input')).toHaveValue('');
  });

  it('keeps the typed text while the value stays the same', async () => {
    const { rerender } = render(<AutoSizeInput aria-label='input' value='30s' />);
    const input = screen.getByLabelText('input');

    await userEvent.clear(input);
    await userEvent.type(input, '2m');
    rerender(<AutoSizeInput aria-label='input' value='30s' placeholder='auto' />);
    expect(input).toHaveValue('2m');
  });

  it('reads defaultValue only once', () => {
    const { rerender } = render(<AutoSizeInput aria-label='input' defaultValue='30s' />);

    rerender(<AutoSizeInput aria-label='input' defaultValue='2m' />);
    expect(screen.getByLabelText('input')).toHaveValue('30s');
  });
});
