import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStations, findMeetupInfo, fetchRouteInfo, getNearestStation } from '../requests';

describe('requests', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStations', () => {
    it('fetches stations successfully', async () => {
      const mockStations = ['A', 'B'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStations,
      } as Response);

      const result = await getStations();
      expect(result).toEqual(mockStations);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/stations');
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response);
      await expect(getStations()).rejects.toThrow('Failed to fetch stations');
    });
  });

  describe('findMeetupInfo', () => {
    it('throws if less than two valid inputs', async () => {
      await expect(findMeetupInfo(['A'])).rejects.toThrow('Please provide at least two stations.');
    });

    it('fetches meetup info successfully', async () => {
      const mockResult = { meet_station: 'C', max_travel_time: 10, routes: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await findMeetupInfo(['A', 'B']);
      expect(result).toEqual(mockResult);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/find-midpoint', expect.any(Object));
    });

    it('throws API error detail if available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Custom API Error' }),
      } as Response);

      await expect(findMeetupInfo(['A', 'B'])).rejects.toThrow('Custom API Error');
    });

    it('throws default error if no detail available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(findMeetupInfo(['A', 'B'])).rejects.toThrow('Calculating optimal midpoint failed. Verify station inputs.');
    });

    it('throws network error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(findMeetupInfo(['A', 'B'])).rejects.toThrow('Network error');
    });
    
    it('throws generic network error on non-Error object', async () => {
      mockFetch.mockRejectedValueOnce('Some string error');
      await expect(findMeetupInfo(['A', 'B'])).rejects.toThrow('Network error. Unable to reach the Delhi Metro server.');
    });
  });

  describe('fetchRouteInfo', () => {
    it('fetches route info successfully', async () => {
      const mockResult = { path: [], total_time: 10, fare: 20, interchanges: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await fetchRouteInfo('A', 'B', 'fastest');
      expect(result).toEqual(mockResult);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/route?optimize=fastest', expect.any(Object));
    });

    it('throws error when response not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(fetchRouteInfo('A', 'B')).rejects.toThrow('Could not retrieve route. Double-check station names and line names.');
    });
  });

  describe('getNearestStation', () => {
    it('gets nearest station', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ station: 'Nearest' }),
      } as Response);

      const result = await getNearestStation(10, 20);
      expect(result).toBe('Nearest');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/nearest-station?lat=10&lng=20');
    });

    it('throws error when nearest station fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(getNearestStation(10, 20)).rejects.toThrow('Could not find nearest station');
    });
  });
});
