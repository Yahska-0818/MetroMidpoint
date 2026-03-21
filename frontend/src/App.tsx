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
				[
					{ duration: 40 },
					{ delay: 40, duration: 40 },
					{ delay: 40, duration: 40 },
				],
				{ intensity: 0.9 },
			);
		},
	});
	const stations = fetchedStations.data ?? [];
	const updateUrl = (currentInputs: string[]) => {
		const params = new URLSearchParams(window.location.search);
		params.set("stations", currentInputs.filter(Boolean).join(","));
		window.history.replaceState(
			{},
			"",
			`${window.location.pathname}?${params.toString()}`,
		);
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
			const temp = newInputs[0];
			newInputs[0] = newInputs[1];
			newInputs[1] = temp;
			setInputs(newInputs);
			updateUrl(newInputs);
		}
	};

	if (fetchedStations.isPending) {
		return (
			<div
				className={`min-h-screen p-4 sm:p-8 font-sans ${darkMode ? "dark bg-zinc-950" : "bg-zinc-100"}`}
			>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="max-w-2xl mx-auto"
				>
					<div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
						<div className="space-y-4">
							<div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
							<div className="h-12 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
							<div className="h-12 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
							<div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
						</div>
						<p className="text-center text-sm text-zinc-400 dark:text-zinc-500 mt-6 font-medium">
							Loading stations…
						</p>
					</div>
				</motion.div>
			</div>
		);
	}

	if (fetchedStations.isError) {
		return (
			<div
				className={`min-h-screen p-4 sm:p-8 font-sans ${darkMode ? "dark bg-zinc-950" : "bg-zinc-100"}`}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
					className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm"
				>
					<div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-center font-semibold border border-red-200 dark:border-red-900/50 text-[15px]">
						Failed to load stations. Please refresh the page.
					</div>
				</motion.div>
			</div>
		);
	}

	return (
		<div
			className={`min-h-screen pb-24 p-4 sm:p-8 font-sans transition-colors duration-300 ${darkMode ? "dark bg-zinc-950" : "bg-zinc-100"}`}
		>
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm transition-colors duration-300"
			>
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
						MetroMidpoint
					</h1>
					<motion.button
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.96 }}
						className="p-2.5 rounded-xl cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
						onClick={() => {
							setDarkMode(!darkMode);
							trigger([{ duration: 40 }], { intensity: 0.4 });
						}}
						aria-label="Toggle theme"
					>
						{darkMode ? (
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="5" />
								<line x1="12" y1="1" x2="12" y2="3" />
								<line x1="12" y1="21" x2="12" y2="23" />
								<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
								<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
								<line x1="1" y1="12" x2="3" y2="12" />
								<line x1="21" y1="12" x2="23" y2="12" />
								<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
								<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
										<div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
										<span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
										className="mt-6 p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-center font-semibold border border-red-200 dark:border-red-900/50 text-[15px]"
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

			<div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-50">
				<div className="max-w-md mx-auto flex relative">
					<motion.div
						className="absolute bottom-0 h-0.5 bg-blue-500 rounded-full"
						layoutId="tab-indicator"
						style={{ width: "50%" }}
						animate={{ x: activeTab === "meetup" ? "0%" : "100%" }}
						transition={{ type: "spring", stiffness: 400, damping: 30 }}
					/>

					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => {
							if (activeTab !== "meetup") {
								setActiveTab("meetup");
								trigger([{ duration: 15 }], { intensity: 0.4 });
							}
						}}
						className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
							activeTab === "meetup"
								? "text-blue-600 dark:text-blue-400"
								: "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
						}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
						<span className="text-[11px] font-semibold">Find Meetup</span>
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => {
							if (activeTab !== "route") {
								setActiveTab("route");
								trigger([{ duration: 15 }], { intensity: 0.4 });
							}
						}}
						className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
							activeTab === "route"
								? "text-blue-600 dark:text-blue-400"
								: "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
						}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<polygon points="3 11 22 2 13 21 11 13 3 11" />
						</svg>
						<span className="text-[11px] font-semibold">Route Planner</span>
					</motion.button>
				</div>
			</div>
		</div>
	);
}
