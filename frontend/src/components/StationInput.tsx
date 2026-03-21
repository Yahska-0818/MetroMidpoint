import { motion, AnimatePresence } from "framer-motion";
import { useWebHaptics } from "web-haptics/react";

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

	return (
		<div>
			<datalist id="stations-list">
				{stations.map((s) => (
					<option key={s} value={s} />
				))}
			</datalist>

			<div className="relative mb-5">
				<div className="absolute left-[15px] top-7 bottom-7 w-[2px] bg-zinc-200 dark:bg-zinc-700/60 rounded-full z-0" />

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
								<div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border-[3px] border-white dark:border-zinc-900 shrink-0 z-10">
									<div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
								</div>
								<div className="flex-1">
									<input
										value={val}
										onChange={(e) => onInputChange(idx, e.target.value)}
										placeholder={`Station ${idx + 1}`}
										list="stations-list"
										disabled={loading}
										className="w-full py-3 px-4 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-[3px] focus:ring-blue-500/10 outline-none transition-all font-medium text-[15px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
									/>
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
										className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
											<line x1="18" y1="6" x2="6" y2="18" />
											<line x1="6" y1="6" x2="18" y2="18" />
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
					className="flex-1 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm border border-zinc-200/60 dark:border-zinc-700/50"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
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
						className="flex-1 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm border border-zinc-200/60 dark:border-zinc-700/50"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="16 3 21 3 21 8" />
							<line x1="4" y1="20" x2="21" y2="3" />
							<polyline points="21 16 21 21 16 21" />
							<line x1="15" y1="15" x2="21" y2="21" />
							<line x1="4" y1="4" x2="9" y2="9" />
						</svg>
						Swap
					</motion.button>
				)}
			</div>
			<motion.button
				whileHover={{ scale: loading ? 1 : 1.01 }}
				whileTap={{ scale: loading ? 1 : 0.98 }}
				onClick={() => {
					onSubmit();
					trigger([{ duration: 15 }], { intensity: 0.4 });
				}}
				disabled={loading}
				className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[15px] transition-all disabled:bg-blue-600/50 shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
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
		</div>
	);
}
