import type { ResultType } from "../types";
import { useState } from "react";
import TransitTimeline from "./TransitTimeline";
import { useWebHaptics } from "web-haptics/react";
import { motion } from "framer-motion";

const ROUTE_COLORS = [
	"border-red-500",
	"border-blue-500",
	"border-green-500",
	"border-yellow-500",
	"border-purple-500",
	"border-pink-500",
	"border-cyan-500",
];

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: { type: "spring", stiffness: 300, damping: 24 },
	},
};

export default function RouteDisplay({ result }: { result: ResultType }) {
	const [copied, setCopied] = useState(false);
	const { trigger } = useWebHaptics({});

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800"
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
				className="text-center mb-6"
			>
				<div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-200 dark:border-emerald-500/20 mb-3">
					<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
					<span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
						Optimal Meeting Point
					</span>
				</div>
				<h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
					{result.meet_station}
				</h2>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
					Max Travel Time: ~{result.max_travel_time} mins
				</p>
			</motion.div>

			<div className="flex justify-center mb-6">
				<motion.button
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.96 }}
					className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-200/60 dark:border-zinc-700/50"
					onClick={() => {
						navigator.clipboard.writeText(window.location.href);
						setCopied(true);
						setTimeout(() => setCopied(false), 1500);
						trigger([{ duration: 15 }], { intensity: 0.4 });
					}}
				>
					{copied ? "✓ Copied" : "Copy Link"}
				</motion.button>
			</div>

			<div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 sm:p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 max-h-[600px] overflow-y-auto">
				{!result.routes || result.routes.length === 0 ? (
					<div className="text-center text-zinc-400 dark:text-zinc-500 font-medium py-4">
						Optimal route not available for this combination.
					</div>
				) : (
					<motion.div
						variants={containerVariants}
						initial="hidden"
						animate="show"
						className={`grid grid-cols-1 ${result.routes.length > 1 ? "md:grid-cols-2" : ""} lg:grid-cols-${Math.min(result.routes.length, 3)} gap-5`}
					>
						{result.routes.map((routeData, idx) => (
							<motion.div
								key={idx}
								variants={itemVariants}
								className={`border-l-[3px] pl-4 ${ROUTE_COLORS[idx % ROUTE_COLORS.length]}`}
							>
								<div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-700/50">
									<h3 className="text-[15px] font-bold text-zinc-800 dark:text-white">
										Person {idx + 1}
									</h3>
									<span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-500/20">
										₹{routeData.fare}
									</span>
								</div>
								<TransitTimeline path={routeData.path} />
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}
