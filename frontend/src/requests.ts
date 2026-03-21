import type { ResultType, RouteInfo } from "./types";

const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

export const getStations = async (): Promise<string[]> => {
  const response = await fetch(`${API_URL}/stations`);
  if (!response.ok) {
    throw new Error("Failed to fetch stations");
  }
  return response.json();
};

export const findMeetupInfo = async (
  validInputs: string[],
): Promise<ResultType> => {
  if (validInputs.length < 2) {
    throw new Error("Please provide at least two stations.");
  }

  try {
    const res = await fetch(`${API_URL}/find-midpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stations: validInputs }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.detail ||
          "Calculating optimal midpoint failed. Verify station inputs.",
      );
    }

    return data;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error("Network error. Unable to reach the Delhi Metro server.");
  }
};

export const fetchRouteInfo = async (
  source: string,
  destination: string,
  optimize: "fastest" | "fewest_interchanges" = "fastest",
): Promise<RouteInfo> => {
  const res = await fetch(`${API_URL}/route?optimize=${optimize}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, destination }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      "Could not retrieve route. Double-check station names and line names.",
    );
  }

  return data;
};

export const getNearestStation = async (lat: number, lng: number): Promise<string> => {
  const res = await fetch(`${API_URL}/nearest-station?lat=${lat}&lng=${lng}`);
  const data = await res.json();
  if (!res.ok) throw new Error("Could not find nearest station");
  return data.station as string;
};
