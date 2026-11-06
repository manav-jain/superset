import type { MouseEvent } from "react";

/**
 * Click props for anything that opens a pull request: Cmd/Ctrl+click or a
 * middle click opens `url` in the browser; a plain click runs `openInApp`.
 */
export function pullRequestClickProps(
	url: string,
	openInApp: (event: MouseEvent) => void,
) {
	const openInBrowser = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		window.open(url, "_blank");
	};
	return {
		onClick: (event: MouseEvent) =>
			event.metaKey || event.ctrlKey ? openInBrowser(event) : openInApp(event),
		onAuxClick: (event: MouseEvent) => {
			if (event.button === 1) openInBrowser(event);
		},
	};
}
