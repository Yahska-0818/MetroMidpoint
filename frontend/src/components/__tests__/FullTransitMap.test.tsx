import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FullTransitMap from "../FullTransitMap";
import { getNetworkLines } from "../../requests";

vi.mock("../../requests", () => ({
	getNetworkLines: vi.fn(),
	getStationCoordinates: vi.fn(),
}));

vi.mock("leaflet", () => ({
	default: {
		latLngBounds: (bounds: any) => ({
			bounds,
			isValid: () => true,
		}),
	},
}));

vi.mock("framer-motion", () => ({
	motion: {
		button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
		div: ({ children, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("react-leaflet", () => ({
	MapContainer: ({ children }: any) => <div data-testid="full-map-container">{children}</div>,
	TileLayer: ({ url }: any) => <div data-testid="tile-layer" data-url={url} />,
	Polyline: ({ pathOptions }: any) => (
		<div data-testid="polyline" data-color={pathOptions.color} />
	),
	CircleMarker: ({ pathOptions, children }: any) => (
		<div data-testid="circle-marker" data-color={pathOptions.fillColor}>
			{children}
		</div>
	),
	Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
	useMap: () => ({
		flyTo: vi.fn(),
	}),
}));

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

describe("FullTransitMap", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		queryClient.clear();
	});

	const renderWithClient = (ui: React.ReactElement) => {
		return render(
			<QueryClientProvider client={queryClient}>
				{ui}
			</QueryClientProvider>
		);
	};

	it("renders loading state initially", () => {
		vi.mocked(getNetworkLines).mockReturnValue(new Promise(() => {}));
		renderWithClient(<FullTransitMap />);
		expect(screen.getByText("Loading Transit Map…")).toBeInTheDocument();
	});

	it("renders lines and stations when loaded", async () => {
		const mockNetwork = {
			"Blue line": [
				{ name: "Rajiv Chowk", lat: 28.6304, lng: 77.2177 },
				{ name: "Sector-52 Noida", lat: 28.5866, lng: 77.3714 },
			],
		};
		vi.mocked(getNetworkLines).mockResolvedValue(mockNetwork);
		renderWithClient(<FullTransitMap />);

		expect(await screen.findByPlaceholderText("Search station on map…")).toBeInTheDocument();
		expect(screen.getAllByText("Blue line").length).toBeGreaterThan(0);
		expect(screen.getByTestId("full-map-container")).toBeInTheDocument();
	});
});
