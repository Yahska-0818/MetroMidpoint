import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
type RouteNode = { name: string; line: string; lat: number; lng: number };
type ResultType = {
  meet_station: string;
  time_taken: number;
  meet_lat: number;
  meet_lng: number;
  route_a: RouteNode[];
  route_b: RouteNode[];
};
export default function App() {
  const [stations, setStations] = useState<string[]>([]);
  const [stationA, setStationA] = useState("");
  const [stationB, setStationB] = useState("");
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== null ? saved === "dark" : true;
  });
  const API_URL = "http://localhost:8000";
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);
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
  const swapStations = () => {
    setStationA(stationB);
    setStationB(stationA);
  };
  const getLineColor = (line: string) => {
    const colors: Record<string, string> = {
      "Yellow Line": "bg-yellow-400 text-yellow-900",
      "Blue Line": "bg-blue-500 text-white",
      "Blue Line Branch": "bg-blue-400 text-white",
      "Red Line": "bg-red-500 text-white",
      "Green Line": "bg-green-500 text-white",
      "Green Line Branch": "bg-green-400 text-white",
      "Violet Line": "bg-purple-600 text-white",
      "Pink Line": "bg-pink-500 text-white",
      "Magenta Line": "bg-fuchsia-600 text-white",
      "Grey Line": "bg-gray-500 text-white",
      "Orange Line": "bg-orange-500 text-white",
      "Aqua Line": "bg-teal-500 text-white",
      "Rapid Metro": "bg-emerald-500 text-white",
    };
    return colors[line] || "bg-gray-300 text-gray-800";
  };
  const renderRoute = (route: RouteNode[]) => {
    return route.map((s, i, arr) => {
      const isInterchange =
        i > 0 && arr[i - 1].name === s.name && arr[i - 1].line !== s.line;
      if (isInterchange) {
        return (
          <div
            key={i}
            className="my-2 p-2 rounded border border-green-500/50 bg-green-50 dark:bg-green-900/20 text-center text-sm font-bold text-green-600 dark:text-green-400"
          >
            🔄 Interchange to {s.line}
          </div>
        );
      }
      return (
        <li
          key={i}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded flex items-center gap-2"
        >
          <span
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-bold ${getLineColor(s.line)}`}
          >
            {s.line}
          </span>
          <span className="text-gray-800 dark:text-gray-200">{s.name}</span>
        </li>
      );
    });
  };
  return (
    <div
      className={`min-h-screen p-8 font-sans transition-colors ${darkMode ? "dark bg-black" : "bg-gray-100"}`}
    >
      <div className="max-w-7xl mx-auto bg-white dark:bg-black dark:border dark:border-zinc-800 p-6 rounded-xl shadow-md transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Delhi Metro Meetup Finder
          </h1>
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light" : "Dark"} Mode
          </button>
        </div>
        <datalist id="stations-list">
          {stations.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <input
            value={stationA}
            className="flex-1 w-full p-3 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="stations-list"
            onChange={(e) => setStationA(e.target.value)}
            placeholder="Station A"
            disabled={loading}
          />
          <button
            onClick={swapStations}
            className="p-3 bg-gray-200 dark:bg-zinc-800 rounded-full hover:bg-gray-300 dark:hover:bg-zinc-700 transition text-gray-800 dark:text-white"
            disabled={loading}
          >
            ⇄
          </button>
          <input
            value={stationB}
            className="flex-1 w-full p-3 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="stations-list"
            onChange={(e) => setStationB(e.target.value)}
            placeholder="Station B"
            disabled={loading}
          />
          <button
            className={`px-6 py-3 rounded-lg font-semibold text-white transition w-full md:w-auto ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={findMeetup}
            disabled={loading}
          >
            {loading ? "Calculating..." : "Find"}
          </button>
        </div>
        {result && !loading && (
          <div className="mt-8 border-t dark:border-zinc-800 pt-6">
            <h2 className="text-xl font-semibold text-center text-green-700 dark:text-green-400 mb-4">
              Optimal Meeting Point: {result.meet_station} (~{result.time_taken}{" "}
              mins)
            </h2>
            <div className="flex justify-center mb-6">
              <button
                className="px-4 py-2 rounded-lg bg-blue-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-200 dark:hover:bg-zinc-700 transition"
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? "Hide Map" : "Show Map"}
              </button>
            </div>
            <div
              className={`grid grid-cols-1 ${showMap ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-8`}
            >
              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm max-h-[500px] overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white border-b dark:border-zinc-800 pb-2 mb-4">
                  Person A Route
                </h3>
                <ul className="space-y-1">{renderRoute(result.route_a)}</ul>
              </div>
              {showMap && (
                <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm lg:col-span-1 h-[500px] z-0 overflow-hidden">
                  <MapContainer
                    center={[result.meet_lat, result.meet_lng]}
                    zoom={11}
                    className="h-full w-full rounded-lg"
                    style={{ background: darkMode ? "#1a1a1a" : "#f3f4f6" }}
                  >
                    <TileLayer
                      url={
                        darkMode
                          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      }
                    />
                    <Polyline
                      positions={result.route_a.map((s) => [s.lat, s.lng])}
                      color="#ef4444"
                      weight={5}
                      opacity={0.8}
                    />
                    <Polyline
                      positions={result.route_b.map((s) => [s.lat, s.lng])}
                      color="#3b82f6"
                      weight={5}
                      opacity={0.8}
                    />
                    <Marker position={[result.meet_lat, result.meet_lng]}>
                      <Popup>{result.meet_station}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm max-h-[500px] overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white border-b dark:border-zinc-800 pb-2 mb-4">
                  Person B Route
                </h3>
                <ul className="space-y-1">{renderRoute(result.route_b)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
