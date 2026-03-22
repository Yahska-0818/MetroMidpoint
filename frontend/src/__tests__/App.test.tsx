import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { getStations } from '../requests';

vi.mock('../requests', () => ({
  getStations: vi.fn(),
  findMeetupInfo: vi.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '' },
    });
  });

  const renderWithClient = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  };

  it('renders loading states initially', () => {
    vi.mocked(getStations).mockImplementation(() => new Promise(() => {}));
    renderWithClient();
    expect(screen.getByText('Loading stations…')).toBeInTheDocument();
  });

  it('renders an error fallback when stations fail to download', async () => {
    vi.mocked(getStations).mockRejectedValue(new Error('Backend offline'));
    renderWithClient();
    expect(await screen.findByText('Failed to load stations. Please refresh the page.')).toBeInTheDocument();
  });

  it('renders the core application shell after fetching stations', async () => {
    vi.mocked(getStations).mockResolvedValue(['A', 'B']);
    renderWithClient();
    
    expect(await screen.findByText('MetroMidpoint')).toBeInTheDocument();
    expect(screen.getAllByText('Find Meetup').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Route Planner').length).toBeGreaterThan(0);
  });

  it('swaps tabs correctly between Meeting and Visualizer layouts', async () => {
    vi.mocked(getStations).mockResolvedValue(['A', 'B']);
    renderWithClient();
    
    await screen.findByText('MetroMidpoint');
    
    fireEvent.click(screen.getAllByText('Route Planner')[0]);
    expect(screen.queryByPlaceholderText('Station 1')).not.toBeInTheDocument();
  });
  
  it('manages the dark-theme toggler internally', async () => {
    vi.mocked(getStations).mockResolvedValue(['A', 'B']);
    renderWithClient();
    
    await screen.findByText('MetroMidpoint');
    

    const buttons = screen.getAllByRole('button');
    const toggleBtn = buttons[buttons.length - 1];
    fireEvent.click(toggleBtn);
  });
});
