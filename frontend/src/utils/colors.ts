export function formatLineColor(line: string) {
  const colors: Record<string, string> = {
    "Yellow Line": "border-yellow-400 text-yellow-900 bg-yellow-400",
    "Blue Line": "border-blue-500 text-white bg-blue-500",
    "Blue Line Branch": "border-blue-400 text-white bg-blue-400",
    "Red Line": "border-red-500 text-white bg-red-500",
    "Green Line": "border-green-500 text-white bg-green-500",
    "Green Line Branch": "border-green-400 text-white bg-green-400",
    "Violet Line": "border-purple-600 text-white bg-purple-600",
    "Pink Line": "border-pink-500 text-white bg-pink-500",
    "Magenta Line": "border-fuchsia-600 text-white bg-fuchsia-600",
    "Grey Line": "border-gray-500 text-white bg-gray-500",
    "Orange Line": "border-orange-500 text-white bg-orange-500",
    "Aqua Line": "border-teal-500 text-white bg-teal-500",
    "Rapid Metro": "border-emerald-500 text-white bg-emerald-500",
  };
  return colors[line] || "border-gray-300 text-gray-800 bg-gray-300";
}
