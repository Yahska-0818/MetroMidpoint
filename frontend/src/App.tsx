import { useState, useEffect } from "react";
import StationInput from "./components/StationInput";
import RouteDisplay from "./components/RouteDisplay";
import RouteVisualizer from "./components/RouteVisualizer";
import { useWebHaptics } from "web-haptics/react";
import { findMeetupInfo, getStations } from "./requests";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
	const [activeTab, setActiveTab] = useState<"meetup" | "route">("meetup");
	const [inputs, setInputs] = useState<string[]>(() => {
		const params = new URLSearchParams(window.location.search);
		const urlStations = params.get("stations");
		return urlStations ? urlStations.split(",") : ["", ""];
	});
	const [darkMode, setDarkMode] = useState(() => {
		const saved = localStorage.getItem("theme");
		return saved !== null ? saved === "dark" : true;
	});
	const { trigger } = useWebHaptics();

	useEffect(() => {
		localStorage.setItem("theme", darkMode ? "dark" : "light");
	}, [darkMode]);

	const fetchedStations = useQuery({
		queryKey: ["stations"],
		queryFn: getStations,
	});

	const fetchMidpointMutation = useMutation({
		mutationFn: findMeetupInfo,
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

	const stations = fetchedStations.data ?? [];

	const updateUrl = (currentInputs: string[]) => {
		const params = new URLSearchParams(window.location.search);
		params.set("stations", currentInputs.filter(Boolean).join(","));
		window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
	};

	const handleInputChange = (index: number, value: string) => {
		const newInputs = [...inputs];
		newInputs[index] = value;
		setInputs(newInputs);
		updateUrl(newInputs);
	};

	const addPerson = () => setInputs([...inputs, ""]);

	const removePerson = (index: number) => {
		const newInputs = inputs.filter((_, i) => i !== index);
		setInputs(newInputs);
		updateUrl(newInputs);
	};

	const swapStations = () => {
		if (inputs.length >= 2) {
			const newInputs = [...inputs];
			[newInputs[0], newInputs[1]] = [newInputs[1], newInputs[0]];
			setInputs(newInputs);
			updateUrl(newInputs);
		}
	};

	const pageBase = darkMode
		? "dark bg-gradient-to-br from-[#060612] via-[#0d0a23] to-[#120820]"
		: "bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100";

	const glassCard =
		"relative bg-white/60 dark:bg-white/[0.05] backdrop-blur-3xl border border-white/80 dark:border-white/[0.1] shadow-[0_16px_64px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_16px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] rounded-3xl";

	if (fetchedStations.isPending) {
		return (
			<div className={`min-h-screen p-4 sm:p-8 font-sans ${pageBase}`}>
				<Orbs />
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className={`max-w-2xl mx-auto ${glassCard} p-6`}
				>
					<InnerHighlight />
					<div className="space-y-4">
						<div className="h-7 w-44 bg-zinc-200/80 dark:bg-white/10 rounded-xl animate-pulse" />
						<div className="h-12 w-full bg-zinc-100/80 dark:bg-white/[0.08] rounded-2xl animate-pulse" />
						<div className="h-12 w-full bg-zinc-100/80 dark:bg-white/[0.08] rounded-2xl animate-pulse" />
						<div className="h-12 w-full bg-zinc-200/80 dark:bg-white/10 rounded-2xl animate-pulse" />
					</div>
					<p className="text-center text-sm text-zinc-400 dark:text-white/40 mt-6 font-medium">Loading stations…</p>
				</motion.div>
			</div>
		);
	}

	if (fetchedStations.isError) {
		return (
			<div className={`min-h-screen p-4 sm:p-8 font-sans ${pageBase}`}>
				<Orbs />
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
					className={`max-w-2xl mx-auto ${glassCard} p-6`}
				>
					<InnerHighlight />
					<div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-600 dark:text-red-300 text-center font-semibold text-[15px]">
						Failed to load stations. Please refresh the page.
					</div>
				</motion.div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen pb-36 p-4 sm:p-8 font-sans transition-colors duration-500 ${pageBase}`}>
			<Orbs />

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className={`max-w-2xl mx-auto ${glassCard} p-5 sm:p-6`}
			>
				<InnerHighlight />

				<div className="flex items-center justify-between mb-6">
					<h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
						MetroMidpoint
					</h1>
					<motion.button
						whileHover={{ scale: 1.06 }}
						whileTap={{ scale: 0.92 }}
						className="p-2.5 rounded-2xl cursor-pointer bg-zinc-200/60 dark:bg-white/[0.07] border border-zinc-300/60 dark:border-white/10 text-zinc-600 dark:text-white/70 hover:bg-zinc-300/60 dark:hover:bg-white/[0.12] backdrop-blur-sm transition-colors"
						onClick={() => {
							setDarkMode(!darkMode);
							trigger([{ duration: 40 }], { intensity: 0.4 });
						}}
						aria-label="Toggle theme"
					>
						{darkMode ? (
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
							</svg>
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
							</svg>
						)}
					</motion.button>
				</div>

				<AnimatePresence mode="wait">
					{activeTab === "meetup" ? (
						<motion.div
							key="meetup"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
						>
							<StationInput
								inputs={inputs}
								stations={stations}
								loading={fetchMidpointMutation.isPending}
								onInputChange={handleInputChange}
								onAddPerson={addPerson}
								onRemovePerson={removePerson}
								onSwap={swapStations}
								onSubmit={() => {
									const validInputs = inputs.filter((i) => i.trim() !== "");
									if (validInputs.length < 2) return;
									updateUrl(validInputs);
									fetchMidpointMutation.mutate(validInputs);
								}}
							/>

							<AnimatePresence mode="wait">
								{fetchMidpointMutation.isPending && (
									<motion.div
										key="loading"
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -4 }}
										className="mt-6 flex items-center justify-center gap-3"
									>
										<div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin" />
										<span className="text-sm font-medium text-zinc-500 dark:text-white/50">
											Locating optimal meetup station…
										</span>
									</motion.div>
								)}

								{fetchMidpointMutation.isError && !fetchMidpointMutation.isPending && (
									<motion.div
										key="error"
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										transition={{ type: "spring", stiffness: 400, damping: 25 }}
										className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-600 dark:text-red-300 text-center font-semibold text-[15px]"
									>
										{fetchMidpointMutation.error.message}
									</motion.div>
								)}

								{fetchMidpointMutation.data && !fetchMidpointMutation.isPending && (
									<motion.div
										key="results"
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.4, ease: "easeOut" }}
									>
										<RouteDisplay result={fetchMidpointMutation.data} />
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					) : (
						<motion.div
							key="route"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
						>
							<RouteVisualizer stations={stations} />
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			<div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
				<div className="flex items-center gap-1 p-1.5 bg-zinc-100/80 dark:bg-white/[0.08] backdrop-blur-3xl border border-zinc-300/70 dark:border-white/[0.12] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">

					{(["meetup", "route"] as const).map((tab) => {
						const isActive = activeTab === tab;
						return (
							<motion.button
								key={tab}
								whileTap={{ scale: 0.92 }}
								onClick={() => {
									if (activeTab !== tab) {
										setActiveTab(tab);
										trigger([{ duration: 15 }], { intensity: 0.4 });
									}
								}}
								className="relative flex items-center gap-2.5 px-5 py-3 rounded-2xl cursor-pointer transition-colors"
							>
								{isActive && (
									<motion.div
										layoutId="tab-bubble"
										className="absolute inset-0 bg-white/80 dark:bg-white/[0.12] rounded-2xl border border-white dark:border-white/[0.18] shadow-[0_2px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
										transition={{ type: "spring", stiffness: 400, damping: 30 }}
									/>
								)}
								<span className={`relative z-10 transition-colors ${isActive ? "text-blue-600 dark:text-white" : "text-zinc-400 dark:text-white/35 hover:text-zinc-600 dark:hover:text-white/60"}`}>
									{tab === "meetup" ? (
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<polygon points="3 11 22 2 13 21 11 13 3 11" />
										</svg>
									)}
								</span>
								<span className={`relative z-10 text-[13px] font-semibold transition-colors ${isActive ? "text-blue-600 dark:text-white" : "text-zinc-400 dark:text-white/35 hover:text-zinc-600 dark:hover:text-white/60"}`}>
									{tab === "meetup" ? "Find Meetup" : "Route Planner"}
								</span>
							</motion.button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function Orbs() {
	return (
		<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
			<div className="orb-a absolute -top-32 -left-32 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/20 rounded-full blur-[100px]" />
			<div className="orb-b absolute top-1/2 -right-48 w-[28rem] h-[28rem] bg-blue-400/15 dark:bg-blue-500/15 rounded-full blur-[120px]" />
			<div className="orb-c absolute -bottom-24 left-1/4 w-80 h-80 bg-indigo-400/15 dark:bg-indigo-400/12 rounded-full blur-[90px]" />
		</div>
	);
}

function InnerHighlight() {
	return (
		<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/15 to-transparent rounded-t-3xl pointer-events-none" />
	);
}
