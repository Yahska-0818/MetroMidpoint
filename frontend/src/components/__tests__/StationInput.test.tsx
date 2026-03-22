import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StationInput from '../StationInput';
import { getNearestStation } from '../../requests';

vi.mock('../../requests', () => ({
  getNearestStation: vi.fn()
}));

const defaultProps = {
  inputs: ['A', 'B'],
  stations: ['A', 'B', 'C'],
  loading: false,
  onInputChange: vi.fn(),
  onAddPerson: vi.fn(),
  onRemovePerson: vi.fn(),
  onSwap: vi.fn(),
  onSubmit: vi.fn()
};

describe('StationInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly maps the provided inputs array to textbox fields', () => {
    render(<StationInput {...defaultProps} />);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('fires input changes and dynamically resets form error states', async () => {
    const user = userEvent.setup();
    render(<StationInput {...defaultProps} />);
    

    fireEvent.click(screen.getByText('Find Meetup'));
    

    const inputs = screen.getAllByRole('combobox');
    fireEvent.change(inputs[0], { target: { value: 'AX' } });
    expect(defaultProps.onInputChange).toHaveBeenCalledWith(0, 'AX');
  });

  it('triggers a local validation error when inadequate stations are provided', async () => {
    render(<StationInput {...defaultProps} inputs={['A', '']} />);
    fireEvent.click(screen.getByText('Find Meetup'));
    
    expect(await screen.findByText('Please fill in at least two stations to find a meetup.')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('resolves geolocation coordinates and applies them to the form', async () => {
    const mockGeolocation = vi.fn().mockImplementation((success) => success({ coords: { latitude: 10, longitude: 20 } }));
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: mockGeolocation } });
    vi.mocked(getNearestStation).mockResolvedValueOnce('Nearest Station');

    render(<StationInput {...defaultProps} />);
    const inputs = screen.getAllByRole('combobox');
    

    fireEvent.focus(inputs[0]); 
    const nearestBtn = await screen.findByText('Nearest');
    fireEvent.click(nearestBtn);
    
    await waitFor(() => {
      expect(getNearestStation).toHaveBeenCalledWith(10, 20);
      expect(defaultProps.onInputChange).toHaveBeenCalledWith(0, 'Nearest Station');
    });
  });

  it('dynamically triggers add and swap event pathways', () => {
    const props = { ...defaultProps, inputs: ['A', 'B'] };
    render(<StationInput {...props} />);
    
    fireEvent.click(screen.getByText('Add Person'));
    expect(props.onAddPerson).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('Swap'));
    expect(props.onSwap).toHaveBeenCalled();
  });
});
