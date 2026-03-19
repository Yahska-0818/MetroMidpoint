const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

export const getStations = async (): Promise<string[]> => {
  const response = await fetch(`${API_URL}/stations`);
  if (!response.ok) {
    console.log("couldnt fetch");
    throw new Error("Failed to fetch stations");
  }
  return response.json();
};
