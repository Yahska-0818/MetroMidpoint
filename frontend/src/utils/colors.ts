const colorMap: Record<string, { badge: string; hex: string }> = {
	"yellow line": {
		badge: "border-yellow-400 text-yellow-900 bg-yellow-400",
		hex: "#facc15",
	},
	"blue line": {
		badge: "border-blue-500 text-white bg-blue-500",
		hex: "#3b82f6",
	},
	"blue line branch": {
		badge: "border-blue-400 text-white bg-blue-400",
		hex: "#60a5fa",
	},
	"red line": { badge: "border-red-500 text-white bg-red-500", hex: "#ef4444" },
	"green line": {
		badge: "border-green-500 text-white bg-green-500",
		hex: "#22c55e",
	},
	"green line branch": {
		badge: "border-green-400 text-white bg-green-400",
		hex: "#4ade80",
	},
	"violet line": {
		badge: "border-purple-600 text-white bg-purple-600",
		hex: "#7c3aed",
	},
	"violet line branch": {
		badge: "border-purple-600 text-white bg-purple-600",
		hex: "#7c3aed",
	},
	"voilet line": {
		badge: "border-purple-600 text-white bg-purple-600",
		hex: "#7c3aed",
	},
	"voilet line branch": {
		badge: "border-purple-600 text-white bg-purple-600",
		hex: "#7c3aed",
	},
	"purple line": {
		badge: "border-purple-600 text-white bg-purple-600",
		hex: "#7c3aed",
	},
	"purple line branch": {
		badge: "border-purple-600 text-white bg-purple-600",
		hex: "#7c3aed",
	},
	"pink line": {
		badge: "border-pink-400 text-white bg-pink-400",
		hex: "#f472b6",
	},
	"pink line branch": {
		badge: "border-pink-400 text-white bg-pink-400",
		hex: "#f472b6",
	},
	"magenta line": {
		badge: "border-fuchsia-600 text-white bg-fuchsia-600",
		hex: "#d946ef",
	},
	"grey line": {
		badge: "border-gray-500 text-white bg-gray-500",
		hex: "#6b7280",
	},
	"gray line": {
		badge: "border-gray-500 text-white bg-gray-500",
		hex: "#6b7280",
	},
	"orange line": {
		badge: "border-orange-500 text-white bg-orange-500",
		hex: "#f97316",
	},
	"aqua line": {
		badge: "border-teal-500 text-white bg-teal-500",
		hex: "#14b8a6",
	},
	"rapid metro": {
		badge: "border-emerald-500 text-white bg-emerald-500",
		hex: "#10b981",
	},
	"magenta line branch": {
		badge: "border-fuchsia-600 text-white bg-fuchsia-600",
		hex: "#d946ef",
	},
};

const fallback = {
	badge: "border-zinc-400 text-zinc-800 bg-zinc-300",
	hex: "#a1a1aa",
};

function lookup(line: string) {
	const normalized = line.toLowerCase().trim();
	if (colorMap[normalized]) {
		return colorMap[normalized];
	}
	if (normalized.includes("purple") || normalized.includes("voilet") || normalized.includes("violet")) {
		return colorMap["violet line"];
	}
	const baseLine = normalized.replace(/\s+branch$/, "");
	if (colorMap[baseLine]) {
		return colorMap[baseLine];
	}
	if (!normalized.endsWith("line") && !normalized.endsWith("metro")) {
		const withLine = `${normalized} line`;
		if (colorMap[withLine]) {
			return colorMap[withLine];
		}
	}
	return fallback;
}

export function formatLineColor(line: string): string {
	return lookup(line).badge;
}

export function getLineHex(line: string): string {
	return lookup(line).hex;
}
