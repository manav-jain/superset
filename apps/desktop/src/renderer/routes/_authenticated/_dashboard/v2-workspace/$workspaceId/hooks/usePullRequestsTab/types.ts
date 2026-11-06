import type { AppRouter } from "@superset/host-service";
import type { inferRouterOutputs } from "@trpc/server";

export type WorkspacePullRequest =
	inferRouterOutputs<AppRouter>["pullRequests"]["historyByWorkspaces"]["workspaces"][number]["pullRequests"][number];

export interface PullRequestSection {
	id: string;
	name: string;
	pullRequests: WorkspacePullRequest[];
}
