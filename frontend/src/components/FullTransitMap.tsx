import { useState, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { getNetworkLines, type NetworkLineStation } from "../requests";
import { getLineHex, formatLineColor } from "../utils/colors";
import { motion, AnimatePresence } from "framer-motion";
import type { LatLngTuple } from "leaflet";

function MapController({ centerPos, zoomLevel }: { centerPos: LatLngTuple | null; zoomLevel: number }) {
	const map = useMap();
	useEffect(() => {
		if (centerPos) {
			map.flyTo(centerPos, zoomLevel, { duration: 1.2 });
		}
	}, [centerPos, zoomLevel, map]);
	return null;
}

export default function FullTransitMap() {
	const [selectedLine, setSelectedLine] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchedStation, setSearchedStation] = useState<{ name: string; pos: LatLngTuple } | null>(null);
	const [activeLines, setActiveLines] = useState<Record<string, boolean>>({});

	const { data: networkData, isLoading, isError } = useQuery({
		queryKey: ["network-lines"],
		queryFn: getNetworkLines,
		staleTime: Infinity,
	});

	const lineNames = useMemo(() => {
		if (!networkData) return [];
		return Object.keys(networkData);
	}, [networkData]);

	useEffect(() => {
		if (lineNames.length > 0 && Object.keys(activeLines).length === 0) {
			const initial: Record<string, boolean> = {};
			lineNames.forEach((l) => (initial[l] = true));
			setActiveLines(initial);
		}
	}, [lineNames, activeLines]);

	const allStationsMap = useMemo(() => {
		if (!networkData) return new Map<string, { pos: LatLngTuple; lines: string[] }>();
		const map = new Map<string, { pos: LatLngTuple; lines: string[] }>();
		Object.entries(networkData).forEach(([lineName, stations]) => {
			stations.forEach((st) => {
				const existing = map.get(st.name);
				if (existing) {
					if (!existing.lines.includes(lineName)) {
						existing.lines.push(lineName);
					}
				} else {
					map.set(st.name, { pos: [st.lat, st.lng], lines: [lineName] });
				}
			});
		});
		return map;
	}, [networkData]);

	const stationOptions = useMemo(() => {
		return Array.from(allStationsMap.keys()).sort();
	}, [allStationsMap]);

	const toggleLine = (line: string) => {
		setActiveLines((prev) => ({ ...prev, [line]: !prev[line] }));
	};

	const toggleAllLines = (enable: boolean) => {
		const updated: Record<string, boolean> = {};
		lineNames.forEach((l) => (updated[l] = enable));
		setActiveLines(updated);
	};

	const handleStationSearch = (name: string) => {
		setSearchQuery(name);
		const st = allStationsMap.get(name);
		if (st) {
			setSearchedStation({ name, pos: st.pos });
		} else {
			setSearchedStation(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center">
				<div className="w-8 h-8 border-3 border-blue-400/30 border-t-blue-500 rounded-full animate-spin mb-3" />
				<span className="text-sm font-semibold text-zinc-500 dark:text-white/50">
					Loading Transit Map…
				</span>
			</div>
		);
	}

	if (isError || !networkData) {
		return (
			<div className="p-6 text-center text-red-500 font-semibold">
				Failed to load system transit map.
			</div>
		);
	}

	const isDark = document.documentElement.classList.contains("dark");
	const tileUrl = isDark
		? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
		: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

	const defaultCenter: LatLngTuple = [28.6139, 77.209];

	return (
		<div className="space-y-4">
			<datalist id="all-transit-stations">
				{stationOptions.map((st) => (
					<option key={st} value={st} />
				))}
			</datalist>

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
				<div className="relative flex-1">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleStationSearch(e.target.value)}
						placeholder="Search station on map…"
						list="all-transit-stations"
						className="w-full py-2.5 px-4 pr-9 bg-transparent text-zinc-900 dark:text-white rounded-2xl border border-zinc-300/70 dark:border-white/[0.12] focus:border-blue-400 outline-none transition-all font-medium text-sm placeholder:text-zinc-400 dark:placeholder:text-white/30 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
					/>
					{searchQuery && (
						<button
							onClick={() => {
								setSearchQuery("");
								setSearchedStation(null);
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
						>
							✕
						</button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => toggleAllLines(true)}
						className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl border border-zinc-300/70 dark:border-white/[0.12] bg-transparent text-zinc-700 dark:text-white/70 hover:bg-zinc-200/20 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
					>
						Show All
					</button>
					<button
						onClick={() => toggleAllLines(false)}
						className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl border border-zinc-300/70 dark:border-white/[0.12] bg-transparent text-zinc-700 dark:text-white/70 hover:bg-zinc-200/20 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
					>
						Hide All
					</button>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl border border-zinc-300/70 dark:border-white/[0.12] bg-zinc-100/50 dark:bg-white/[0.04] backdrop-blur-3xl max-h-36 overflow-y-auto">
				{lineNames.map((line) => {
					const isActive = !!activeLines[line];
					const hex = getLineHex(line);
					return (
						<button
							key={line}
							onClick={() => toggleLine(line)}
							className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
								isActive
									? "border-zinc-400/50 dark:border-white/20 bg-white/80 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm"
									: "border-transparent opacity-40 hover:opacity-75 text-zinc-500 dark:text-white/50"
							}`}
						>
							<span
								className="w-2.5 h-2.5 rounded-full shrink-0"
								style={{ backgroundColor: hex }}
							/>
							<span>{line}</span>
						</button>
					);
				})}
			</div>

			<div className="overflow-hidden rounded-3xl border border-zinc-300/70 dark:border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
				<MapContainer
					center={defaultCenter}
					zoom={11}
					style={{ height: 480, width: "100%" }}
					zoomControl={true}
					attributionControl={true}
				>
					<TileLayer
						attribution='&copy; <a href="https://carto.com/">CARTO</a>'
						url={tileUrl}
					/>

					<MapController
						centerPos={searchedStation ? searchedStation.pos : null}
						zoomLevel={14}
					/>

					{Object.entries(networkData).map(([lineName, stations]) => {
						if (!activeLines[lineName]) return null;
						const hex = getLineHex(lineName);
						const positions: LatLngTuple[] = stations.map((s) => [s.lat, s.lng]);
						const isCircular = lineName.toLowerCase() === "pink line";
						if (isCircular && stations.length > 1) {
							const first = stations[0];
							const last = stations[stations.length - 1];
							if (first.lat !== last.lat || first.lng !== last.lng) {
								positions.push([first.lat, first.lng]);
							}
						}

						return (
							<Polyline
								key={lineName}
								positions={positions}
								pathOptions={{
									color: hex,
									weight: selectedLine === lineName ? 6 : 4,
									opacity: selectedLine && selectedLine !== lineName ? 0.3 : 0.85,
								}}
							/>
						);
					})}

					{Array.from(allStationsMap.entries()).map(([stName, data]) => {
						const hasActiveLine = data.lines.some((l) => activeLines[l]);
						if (!hasActiveLine) return null;

						const primaryLine = data.lines[0];
						const hex = getLineHex(primaryLine);
						const isSearched = searchedStation?.name === stName;

						return (
							<CircleMarker
								key={stName}
								center={data.pos}
								radius={isSearched ? 8 : data.lines.length > 1 ? 6 : 4}
								pathOptions={{
									fillColor: isSearched ? "#ef4444" : hex,
									fillOpacity: 1,
									color: "#ffffff",
									weight: isSearched ? 3 : 1.5,
									opacity: 1,
								}}
							>
								<Tooltip
									direction="top"
									offset={[0, -8]}
									className="!bg-zinc-900/95 !text-white !text-xs !font-medium !border-none !rounded-xl !px-3 !py-2 !shadow-xl"
								>
									<div className="space-y-1">
										<div className="font-bold text-sm text-white">{stName}</div>
										<div className="flex flex-wrap gap-1">
											{data.lines.map((l) => (
												<span
													key={l}
													className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${formatLineColor(
														l,
													)}`}
												>
													{l}
												</span>
											))}
										</div>
									</div>
								</Tooltip>
							</CircleMarker>
						);
					})}
				</MapContainer>
			</div>
		</div>
	);
}
