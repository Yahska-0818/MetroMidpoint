import { useState, useEffect } from "react";
import type { ResultType } from "./types";
import StationInput from "./components/StationInput";
import RouteDisplay from "./components/RouteDisplay";
import RouteVisualizer from "./components/RouteVisualizer";
import { useWebHaptics } from "web-haptics/react";
import { getStations } from "./requests";
import { useQuery } from "@tanstack/react-query";

export default function App() {
  const [activeTab, setActiveTab] = useState<"meetup" | "route">("meetup");
  const [inputs, setInputs] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStations = params.get("stations");
    return urlStations ? urlStations.split(",") : ["", ""];
  });
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== null ? saved === "dark" : true;
  });
  const { trigger } = useWebHaptics();

  const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const fetchedStations = useQuery({
    queryKey: ["stations"],
    queryFn: getStations,
  });

  const stations = fetchedStations.data ?? [];

  const updateUrl = (currentInputs: string[]) => {
    const params = new URLSearchParams(window.location.search);
    params.set("stations", currentInputs.filter(Boolean).join(","));
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
    updateUrl(newInputs);
  };

  const addPerson = () => setInputs([...inputs, ""]);

  const removePerson = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
    updateUrl(newInputs);
  };

  const findMeetup = async () => {
    const validInputs = inputs.filter((i) => i.trim() !== "");
    if (validInputs.length < 2) return;
    setLoading(true);
    setResult(null);
    setError(null);
    updateUrl(validInputs);

    try {
      const res = await fetch(`${API_URL}/find-midpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stations: validInputs }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.detail ||
            "Calculating optimal midpoint failed. Verify station inputs.",
        );
        trigger(
          [
            { duration: 40 },
            { delay: 40, duration: 40 },
            { delay: 40, duration: 40 },
          ],
          { intensity: 0.9 },
        );
      } else {
        setResult(data);
        trigger([{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }]);
      }
      // eslint-disable-next-line
    } catch (err) {
      setError("Network error. Unable to reach the Delhi Metro server.");
      trigger(
        [
          { duration: 40 },
          { delay: 40, duration: 40 },
          { delay: 40, duration: 40 },
        ],
        { intensity: 0.9 },
      );
    } finally {
      setLoading(false);
    }
  };

  const swapStations = () => {
    if (inputs.length >= 2) {
      const newInputs = [...inputs];
      const temp = newInputs[0];
      newInputs[0] = newInputs[1];
      newInputs[1] = temp;
      setInputs(newInputs);
      updateUrl(newInputs);
    }
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 font-sans transition-colors ${darkMode ? "dark bg-black" : "bg-gray-100"}`}
    >
      <div className="max-w-7xl mx-auto bg-white dark:bg-black dark:border dark:border-zinc-800 p-4 sm:p-6 rounded-xl shadow-md transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white text-center sm:text-left">
            Delhi Metro Meetup Finder
          </h1>
          <button
            className="px-4 py-2 w-full sm:w-auto rounded-md cursor-pointer bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
            onClick={() => {
              setDarkMode(!darkMode);
              trigger([{ duration: 40 }], { intensity: 0.4 });
            }}
          >
            {darkMode ? "Light" : "Dark"} Mode
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-zinc-800 pb-2">
          <button
            className={`pb-2 px-2 font-semibold transition-colors cursor-pointer ${activeTab === "meetup" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
            onClick={() => {
              setActiveTab("meetup");
              trigger([{ duration: 15 }], { intensity: 0.4 });
            }}
          >
            Find Meetup
          </button>
          <button
            className={`pb-2 px-2 font-semibold transition-colors cursor-pointer ${activeTab === "route" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
            onClick={() => {
              setActiveTab("route");
              trigger([{ duration: 15 }], { intensity: 0.4 });
            }}
          >
            Point-to-Point Route
          </button>
        </div>

        {activeTab === "meetup" ? (
          <>
            <StationInput
              inputs={inputs}
              stations={stations}
              loading={loading}
              onInputChange={handleInputChange}
              onAddPerson={addPerson}
              onRemovePerson={removePerson}
              onSwap={swapStations}
              onSubmit={findMeetup}
            />
            {loading && (
              <div className="animate-pulse text-zinc-600 dark:text-zinc-400 mt-4 text-center">
                Locating optimal meetup station...
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-center font-medium border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {result && !loading && <RouteDisplay result={result} />}
          </>
        ) : (
          <RouteVisualizer stations={stations} />
        )}
      </div>
    </div>
  );
}
