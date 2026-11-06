import type { PRState } from "renderer/screens/main/components/PRIcon";

/** Any PR still in flight wins, then all-draft, then all-merged; anything else reads as closed. */
export function aggregatePullRequestState(states: PRState[]): PRState {
	if (states.every((state) => state === "draft")) return "draft";
	if (states.some((state) => state !== "merged" && state !== "closed")) {
		return "open";
	}
	return states.every((state) => state === "merged") ? "merged" : "closed";
}
