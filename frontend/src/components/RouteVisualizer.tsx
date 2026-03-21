import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchRouteInfo, getNearestStation } from "../requests";
import TransitTimeline from "./TransitTimeline";
import { useWebHaptics } from "web-haptics/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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
	"w-full py-3 px-4 bg-white/70 dark:bg-white/[0.05] text-zinc-900 dark:text-white rounded-2xl border border-zinc-200/80 dark:border-white/10 focus:bg-white/90 dark:focus:bg-white/[0.09] focus:border-blue-300 dark:focus:border-white/25 focus:ring-0 outline-none transition-all font-medium text-[15px] placeholder:text-zinc-400 dark:placeholder:text-white/25 backdrop-blur-sm";

export default function RouteVisualizer({ stations }: Props) {
	const [source, setSource] = useState("");
	const [destination, setDestination] = useState("");
	const [sourceFocused, setSourceFocused] = useState(false);
	const [geoLoading, setGeoLoading] = useState(false);
	const { trigger } = useWebHaptics();

	const handleNearestStation = () => {
		if (!navigator.geolocation) return;
		setGeoLoading(true);
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const nearest = await getNearestStation(pos.coords.latitude, pos.coords.longitude);
					setSource(nearest);
				} catch {
					// silently fail
				} finally {
					setGeoLoading(false);
				}
			},
			() => setGeoLoading(false),
		);
	};

	const routeMutation = useMutation({
		mutationFn: () => fetchRouteInfo(source, destination),
		onSuccess: () => {
			trigger([{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }]);
		},
		onError: () => {
			trigger(
				[{ duration: 40 }, { delay: 40, duration: 40 }, { delay: 40, duration: 40 }],
				{ intensity: 0.9 },
			);
		},
	});

	const handleSwap = () => {
		setSource(destination);
		setDestination(source);
		trigger([{ duration: 15 }], { intensity: 0.4 });
	};

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
								onChange={(e) => setSource(e.target.value)}
								placeholder="Source Station"
								list="route-stations-list"
								disabled={routeMutation.isPending}
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
										className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/90 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-xl border border-blue-200/70 dark:border-blue-400/20 backdrop-blur-sm hover:bg-blue-100/90 dark:hover:bg-blue-500/25 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
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
							disabled={routeMutation.isPending}
							className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.12] backdrop-blur-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
							onChange={(e) => setDestination(e.target.value)}
							placeholder="Destination Station"
							list="route-stations-list"
							disabled={routeMutation.isPending}
							className={glassInput}
						/>
					</div>
				</div>
			</div>

			<motion.button
				whileHover={{ scale: routeMutation.isPending ? 1 : 1.01 }}
				whileTap={{ scale: routeMutation.isPending ? 1 : 0.98 }}
				onClick={() => {
					trigger([{ duration: 15 }], { intensity: 0.4 });
					if (source.trim() && destination.trim()) {
						routeMutation.mutate();
					}
				}}
				disabled={routeMutation.isPending}
				className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-300 dark:disabled:bg-blue-500/30 text-white rounded-2xl font-bold text-[15px] transition-all shadow-[0_4px_20px_rgba(59,130,246,0.35)] dark:shadow-[0_0_24px_rgba(59,130,246,0.3)] border border-blue-400/30 cursor-pointer flex items-center justify-center gap-2"
			>
				{routeMutation.isPending ? (
					<>
						<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						<span>Calculating Route…</span>
					</>
				) : (
					"Find Route"
				)}
			</motion.button>

			<AnimatePresence>
				{routeMutation.isError && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 400, damping: 25 }}
						className="p-4 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-600 dark:text-red-300 font-semibold text-center mt-5 text-[15px]"
					>
						{routeMutation.error.message}
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{routeMutation.data && !routeMutation.isPending && (
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-white/10"
					>
						<motion.div
							initial="hidden"
							animate="show"
							variants={{ show: { transition: { staggerChildren: 0.08 } } }}
							className="grid grid-cols-3 gap-3 mb-6"
						>
							<motion.div
								variants={statCardVariants}
								className="bg-blue-50/80 dark:bg-blue-500/10 rounded-2xl p-4 text-center border border-blue-200/60 dark:border-blue-400/15 backdrop-blur-sm"
							>
								<div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Time</div>
								<div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
									{routeMutation.data.total_time}
									<span className="text-xs font-semibold text-zinc-400 dark:text-white/40 ml-0.5">min</span>
								</div>
							</motion.div>

							<motion.div
								variants={statCardVariants}
								className="bg-emerald-50/80 dark:bg-emerald-500/10 rounded-2xl p-4 text-center border border-emerald-200/60 dark:border-emerald-400/15 backdrop-blur-sm"
							>
								<div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Fare</div>
								<div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
									₹{routeMutation.data.fare}
								</div>
							</motion.div>

							<motion.div
								variants={statCardVariants}
								className="bg-violet-50/80 dark:bg-violet-500/10 rounded-2xl p-4 text-center border border-violet-200/60 dark:border-violet-400/15 backdrop-blur-sm"
							>
								<div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">Changes</div>
								<div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
									{routeMutation.data.interchanges}
								</div>
							</motion.div>
						</motion.div>

						<div className="bg-zinc-100/60 dark:bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-zinc-200/60 dark:border-white/[0.08]">
							<TransitTimeline path={routeMutation.data.path} />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
