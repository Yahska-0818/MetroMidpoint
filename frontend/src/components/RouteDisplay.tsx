import type { ResultType } from "../types";
import { useState } from "react";
import TransitTimeline from "./TransitTimeline";

export default function RouteDisplay({ result }: { result: ResultType }) {
  const [copied, setCopied] = useState(false);
  const ROUTE_COLORS = [
    "border-red-500",
    "border-blue-500",
    "border-green-500",
    "border-yellow-500",
    "border-purple-500",
    "border-pink-500",
    "border-cyan-500",
  ];

  return (
    <div className="mt-8 border-t dark:border-zinc-800 pt-6">
      <h2 className="text-xl font-semibold text-center text-green-700 dark:text-green-400 mb-2">
        Optimal Meeting Point: {result.meet_station}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-2">
        Max Travel Time: ~{result.max_travel_time} mins
      </p>

      <div className="flex justify-center mb-6">
        <button
          className="px-6 py-3 w-full sm:w-auto rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
          }}
        >
          {copied ? "Copied to clipboard" : "Copy Link"}
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-zinc-900 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm max-h-[600px] overflow-y-auto space-y-6">
        {!result.routes || result.routes.length === 0 ? (
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            Optimal route not available for this combination.
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 ${result.routes.length > 1 ? "md:grid-cols-2" : ""} lg:grid-cols-${Math.min(result.routes.length, 3)} gap-6`}
          >
            {result.routes.map((routeData, idx) => (
              <div
                key={idx}
                className={`border-l-4 pl-4 ${ROUTE_COLORS[idx % ROUTE_COLORS.length]}`}
              >
                <div className="border-b dark:border-zinc-800 pb-3 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                    Person {idx + 1} Route
                  </h3>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded w-fit">
                    Rs. {routeData.fare}
                  </span>
                </div>
                <TransitTimeline path={routeData.path} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
