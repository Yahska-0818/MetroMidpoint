import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RouteDisplay from '../RouteDisplay';

describe('RouteDisplay', () => {
  const mockResult = {
    meet_station: 'Rajiv Chowk',
    max_travel_time: 15,
    routes: [
      { path: [{ name: 'A', line: 'Red line' }], total_time: 10, fare: 10, interchanges: 0 },
      { path: [{ name: 'B', line: 'Blue line' }], total_time: 15, fare: 20, interchanges: 0 }
    ]
  };

  it('renders the optimal meeting point and max travel time', () => {
    render(<RouteDisplay result={mockResult} />);
    expect(screen.getByText('Rajiv Chowk')).toBeInTheDocument();
    expect(screen.getByText(/~15 mins/)).toBeInTheDocument();
  });

  it('handles copying the URL to the clipboard', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(<RouteDisplay result={mockResult} />);
    
    const btn = screen.getByText('Copy Link');
    fireEvent.click(btn);
    
    expect(clipboardSpy).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText('✓ Copied')).toBeInTheDocument();
  });

  it('gracefully renders a fallback when no routes are returned', () => {
    render(<RouteDisplay result={{ ...mockResult, routes: [] }} />);
    expect(screen.getByText('Optimal route not available for this combination.')).toBeInTheDocument();
  });
});
