import { motion, type Variants } from "framer-motion";
import type { RouteStep } from "../types";
import { formatLineColor, getLineHex } from "../utils/colors";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.05 },
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, x: -6 },
	show: {
		opacity: 1,
		x: 0,
		transition: { type: "spring", stiffness: 350, damping: 26 },
	},
};

interface Segment {
	line: string;
	steps: RouteStep[];
}

function buildSegments(path: RouteStep[]): Segment[] {
	const segments: Segment[] = [];
	let current: Segment | null = null;
	for (let i = 0; i < path.length; i++) {
		const step = path[i];
		const prev = path[i - 1];
		const isInterchange = i > 0 && prev.name === step.name && prev.line !== step.line;
		if (!current || isInterchange) {
			current = { line: step.line, steps: [] };
			segments.push(current);
		}
		current.steps.push(step);
	}
	return segments;
}

export default function TransitTimeline({ path }: { path: RouteStep[] }) {
	const segments = buildSegments(path);
	const totalStations = segments.reduce((acc, s) => acc + s.steps.length, 0);
	let globalStationIndex = 0;

	return (
		<motion.div variants={containerVariants} initial="hidden" animate="show">
			{segments.map((segment, segIdx) => {
				const hex = getLineHex(segment.line);
				const badgeClasses = formatLineColor(segment.line);
				const isFirstSegment = segIdx === 0;

				return (
					<div key={`seg-${segIdx}`}>
						<motion.div
							variants={itemVariants}
							className="flex items-center gap-3 py-1.5"
						>
							<div className="w-8 flex justify-center shrink-0">
								{!isFirstSegment && (
									<div
										className="w-[2px] h-4 rounded-full"
										style={{ backgroundColor: hex }}
									/>
								)}
							</div>
							<span className={`text-[10px] px-2.5 py-0.5 rounded-md whitespace-nowrap font-bold border shadow-sm ${badgeClasses}`}>
								{segment.line}
							</span>
						</motion.div>

						{segment.steps.map((step, stepIdx) => {
							const isFirstInSegment = stepIdx === 0;
							const isLastInSegment = stepIdx === segment.steps.length - 1;
							const isLastSegment = segIdx === segments.length - 1;
							const isVeryLast = isLastSegment && isLastInSegment;
							const dotColor = isVeryLast ? "#10b981" : hex;

							globalStationIndex++;
							const stationIndex = globalStationIndex;

							return (
								<motion.div
									key={`${segIdx}-${stepIdx}`}
									variants={itemVariants}
									whileHover={{ x: 4 }}
									transition={{ duration: 0.12 }}
									className="flex items-stretch gap-3 cursor-default group"
								>
									<div className="w-8 flex flex-col items-center shrink-0">
										<div
											className="flex-1 w-[2px] min-h-[8px]"
											style={{
												backgroundColor:
													!isFirstInSegment || !isFirstSegment
														? hex
														: "transparent",
											}}
										/>
										<div
											className="w-3 h-3 rounded-full shrink-0 border-2 border-white dark:border-zinc-900 shadow-sm"
											style={{ backgroundColor: dotColor }}
										/>
										<div
											className="flex-1 w-[2px] min-h-[8px]"
											style={{
												backgroundColor: (!isLastInSegment || !isLastSegment) && stationIndex < totalStations ? hex : "transparent",
											}}
										/>
									</div>

									<div className="flex items-center py-1.5 min-w-0">
										<span className="text-zinc-900 dark:text-zinc-100 font-medium text-sm">
											{step.name}
										</span>
									</div>
								</motion.div>
							);
						})}
					</div>
				);
			})}
		</motion.div>
	);
}
