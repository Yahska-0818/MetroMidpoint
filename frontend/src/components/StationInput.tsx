import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebHaptics } from "web-haptics/react";
import { getNearestStation } from "../requests";

type Props = {
	inputs: string[];
	stations: string[];
	loading: boolean;
	onInputChange: (index: number, value: string) => void;
	onAddPerson: () => void;
	onRemovePerson: (index: number) => void;
	onSwap: () => void;
	onSubmit: () => void;
};

const glassInput =
	"w-full py-3 px-4 bg-white/70 dark:bg-white/[0.05] text-zinc-900 dark:text-white rounded-2xl border border-zinc-200/80 dark:border-white/10 focus:bg-white/90 dark:focus:bg-white/[0.09] focus:border-blue-300 dark:focus:border-white/25 focus:ring-0 outline-none transition-all font-medium text-[15px] placeholder:text-zinc-400 dark:placeholder:text-white/25 backdrop-blur-sm";

const glassBtn =
	"flex-1 py-2.5 px-4 bg-zinc-200/60 dark:bg-white/[0.05] text-zinc-700 dark:text-white/80 rounded-2xl font-semibold hover:bg-zinc-300/60 dark:hover:bg-white/[0.10] transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm border border-zinc-300/60 dark:border-white/10 backdrop-blur-sm";

export default function StationInput({
	inputs,
	stations,
	loading,
	onInputChange,
	onAddPerson,
	onRemovePerson,
	onSwap,
	onSubmit,
}: Props) {
	const { trigger } = useWebHaptics();
	const [firstInputFocused, setFirstInputFocused] = useState(false);
	const [geoLoading, setGeoLoading] = useState(false);
	const [localError, setLocalError] = useState("");

	const handleInputChange = (index: number, value: string) => {
		setLocalError("");
		onInputChange(index, value);
	};

	const handleNearestStation = () => {
		if (!navigator.geolocation) return;
		setGeoLoading(true);
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const nearest = await getNearestStation(pos.coords.latitude, pos.coords.longitude);
					handleInputChange(0, nearest);
				} catch {
				} finally {
					setGeoLoading(false);
				}
			},
			() => setGeoLoading(false),
		);
	};

	return (
		<div>
			<datalist id="stations-list">
				{stations.map((s) => (
					<option key={s} value={s} />
				))}
			</datalist>

			<div className="relative mb-5">
				<div className="absolute left-[15px] top-7 bottom-7 w-[2px] bg-zinc-300/60 dark:bg-white/[0.08] rounded-full z-0" />

				<div className="space-y-3 relative z-10">
					<AnimatePresence initial={false}>
						{inputs.map((val, idx) => (
							<motion.div
								key={idx}
								layout
								initial={{ opacity: 0, height: 0, scale: 0.95 }}
								animate={{ opacity: 1, height: "auto", scale: 1 }}
								exit={{ opacity: 0, height: 0, scale: 0.95 }}
								transition={{
									opacity: { duration: 0.2 },
									height: { duration: 0.25 },
									scale: { type: "spring", stiffness: 400, damping: 25 },
									layout: { type: "spring", stiffness: 400, damping: 30 },
								}}
								className="flex items-center gap-3"
							>
								<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center border-[3px] border-white/80 dark:border-white/[0.08] shrink-0 z-10">
									<div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
								</div>
								<div className="flex-1 relative">
									<input
										value={val}
										onChange={(e) => handleInputChange(idx, e.target.value)}
										placeholder={`Station ${idx + 1}`}
										list="stations-list"
										disabled={loading}
										className={glassInput}
										onFocus={() => idx === 0 && setFirstInputFocused(true)}
										onBlur={() => idx === 0 && setFirstInputFocused(false)}
									/>
									<AnimatePresence>
										{idx === 0 && firstInputFocused && (
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
								{inputs.length > 2 && (
									<motion.button
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.5 }}
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.85 }}
										onClick={() => {
											onRemovePerson(idx);
											trigger([{ duration: 15 }], { intensity: 0.4 });
										}}
										disabled={loading}
										className="p-2 text-zinc-400 dark:text-white/30 hover:text-red-500 hover:bg-red-100/60 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
											<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
										</svg>
									</motion.button>
								)}
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>

			<div className="flex gap-2.5 mb-4">
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => {
						onAddPerson();
						trigger([{ duration: 15 }], { intensity: 0.4 });
					}}
					disabled={loading}
					className={glassBtn}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Add Person
				</motion.button>
				{inputs.length === 2 && (
					<motion.button
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.97 }}
						onClick={() => {
							onSwap();
							trigger([{ duration: 15 }], { intensity: 0.4 });
						}}
						disabled={loading}
						className={glassBtn}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
						</svg>
						Swap
					</motion.button>
				)}
			</div>

			<motion.button
				whileHover={{ scale: loading ? 1 : 1.01 }}
				whileTap={{ scale: loading ? 1 : 0.98 }}
				onClick={() => {
					const validCount = inputs.filter((s) => s.trim()).length;
					if (validCount < 2) {
						trigger([{ duration: 40 }, { delay: 40, duration: 40 }], { intensity: 0.9 });
						setLocalError("Please fill in at least two stations to find a meetup.");
						return;
					}
					setLocalError("");
					onSubmit();
					trigger([{ duration: 15 }], { intensity: 0.4 });
				}}
				disabled={loading}
				className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-300 dark:disabled:bg-blue-500/30 text-white rounded-2xl font-bold text-[15px] transition-all shadow-[0_4px_20px_rgba(59,130,246,0.35)] dark:shadow-[0_0_24px_rgba(59,130,246,0.3)] border border-blue-400/30 cursor-pointer flex items-center justify-center gap-2"
			>
				{loading ? (
					<>
						<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						<span>Calculating…</span>
					</>
				) : (
					"Find Meetup"
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
		</div>
	);
}
