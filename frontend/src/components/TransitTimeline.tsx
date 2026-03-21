import { motion, type Variants } from "framer-motion";
import type { RouteStep } from "../types";
import { formatLineColor } from "../utils/colors";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.06,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 12 },
	show: {
		opacity: 1,
		y: 0,
		transition: { type: "spring", stiffness: 350, damping: 26 },
	},
};

export default function TransitTimeline({ path }: { path: RouteStep[] }) {
	return (
		<div className="relative pt-1">
			<div className="absolute left-[15px] top-5 bottom-5 w-[2px] bg-zinc-200 dark:bg-zinc-700/50 z-0 rounded-full" />

			<motion.ul
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="space-y-0.5 relative z-10"
			>
				{path.map((step, i, arr) => {
					const colorClasses = formatLineColor(step.line);
					const isInterchange =
						i > 0 &&
						arr[i - 1].name === step.name &&
						arr[i - 1].line !== step.line;

					if (isInterchange) {
						return (
							<motion.div
								key={`interchange-${i}`}
								variants={itemVariants}
								className="my-3 ml-9 mr-1 p-2.5 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg shadow-sm relative z-10 w-fit px-5"
							>
								Change to {step.line}
							</motion.div>
						);
					}

					return (
						<motion.li
							key={`step-${i}`}
							variants={itemVariants}
							whileHover={{ x: 3, backgroundColor: "rgba(0,0,0,0.02)" }}
							transition={{ duration: 0.15 }}
							className="group p-2 flex items-center gap-3 rounded-lg relative z-10 cursor-default"
						>
							<div className="relative flex items-center justify-center w-[22px] h-[22px] shrink-0 bg-white dark:bg-zinc-900 rounded-full z-10">
								<div
									className={`w-3 h-3 rounded-full shadow-sm ${colorClasses.split(" ").pop()}`}
								/>
							</div>

							<div className="flex items-center gap-2.5 min-w-0">
								<span
									className={`text-[10px] px-2.5 py-0.5 rounded-md whitespace-nowrap font-bold border shadow-sm ${colorClasses}`}
								>
									{step.line}
								</span>
								<span className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm truncate">
									{step.name}
								</span>
							</div>
						</motion.li>
					);
				})}
			</motion.ul>
		</div>
	);
}
