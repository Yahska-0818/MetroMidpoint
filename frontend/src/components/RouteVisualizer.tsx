import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchRouteInfo, getNearestStation } from "../requests";
import TransitTimeline from "./TransitTimeline";
import { useWebHaptics } from "web-haptics/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { RouteInfo } from "../types";

interface Props {
	stations: string[];
}

const statCardVariants: Variants = {
	hidden: { opacity: 0, y: 12, scale: 0.95 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { type: "spring", stiffness: 350, damping: 25 },
	},
};

const glassInput =
	"w-full py-3 px-4 bg-zinc-100/80 dark:bg-white/[0.08] text-zinc-900 dark:text-white rounded-2xl border border-zinc-300/70 dark:border-white/[0.12] focus:bg-white dark:focus:bg-white/[0.12] focus:border-zinc-400 dark:focus:border-white/20 focus:ring-0 outline-none transition-all font-medium text-[15px] placeholder:text-zinc-400 dark:placeholder:text-white/25 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

export default function RouteVisualizer({ stations }: Props) {
	const [source, setSource] = useState("");
	const [destination, setDestination] = useState("");
	const [sourceFocused, setSourceFocused] = useState(false);
	const [geoLoading, setGeoLoading] = useState(false);
	const [localError, setLocalError] = useState("");
	const [activeView, setActiveView] = useState<"fastest" | "fewest_interchanges">("fastest");
	const { trigger } = useWebHaptics();

	const handleNearestStation = () => {
		if (!navigator.geolocation) return;
		setGeoLoading(true);
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const nearest = await getNearestStation(pos.coords.latitude, pos.coords.longitude);
					setSource(nearest);
				} catch (error) {
					console.error(error);
				} finally {
					setGeoLoading(false);
				}
			},
			() => setGeoLoading(false),
		);
	};

	const fastestMutation = useMutation({
		mutationFn: () => fetchRouteInfo(source, destination, "fastest"),
		onSuccess: () => trigger([{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }]),
		onError: () => trigger([{ duration: 40 }, { delay: 40, duration: 40 }, { delay: 40, duration: 40 }], { intensity: 0.9 }),
	});

	const leastInterchangeMutation = useMutation({
		mutationFn: () => fetchRouteInfo(source, destination, "fewest_interchanges"),
	});

	const handleFindRoute = () => {
		if (!source.trim() || !destination.trim()) {
			trigger([{ duration: 40 }, { delay: 40, duration: 40 }], { intensity: 0.9 });
			setLocalError("Please select both a source and destination station.");
			return;
		}
		setLocalError("");
		trigger([{ duration: 15 }], { intensity: 0.4 });
		setActiveView("fastest");
		fastestMutation.mutate();
		leastInterchangeMutation.mutate();
	};

	const handleSwap = () => {
		setSource(destination);
		setDestination(source);
		trigger([{ duration: 15 }], { intensity: 0.4 });
	};

	const isLoading = fastestMutation.isPending || leastInterchangeMutation.isPending;
	const hasResults = fastestMutation.data || leastInterchangeMutation.data;

	const fastestRoute = fastestMutation.data;
	const leastRoute = leastInterchangeMutation.data;

	const isSameRoute =
		fastestRoute &&
		leastRoute &&
		fastestRoute.interchanges === leastRoute.interchanges &&
		fastestRoute.path.map((s) => s.name).join(",") === leastRoute.path.map((s) => s.name).join(",");

	const activeRoute: RouteInfo | undefined =
		activeView === "fastest" ? fastestRoute : leastRoute;

	return (
		<div>
			<datalist id="route-stations-list">
				{stations.map((s) => (
					<option key={s} value={s} />
				))}
			</datalist>

			<div className="relative mb-6 mt-1">
				<div className="absolute left-[15px] top-7 bottom-7 w-[2px] bg-zinc-300/60 dark:bg-white/[0.08] rounded-full z-0" />

				<div className="space-y-4 relative z-10 flex flex-col">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center border-[3px] border-white/80 dark:border-white/[0.08] shrink-0 z-10">
							<div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
						</div>
						<div className="flex-1 relative">
							<input
								type="text"
								value={source}
								onChange={(e) => {
									setLocalError("");
									setSource(e.target.value);
								}}
								placeholder="Source Station"
								list="route-stations-list"
								disabled={isLoading}
								className={glassInput}
								onFocus={() => setSourceFocused(true)}
								onBlur={() => setSourceFocused(false)}
							/>
							<AnimatePresence>
								{sourceFocused && (
									<motion.button
										initial={{ opacity: 0, y: -6, scale: 0.92 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: -6, scale: 0.92 }}
										transition={{ type: "spring", stiffness: 500, damping: 28 }}
										onMouseDown={(e) => e.preventDefault()}
										onClick={handleNearestStation}
										disabled={geoLoading}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/80 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-xl border border-blue-300/70 dark:border-blue-400/20 backdrop-blur-3xl hover:bg-blue-200/80 dark:hover:bg-blue-500/25 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
									>
										{geoLoading ? (
											<div className="w-3 h-3 border border-blue-400/40 border-t-blue-500 rounded-full animate-spin" />
										) : (
											<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
											</svg>
										)}
										Nearest
									</motion.button>
								)}
							</AnimatePresence>
						</div>
					</div>

					<div className="relative flex justify-center">
						<motion.button
							whileHover={{ scale: 1.1, rotate: 180 }}
							whileTap={{ scale: 0.85 }}
							transition={{ type: "spring", stiffness: 400, damping: 15 }}
							onClick={handleSwap}
							disabled={isLoading}
							className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100/80 dark:bg-white/[0.08] border border-zinc-300/70 dark:border-white/[0.12] hover:bg-zinc-200/80 dark:hover:bg-white/[0.14] backdrop-blur-3xl transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] disabled:opacity-50 cursor-pointer"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-500 dark:text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M7 7h11l-4-4" /><path d="M17 17H6l4 4" />
							</svg>
						</motion.button>
					</div>

					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-400/10 flex items-center justify-center border-[3px] border-white/80 dark:border-white/[0.08] shrink-0 z-10">
							<div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
						</div>
						<input
							type="text"
							value={destination}
							onChange={(e) => {
								setLocalError("");
								setDestination(e.target.value);
							}}
							placeholder="Destination Station"
							list="route-stations-list"
							disabled={isLoading}
							className={glassInput}
						/>
					</div>
				</div>
			</div>

			<motion.button
				whileHover={{ scale: isLoading ? 1 : 1.01 }}
				whileTap={{ scale: isLoading ? 1 : 0.98 }}
				onClick={handleFindRoute}
				disabled={isLoading}
				className="w-full py-3.5 bg-blue-500/90 hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-500/30 text-white rounded-2xl font-bold text-[15px] transition-all shadow-[0_8px_32px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] dark:shadow-[0_8px_32px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-400/50 dark:border-blue-400/30 cursor-pointer flex items-center justify-center gap-2 backdrop-blur-3xl"
			>
				{isLoading ? (
					<>
						<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						<span>Calculating Routes…</span>
					</>
				) : (
					"Find Route"
				)}
			</motion.button>

			<AnimatePresence>
				{localError && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
						className="overflow-hidden"
					>
						<div className="pt-4">
							<div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-600 dark:text-red-300 font-semibold text-center text-[14px]">
								{localError}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{fastestMutation.isError && !isLoading && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 400, damping: 25 }}
						className="p-4 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-600 dark:text-red-300 font-semibold text-center mt-5 text-[15px]"
					>
						{fastestMutation.error.message}
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{hasResults && !isLoading && (
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-white/10"
					>
						{!isSameRoute && (
							<div className="flex items-center gap-2 mb-5 p-1.5 bg-zinc-100/80 dark:bg-white/[0.08] rounded-2xl border border-zinc-300/70 dark:border-white/[0.12] backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">
								{(["fastest", "fewest_interchanges"] as const).map((view) => {
									const isActive = activeView === view;
									return (
										<motion.button
											key={view}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												setActiveView(view);
												trigger([{ duration: 15 }], { intensity: 0.3 });
											}}
											className="relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
										>
											{isActive && (
												<motion.div
													layoutId="route-view-bubble"
													className="absolute inset-0 bg-white/80 dark:bg-white/[0.12] rounded-xl border border-white dark:border-white/[0.18] shadow-[0_2px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
													transition={{ type: "spring", stiffness: 400, damping: 30 }}
												/>
											)}
											<span className={`relative z-10 transition-colors ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-white/35"}`}>
												{view === "fastest" ? (
													<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
														<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
													</svg>
												) : (
													<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
														<path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
													</svg>
												)}
											</span>
											<span className={`relative z-10 transition-colors ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-white/35"}`}>
												{view === "fastest" ? "Fastest" : "Fewest Changes"}
											</span>
											{view === "fewest_interchanges" && leastRoute && fastestRoute && leastRoute.interchanges < fastestRoute.interchanges && (
												<span className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-md">
													-{fastestRoute.interchanges - leastRoute.interchanges}
												</span>
											)}
											{view === "fastest" && fastestRoute && leastRoute && fastestRoute.total_time < leastRoute.total_time && (
												<span className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/25 text-blue-600 dark:text-blue-400 rounded-md">
													-{Math.round(leastRoute.total_time - fastestRoute.total_time)}m
												</span>
											)}
										</motion.button>
									);
								})}
							</div>
						)}

						{isSameRoute && (
							<div className="mb-4 text-center text-xs font-semibold text-zinc-400 dark:text-white/30 bg-zinc-100/60 dark:bg-white/[0.04] rounded-2xl py-2 px-4 border border-zinc-200/50 dark:border-white/[0.06]">
								Both routes are identical for this journey
							</div>
						)}

						<AnimatePresence mode="wait">
							{activeRoute && (
								<motion.div
									key={activeView}
									initial={{ opacity: 0, y: 6 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -6 }}
									transition={{ duration: 0.2, ease: "easeInOut" }}
								>
									<motion.div
										initial="hidden"
										animate="show"
										variants={{ show: { transition: { staggerChildren: 0.08 } } }}
										className="grid grid-cols-3 gap-3 mb-6"
									>
										<motion.div
											variants={statCardVariants}
											className="bg-blue-100/80 dark:bg-blue-500/10 rounded-2xl p-4 text-center border border-blue-300/70 dark:border-white/[0.12] backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
										>
											<div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Time</div>
											<div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
												{activeRoute.total_time}
												<span className="text-xs font-semibold text-zinc-400 dark:text-white/40 ml-0.5">min</span>
											</div>
										</motion.div>

										<motion.div
											variants={statCardVariants}
											className="bg-emerald-100/80 dark:bg-emerald-500/10 rounded-2xl p-4 text-center border border-emerald-300/70 dark:border-white/[0.12] backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
										>
											<div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Fare</div>
											<div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
												₹{activeRoute.fare}
											</div>
										</motion.div>

										<motion.div
											variants={statCardVariants}
											className="bg-violet-100/80 dark:bg-violet-500/10 rounded-2xl p-4 text-center border border-violet-300/70 dark:border-white/[0.12] backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
										>
											<div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">Changes</div>
											<div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
												{activeRoute.interchanges}
											</div>
										</motion.div>
									</motion.div>

									<div className="bg-zinc-100/80 dark:bg-white/[0.08] backdrop-blur-3xl rounded-2xl p-4 sm:p-5 border border-zinc-300/70 dark:border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
										<TransitTimeline path={activeRoute.path} />
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
