import { describe, expect, it } from "bun:test";
import { getNameInitials } from "./getNameInitials";

describe("getNameInitials", () => {
	it("takes one letter per word for hyphen, snake and spaced names, two letters for one word", () => {
		expect(getNameInitials("anton-dashboard")).toBe("AD");
		expect(getNameInitials("ultrahuman-multi-task")).toBe("UM");
		expect(getNameInitials("uh_secret_store")).toBe("US");
		expect(getNameInitials("UH Brain")).toBe("UB");
		expect(getNameInitials("ultrahuman")).toBe("UL");
		expect(getNameInitials("x")).toBe("X");
	});
});
