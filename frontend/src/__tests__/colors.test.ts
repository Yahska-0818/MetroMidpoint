import { describe, it, expect } from "vitest";
import { formatLineColor, getLineHex } from "../utils/colors";

describe("colors utility", () => {
	it("returns correct purple/violet styling for purple line and variants", () => {
		expect(formatLineColor("Purple line")).toBe("border-purple-600 text-white bg-purple-600");
		expect(getLineHex("Purple line")).toBe("#7c3aed");
		expect(formatLineColor("purple line branch")).toBe("border-purple-600 text-white bg-purple-600");
		expect(getLineHex("purple line branch")).toBe("#7c3aed");
		expect(formatLineColor("Voilet line")).toBe("border-purple-600 text-white bg-purple-600");
		expect(getLineHex("Voilet line")).toBe("#7c3aed");
	});

	it("returns matching colors for line branches like magenta line branch", () => {
		expect(getLineHex("Magenta line branch")).toBe("#d946ef");
		expect(getLineHex("Magenta line")).toBe("#d946ef");
		expect(formatLineColor("Magenta line branch")).toBe("border-fuchsia-600 text-white bg-fuchsia-600");
	});
});
