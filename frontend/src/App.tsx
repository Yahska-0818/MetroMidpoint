import { useState, useEffect } from "react";
export default function App() {
  const [stations, setStations] = useState<string[]>([]);
  const [stationA, setStationA] = useState("");
  const [stationB, setStationB] = useState("");
  const [result, setResult] = useState<{
    meet_station: string;
    time_taken: number;
    route_a: string[];
    route_b: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = "http://localhost:8000";
  useEffect(() => {
    fetch(`${API_URL}/stations`)
      .then((res) => res.json())
      .then(setStations);
  }, []);
  const findMeetup = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/find-midpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ station_a: stationA, station_b: stationB }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Delhi Metro Meetup Finder
        </h1>
        <datalist id="stations-list">
          {stations.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="stations-list"
            onChange={(e) => setStationA(e.target.value)}
            placeholder="Station A"
            disabled={loading}
          />
          <input
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="stations-list"
            onChange={(e) => setStationB(e.target.value)}
            placeholder="Station B"
            disabled={loading}
          />
          <button
            className={`px-6 py-3 rounded-lg font-semibold text-white transition ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={findMeetup}
            disabled={loading}
          >
            {loading ? "Calculating..." : "Find"}
          </button>
        </div>
        {result && !loading && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold text-center text-green-700 mb-6">
              Optimal Meeting Point: {result.meet_station} (~{result.time_taken}{" "}
              mins)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">
                  Person A Route
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  {result.route_a.map((s, i) => (
                    <li key={i} className="p-1 hover:bg-gray-100 rounded">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">
                  Person B Route
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  {result.route_b.map((s, i) => (
                    <li key={i} className="p-1 hover:bg-gray-100 rounded">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
