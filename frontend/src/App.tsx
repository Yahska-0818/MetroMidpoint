import { useState, useEffect } from "react";
import type { ResultType } from "./types";
import StationInput from "./components/StationInput";
import RouteDisplay from "./components/RouteDisplay";
export default function App() {
  const [stations, setStations] = useState<string[]>([]);
  const [inputs, setInputs] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStations = params.get("stations");
    return urlStations ? urlStations.split(",") : ["", ""];
  });
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== null ? saved === "dark" : true;
  });
  const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  useEffect(() => {
    fetch(`${API_URL}/stations`)
      .then((res) => res.json())
      .then(setStations);
  }, [API_URL]);
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
    updateUrl(validInputs);
    const res = await fetch(`${API_URL}/find-midpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stations: validInputs }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
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
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light" : "Dark"} Mode
          </button>
        </div>
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
        {result && !loading && <RouteDisplay result={result} />}
      </div>
    </div>
  );
}
