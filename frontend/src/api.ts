const BASE_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

export async function fetchRoute(source: string, destination: string) {
  const res = await fetch(`${BASE_URL}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, destination }),
  });
  if (!res.ok) throw new Error("Failed to fetch route");
  return res.json();
}
