import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { getStationCoordinates } from "../requests";
import { getLineHex } from "../utils/colors";
import { motion, AnimatePresence } from "framer-motion";
import type { RouteInfo } from "../types";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";

const LINE_COLORS: Record<string, string> = {
	"Blue line": "#2563eb",
	"Blue line branch": "#2563eb",
	"Yellow line": "#eab308",
	"Red line": "#dc2626",
	"Green line": "#16a34a",
	"Green line branch": "#16a34a",
	"Voilet line": "#7c3aed",
	"Voilet line branch": "#7c3aed",
	"Violet line": "#7c3aed",
	"Violet line branch": "#7c3aed",
	"Purple line": "#7c3aed",
	"Purple line branch": "#7c3aed",
	"Pink line": "#ec4899",
	"Pink line branch": "#ec4899",
	"Magenta line": "#d946ef",
	"Magenta line branch": "#d946ef",
	"Orange line": "#f97316",
	"Aqua line": "#06b6d4",
	"Grey line": "#6b7280",
	"Gray line": "#6b7280",
	"Rapid Metro": "#14b8a6",
};

const ROUTE_FALLBACK_COLORS = [
	"#3b82f6",
	"#ef4444",
	"#22c55e",
	"#f59e0b",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
];

function FitBounds({ bounds }: { bounds: LatLngTuple[] }) {
	const map = useMap();
	const fitted = useRef(false);

	useEffect(() => {
		if (bounds.length > 0 && !fitted.current) {
			const latLngBounds = L.latLngBounds(bounds);
			map.fitBounds(latLngBounds, { padding: [30, 30], maxZoom: 14 });
			fitted.current = true;
		}
	}, [bounds, map]);

	return null;
}

function InvalidateOnExpand({ expanded }: { expanded: boolean }) {
	const map = useMap();

	useEffect(() => {
		if (expanded) {
			setTimeout(() => map.invalidateSize(), 350);
		}
	}, [expanded, map]);

	return null;
}

interface RouteMapProps {
	routes: RouteInfo[];
	routeColors?: string[];
}

export default function RouteMap({ routes, routeColors }: RouteMapProps) {
	const [expanded, setExpanded] = useState(false);

	const { data: coords } = useQuery({
		queryKey: ["station-coordinates"],
		queryFn: getStationCoordinates,
		staleTime: Infinity,
	});

	if (!coords || routes.length === 0) return null;

	const routePolylines: { positions: LatLngTuple[]; color: string; stationPoints: { pos: LatLngTuple; name: string; color: string }[] }[] = [];
	const allBounds: LatLngTuple[] = [];

	routes.forEach((route, routeIdx) => {
		const positions: LatLngTuple[] = [];
		const stationPoints: { pos: LatLngTuple; name: string; color: string }[] = [];

		route.path.forEach((step) => {
			const coord = coords[step.name];
			if (coord) {
				const pos: LatLngTuple = [coord.lat, coord.lng];
				positions.push(pos);
				allBounds.push(pos);
				stationPoints.push({
					pos,
					name: step.name,
					color: getLineHex(step.line) || LINE_COLORS[step.line] || ROUTE_FALLBACK_COLORS[routeIdx % ROUTE_FALLBACK_COLORS.length],
				});
			}
		});

		const color = routeColors?.[routeIdx] || ROUTE_FALLBACK_COLORS[routeIdx % ROUTE_FALLBACK_COLORS.length];
		if (positions.length > 1) {
			routePolylines.push({ positions, color, stationPoints });
		}
	});

	if (allBounds.length === 0) return null;

	const isDark = document.documentElement.classList.contains("dark");
	const tileUrl = isDark
		? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
		: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

	return (
		<div className="mt-6">
			<motion.button
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.98 }}
				onClick={() => setExpanded(!expanded)}
				className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border border-zinc-300/70 dark:border-white/[0.12] bg-transparent backdrop-blur-3xl transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
			>
				<div className="flex items-center gap-2.5">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
						<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
						<line x1="8" y1="2" x2="8" y2="18" />
						<line x1="16" y1="6" x2="16" y2="22" />
					</svg>
					<span className="text-sm font-semibold text-zinc-700 dark:text-white/70">
						View on Map
					</span>
				</div>
				<motion.svg
					animate={{ rotate: expanded ? 180 : 0 }}
					transition={{ duration: 0.25 }}
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-zinc-400 dark:text-white/40"
				>
					<polyline points="6 9 12 15 18 9" />
				</motion.svg>
			</motion.button>

			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 320, opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
						className="overflow-hidden mt-3 rounded-2xl border border-zinc-300/70 dark:border-white/[0.12]"
					>
						<MapContainer
							center={allBounds[0]}
							zoom={12}
							style={{ height: 320, width: "100%" }}
							zoomControl={true}
							attributionControl={true}
						>
							<TileLayer
								attribution='&copy; <a href="https://carto.com/">CARTO</a>'
								url={tileUrl}
							/>
							<FitBounds bounds={allBounds} />
							<InvalidateOnExpand expanded={expanded} />

							{routePolylines.map((polyline, idx) => (
								<Polyline
									key={idx}
									positions={polyline.positions}
									pathOptions={{
										color: polyline.color,
										weight: 4,
										opacity: 0.8,
										dashArray: routes.length > 1 && idx > 0 ? "8 6" : undefined,
									}}
								/>
							))}

							{routePolylines.flatMap((polyline) =>
								polyline.stationPoints.map((station, sIdx) => (
									<CircleMarker
										key={`${station.name}-${sIdx}`}
										center={station.pos}
										radius={5}
										pathOptions={{
											fillColor: station.color,
											fillOpacity: 1,
											color: "#fff",
											weight: 2,
											opacity: 0.9,
										}}
									>
										<Tooltip
											direction="top"
											offset={[0, -8]}
											className="!bg-zinc-900 !text-white !text-xs !font-semibold !border-none !rounded-lg !px-2.5 !py-1.5 !shadow-lg"
										>
											{station.name}
										</Tooltip>
									</CircleMarker>
								)),
							)}
						</MapContainer>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
