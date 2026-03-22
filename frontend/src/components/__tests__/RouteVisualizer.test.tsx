import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RouteVisualizer from '../RouteVisualizer';
import { fetchRouteInfo } from '../../requests';

vi.mock('../../requests', () => ({
  fetchRouteInfo: vi.fn(),
  getNearestStation: vi.fn().mockResolvedValue('Nearest Station')
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('RouteVisualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders source and destination placeholders', () => {
    renderWithClient(<RouteVisualizer stations={['A', 'B']} />);
    expect(screen.getByPlaceholderText('Source Station')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Destination Station')).toBeInTheDocument();
  });

  it('blocks submissions when inputs are missing', () => {
    renderWithClient(<RouteVisualizer stations={['A', 'B']} />);
    fireEvent.click(screen.getByText('Find Route'));
    expect(screen.getByText('Please select both a source and destination station.')).toBeInTheDocument();
  });

  it('manages data fetching and rendering the active route parameters', async () => {
    const mockRoute = {
      path: [{ name: 'A', line: 'Red line' }, { name: 'B', line: 'Red line' }],
      total_time: 15,
      fare: 30,
      interchanges: 1
    };
    vi.mocked(fetchRouteInfo).mockResolvedValue(mockRoute);

    const user = userEvent.setup();
    renderWithClient(<RouteVisualizer stations={['A', 'B']} />);
    
    await user.type(screen.getByPlaceholderText('Source Station'), 'A');
    await user.type(screen.getByPlaceholderText('Destination Station'), 'B');
    
    fireEvent.click(screen.getByText('Find Route'));

    expect(await screen.findByText('15')).toBeInTheDocument();
    expect(await screen.findByText('₹30')).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('allows swapping the source and destination contents', async () => {
    const user = userEvent.setup();
    renderWithClient(<RouteVisualizer stations={['A', 'B']} />);
    const source = screen.getByPlaceholderText('Source Station');
    const dest = screen.getByPlaceholderText('Destination Station');

    await user.type(source, 'SourceA');
    await user.type(dest, 'DestB');
    

    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[0]);
    
    await waitFor(() => {
      expect(source).toHaveValue('DestB');
      expect(dest).toHaveValue('SourceA');
    });
  });
});
