import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchRouteInfo } from "../requests";
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
	"w-full py-3 px-4 bg-white/[0.07] dark:bg-white/[0.05] text-zinc-900 dark:text-white rounded-2xl border border-white/30 dark:border-white/10 focus:bg-white/[0.12] dark:focus:bg-white/[0.09] focus:border-white/50 dark:focus:border-white/25 focus:ring-0 outline-none transition-all font-medium text-[15px] placeholder:text-zinc-400 dark:placeholder:text-white/25 backdrop-blur-sm";

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
				<div className="absolute left-[15px] top-7 bottom-7 w-[2px] bg-white/10 dark:bg-white/[0.08] rounded-full z-0" />

				<div className="space-y-4 relative z-10 flex flex-col">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-blue-500/15 dark:bg-blue-400/10 flex items-center justify-center border-[3px] border-white/20 dark:border-white/[0.08] shrink-0 z-10">
							<div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
						</div>
						<input
							type="text"
							value={source}
							onChange={(e) => setSource(e.target.value)}
							placeholder="Source Station"
							list="route-stations-list"
							disabled={routeMutation.isPending}
							className={glassInput}
						/>
					</div>

					<div className="relative flex justify-center">
						<motion.button
							whileHover={{ scale: 1.1, rotate: 180 }}
							whileTap={{ scale: 0.85 }}
							transition={{ type: "spring", stiffness: 400, damping: 15 }}
							onClick={handleSwap}
							disabled={routeMutation.isPending}
							className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] dark:bg-white/[0.06] border border-white/25 dark:border-white/10 hover:bg-white/[0.15] dark:hover:bg-white/[0.12] backdrop-blur-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M7 7h11l-4-4" /><path d="M17 17H6l4 4" />
							</svg>
						</motion.button>
					</div>

					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-red-500/15 dark:bg-red-400/10 flex items-center justify-center border-[3px] border-white/20 dark:border-white/[0.08] shrink-0 z-10">
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
				className="w-full py-3.5 bg-blue-500/80 hover:bg-blue-400/90 disabled:bg-blue-500/30 text-white rounded-2xl font-bold text-[15px] transition-all shadow-[0_0_24px_rgba(59,130,246,0.3)] border border-blue-400/30 backdrop-blur-sm cursor-pointer flex items-center justify-center gap-2"
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
						className="p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 font-semibold text-center mt-5 text-[15px]"
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
						className="mt-8 pt-6 border-t border-white/10"
					>
						<motion.div
							initial="hidden"
							animate="show"
							variants={{ show: { transition: { staggerChildren: 0.08 } } }}
							className="grid grid-cols-3 gap-3 mb-6"
						>
							<motion.div
								variants={statCardVariants}
								className="bg-blue-500/10 rounded-2xl p-4 text-center border border-blue-400/15 backdrop-blur-sm"
							>
								<div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Time</div>
								<div className="text-2xl font-extrabold text-white">
									{routeMutation.data.total_time}
									<span className="text-xs font-semibold text-white/40 ml-0.5">min</span>
								</div>
							</motion.div>

							<motion.div
								variants={statCardVariants}
								className="bg-emerald-500/10 rounded-2xl p-4 text-center border border-emerald-400/15 backdrop-blur-sm"
							>
								<div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Fare</div>
								<div className="text-2xl font-extrabold text-white">
									₹{routeMutation.data.fare}
								</div>
							</motion.div>

							<motion.div
								variants={statCardVariants}
								className="bg-violet-500/10 rounded-2xl p-4 text-center border border-violet-400/15 backdrop-blur-sm"
							>
								<div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Changes</div>
								<div className="text-2xl font-extrabold text-white">
									{routeMutation.data.interchanges}
								</div>
							</motion.div>
						</motion.div>

						<div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
							<TransitTimeline path={routeMutation.data.path} />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
