import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TransitTimeline from '../TransitTimeline';
import type { RouteStep } from '../../types';

describe('TransitTimeline', () => {
  it('renders a simple route without interchanges', () => {
    const path: RouteStep[] = [
      { name: 'Station A', line: 'Red line' },
      { name: 'Station B', line: 'Red line' }
    ];
    render(<TransitTimeline path={path} />);
    expect(screen.getByText('Station A')).toBeInTheDocument();
    expect(screen.getByText('Station B')).toBeInTheDocument();
    expect(screen.getByText('Red line')).toBeInTheDocument();
  });

  it('renders a route with interchanges', () => {
    const path: RouteStep[] = [
      { name: 'Station A', line: 'Red line' },
      { name: 'Station B', line: 'Red line' },
      { name: 'Station B', line: 'Blue line' },
      { name: 'Station C', line: 'Blue line' }
    ];
    render(<TransitTimeline path={path} />);
    expect(screen.getByText('Red line')).toBeInTheDocument();
    expect(screen.getByText('Blue line')).toBeInTheDocument();
    expect(screen.getAllByText('Station B')).toHaveLength(2);
  });
});
