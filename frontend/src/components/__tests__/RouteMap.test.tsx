import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RouteMap from "../RouteMap";
import { getStationCoordinates } from "../../requests";

vi.mock("../../requests", () => ({
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
		svg: ({ children, animate, transition, ...props }: any) => <svg {...props}>{children}</svg>,
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("react-leaflet", () => ({
	MapContainer: ({ children, center, zoom }: any) => (
		<div data-testid="map-container" data-center={JSON.stringify(center)} data-zoom={zoom}>
			{children}
		</div>
	),
	TileLayer: ({ url }: any) => <div data-testid="tile-layer" data-url={url} />,
	Polyline: ({ positions, pathOptions }: any) => (
		<div data-testid="polyline" data-positions={JSON.stringify(positions)} data-color={pathOptions.color} />
	),
	CircleMarker: ({ center, pathOptions, children }: any) => (
		<div data-testid="circle-marker" data-center={JSON.stringify(center)} data-color={pathOptions.fillColor}>
			{children}
		</div>
	),
	Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
	useMap: () => ({
		fitBounds: vi.fn(),
		invalidateSize: vi.fn(),
	}),
}));

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

describe("RouteMap", () => {
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

	const mockRoutes = [
		{
			path: [
				{ name: "Rajiv Chowk", line: "Blue line" },
				{ name: "Kashmere Gate", line: "Red line" },
			],
			total_time: 15,
			fare: 30,
			interchanges: 1,
		},
	];

	const mockCoords = {
		"Rajiv Chowk": { lat: 28.6304, lng: 77.2177 },
		"Kashmere Gate": { lat: 28.6675, lng: 77.2281 },
	};

	it("renders null when no routes are provided", () => {
		vi.mocked(getStationCoordinates).mockResolvedValue(mockCoords);
		const { container } = renderWithClient(<RouteMap routes={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders null when coordinates are not available", () => {
		vi.mocked(getStationCoordinates).mockResolvedValue(undefined as any);
		const { container } = renderWithClient(<RouteMap routes={mockRoutes} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders View on Map button when coordinates and routes are loaded", async () => {
		vi.mocked(getStationCoordinates).mockResolvedValue(mockCoords);
		renderWithClient(<RouteMap routes={mockRoutes} />);
		await waitFor(() => {
			expect(screen.getByText("View on Map")).toBeInTheDocument();
		});
	});

	it("toggles map visibility when clicked", async () => {
		vi.mocked(getStationCoordinates).mockResolvedValue(mockCoords);
		renderWithClient(<RouteMap routes={mockRoutes} />);
		const button = await screen.findByText("View on Map");
		expect(screen.queryByTestId("map-container")).not.toBeInTheDocument();
		fireEvent.click(button);
		expect(await screen.findByTestId("map-container")).toBeInTheDocument();
		expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
		expect(screen.getByTestId("polyline")).toBeInTheDocument();
		expect(screen.getAllByTestId("circle-marker")).toHaveLength(2);
		expect(screen.getAllByTestId("tooltip")).toHaveLength(2);
		fireEvent.click(button);
		await waitFor(() => {
			expect(screen.queryByTestId("map-container")).not.toBeInTheDocument();
		});
	});

	it("uses custom route colors if provided", async () => {
		vi.mocked(getStationCoordinates).mockResolvedValue(mockCoords);
		renderWithClient(<RouteMap routes={mockRoutes} routeColors={["#ff00ff"]} />);
		fireEvent.click(await screen.findByText("View on Map"));
		const polyline = await screen.findByTestId("polyline");
		expect(polyline.getAttribute("data-color")).toBe("#ff00ff");
	});
});
