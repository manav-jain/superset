import { afterEach, describe, expect, it, mock } from "bun:test";
import type { MouseEvent } from "react";
import { pullRequestClickProps } from "./pullRequestClickProps";

const URL = "https://github.com/o/r/pull/1";
const originalOpen = window.open;

function click(init: Partial<MouseEvent>): MouseEvent {
	return {
		metaKey: false,
		ctrlKey: false,
		button: 0,
		preventDefault: () => {},
		stopPropagation: () => {},
		...init,
	} as MouseEvent;
}

describe("pullRequestClickProps", () => {
	afterEach(() => {
		window.open = originalOpen;
	});

	it("opens in the app on a plain click and in the browser on Cmd/Ctrl or middle click", () => {
		const browser = mock(() => null);
		window.open = browser;
		const app = mock(() => {});
		const props = pullRequestClickProps(URL, app);

		props.onClick(click({}));
		props.onAuxClick(click({ button: 2 }));
		expect(app).toHaveBeenCalledTimes(1);
		expect(browser).not.toHaveBeenCalled();

		props.onClick(click({ metaKey: true }));
		props.onClick(click({ ctrlKey: true }));
		props.onAuxClick(click({ button: 1 }));
		expect(app).toHaveBeenCalledTimes(1);
		expect(browser).toHaveBeenCalledTimes(3);
		expect(browser).toHaveBeenCalledWith(URL, "_blank");
	});
});
