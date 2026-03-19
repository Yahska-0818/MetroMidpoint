import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchRouteInfo } from "../requests";
import TransitTimeline from "./TransitTimeline";
import { useWebHaptics } from "web-haptics/react";

interface Props {
  stations: string[];
}

export default function RouteVisualizer({ stations }: Props) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const { trigger } = useWebHaptics();

  const routeMutation = useMutation({
    mutationFn: () => fetchRouteInfo(source, destination),
    onSuccess: () => {
      trigger([{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }]);
    },
    onError: () => {
      trigger(
        [
          { duration: 40 },
          { delay: 40, duration: 40 },
          { delay: 40, duration: 40 },
        ],
        { intensity: 0.9 },
      );
    },
  });

  return (
    <div className="p-4 sm:p-6 bg-zinc-950/20 dark:bg-zinc-900/50 rounded-xl text-white border border-zinc-200 dark:border-zinc-800 shadow-lg">
      <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-gray-100">
        Point-to-Point Route Search
      </h2>

      <datalist id="route-stations-list">
        {stations.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source (e.g., Hauz Khas (Yellow Line))"
          list="route-stations-list"
          className="p-3.5 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-zinc-700 shadow-inner"
        />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination (e.g., Welcome (Red Line))"
          list="route-stations-list"
          className="p-3.5 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-zinc-700 shadow-inner"
        />
        <button
          onClick={() => {
            trigger([{ duration: 15 }], { intensity: 0.4 });
            if (source.trim() && destination.trim()) {
              routeMutation.mutate();
            }
          }}
          disabled={routeMutation.isPending}
          className="px-6 py-3.5 cursor-pointer bg-blue-600 rounded-lg font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed transition hover:bg-blue-700 shadow"
        >
          {routeMutation.isPending ? "Calculating..." : "Find Route"}
        </button>
      </div>

      {routeMutation.isPending && (
        <div className="animate-pulse text-zinc-600 dark:text-zinc-400 text-center text-lg mt-6">
          Calculating optimal path...
        </div>
      )}

      {routeMutation.isError && (
        <div className="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium text-center border border-red-200 dark:border-red-800 mt-6">
          {routeMutation.error.message}
        </div>
      )}

      {routeMutation.data && !routeMutation.isPending && (
        <div className="mt-8 border-t dark:border-zinc-800 pt-6">
          <div className="flex justify-between items-center mb-6 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Time:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {routeMutation.data.total_time}
              </span>{" "}
              mins
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Fare:{" "}
              <span className="font-bold text-green-600 dark:text-green-400">
                Rs. {routeMutation.data.fare}
              </span>
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Changes:{" "}
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {routeMutation.data.interchanges}
              </span>
            </span>
          </div>

          <TransitTimeline path={routeMutation.data.path} />
        </div>
      )}
    </div>
  );
}
