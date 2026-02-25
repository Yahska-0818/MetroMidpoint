import type { ResultType, RouteNode } from "../types";
import { useState } from "react";
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
            className="my-3 p-3 rounded border border-green-500/50 bg-green-50 dark:bg-green-900/20 text-center text-sm font-bold text-green-600 dark:text-green-400"
          >
            Interchange to {s.line}
          </div>
        );
      }
      return (
        <li
          key={i}
          className="p-3 my-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded flex flex-col sm:flex-row sm:items-center gap-2"
        >
          <span
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-bold w-fit ${getLineColor(s.line)}`}
          >
            {s.line}
          </span>
          <span className="text-gray-800 dark:text-gray-200">{s.name}</span>
        </li>
      );
    });
  };
  return (
    <div className="mt-8 border-t dark:border-zinc-800 pt-6">
      <h2 className="text-xl font-semibold text-center text-green-700 dark:text-green-400 mb-2">
        Optimal Meeting Point: {result.meet_station}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-2">
        Max Travel Time: ~{result.time_taken} mins
      </p>
      <div className="text-center mb-6">
        <span className="inline-block px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-medium border border-blue-200 dark:border-blue-800 w-full sm:w-auto">
          Location: {result.meetup_spot}
        </span>
      </div>
      <div className="flex justify-center mb-6">
        <button
          className="px-6 py-3 w-full sm:w-auto rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1000);
          }}
        >
          {copied ? "Copied to clipboard" : "Copy Link"}
        </button>
      </div>
      <div className="bg-gray-50 dark:bg-zinc-900 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm max-h-150 overflow-y-auto space-y-6">
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
              <ul className="space-y-1">{renderRoute(routeData.steps)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
