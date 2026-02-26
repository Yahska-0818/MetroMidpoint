import type { RouteStep } from "../types";
import { formatLineColor } from "../utils/colors";

export default function TransitTimeline({ path }: { path: RouteStep[] }) {
  return (
    <div className="relative pl-7 pt-1">
      <ul className="space-y-1 relative z-10">
        {path.map((step, i, arr) => {
          const colorClasses = formatLineColor(step.line);
          const isInterchange =
            i > 0 &&
            arr[i - 1].name === step.name &&
            arr[i - 1].line !== step.line;

          if (isInterchange) {
            return (
              <div
                key={i}
                className="my-3 p-3 text-center text-sm font-bold text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10 border border-green-500/50 rounded-lg shadow-inner"
              >
                Change to {step.line}
              </div>
            );
          }

          return (
            <li
              key={i}
              className="group p-2 -ml-2 rounded flex sm:items-center gap-3 transition hover:bg-gray-100/50 dark:hover:bg-zinc-800/50"
            >
              <div
                className={`w-3.5 h-3.5 mt-1 sm:mt-0 rounded-full border-2 border-zinc-900 dark:border-black ${colorClasses.split(" ").pop()}`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-bold w-fit border shadow ${colorClasses}`}
                >
                  {step.line}
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
