import { spawn } from "node:child_process";
import { basename } from "node:path";

/**
 * A cloud workspace sandbox ships `xdg-utils` and sets `DISPLAY`, so
 * `xdg-open` spawns happily and the page lands on a display nobody is
 * looking at. The same goes for an SSH session. Neither failure is one the
 * launcher can report, so it has to be ruled out before spawning.
 */
export function canReachDesktop(): boolean {
	return !(
		process.env.IS_SANDBOX ||
		process.env.SSH_CONNECTION ||
		process.env.SSH_TTY
	);
}

/**
 * The desktop app whose home this CLI uses: a build named `<name>` keeps its
 * home in `~/.superset-<name>` and answers `superset-<name>://`.
 */
export function desktopWorkspaceLink(
	workspaceId: string,
	homeDir = process.env.SUPERSET_HOME_DIR,
): string {
	const home = basename(homeDir ?? "");
	const scheme = /^\.superset-[a-z0-9-]+$/.test(home)
		? home.slice(1)
		: "superset";
	return `${scheme}://v2-workspace/${workspaceId}`;
}

export function openUrl(url: string): Promise<void> {
	const [bin, args]: [string, string[]] =
		process.platform === "darwin"
			? ["open", [url]]
			: process.platform === "win32"
				? ["cmd", ["/c", "start", "", url]]
				: ["xdg-open", [url]];

	return new Promise((resolve, reject) => {
		const child = spawn(bin, args, { stdio: "ignore", detached: true });
		child.once("error", reject);
		child.once("spawn", () => {
			child.unref();
			resolve();
		});
	});
}
