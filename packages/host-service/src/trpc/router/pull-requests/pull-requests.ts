import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../index";
import { addComment } from "./procedures/add-comment";
import { createForWorkspace } from "./procedures/create-for-workspace";
import { getContent } from "./procedures/get-content";
import { getContentByRepo } from "./procedures/get-content-by-repo";
import { getDiff } from "./procedures/get-diff";
import { getDiffByRepo } from "./procedures/get-diff-by-repo";
import { getLinkedWorkspace } from "./procedures/get-linked-workspace";
import { getThreads } from "./procedures/get-threads";
import { mergePR } from "./procedures/merge";
import { replyToThread } from "./procedures/reply-to-thread";
import { setDraft } from "./procedures/set-draft";
import { setState } from "./procedures/set-state";
import { setThreadResolution } from "./procedures/set-thread-resolution";

export const pullRequestsRouter = router({
	getByWorkspaces: protectedProcedure
		.input(
			z.object({
				workspaceIds: z.array(z.string()),
			}),
		)
		.query(async ({ ctx, input }) => {
			const workspaces =
				await ctx.runtime.pullRequests.getPullRequestsByWorkspaces(
					input.workspaceIds,
				);
			// Why links may be stale: the sweep keeps existing links through a
			// rate limit, outage, or rejected credential but cannot create new
			// ones, and a workspace with no PR chip says nothing on its own.
			return {
				workspaces,
				github: ctx.runtime.pullRequests.getGithubStatus(),
			};
		}),
	/**
	 * Every PR each workspace has ever been linked to, current one first.
	 * `getByWorkspaces` stays the sidebar's view (the one currently-linked PR,
	 * honoring Remove PR Link); this is the full record behind it.
	 */
	historyByWorkspaces: protectedProcedure
		.input(
			z.object({
				workspaceIds: z.array(z.string()),
			}),
		)
		.query(async ({ ctx, input }) => {
			const workspaces =
				await ctx.runtime.pullRequests.getPullRequestHistoryByWorkspaces(
					input.workspaceIds,
				);
			return { workspaces };
		}),
	/** Link a PR by URL, `owner/repo#n` or a number in the workspace's repo. */
	linkToWorkspace: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				reference: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.runtime.pullRequests.linkPullRequest({
					workspaceId: input.workspaceId,
					reference: input.reference,
					source: "manual",
				});
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: error instanceof Error ? error.message : String(error),
				});
			}
		}),
	/** Remove one PR (an id from `historyByWorkspaces`) from a workspace's links. */
	unlinkPullRequest: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				pullRequestId: z.string(),
			}),
		)
		.mutation(({ ctx, input }) => {
			ctx.runtime.pullRequests.unlinkPullRequest(
				input.workspaceId,
				input.pullRequestId,
			);
			return { ok: true };
		}),
	unlinkFromWorkspace: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
			}),
		)
		.mutation(({ ctx, input }) => {
			ctx.runtime.pullRequests.unlinkWorkspacePullRequest(input.workspaceId);
			return { ok: true };
		}),
	refreshByWorkspaces: protectedProcedure
		.input(
			z.object({
				workspaceIds: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.runtime.pullRequests.refreshPullRequestsByWorkspaces(
				input.workspaceIds,
			);
			return { ok: true };
		}),
	/** Re-fetch linked PRs from GitHub by id (from `historyByWorkspaces`). */
	refreshPullRequests: protectedProcedure
		.input(
			z.object({
				pullRequestIds: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.runtime.pullRequests.refreshPullRequests(input.pullRequestIds);
			return { ok: true };
		}),
	addComment,
	createForWorkspace,
	getContent,
	getContentByRepo,
	getDiff,
	getDiffByRepo,
	getLinkedWorkspace,
	getThreads,
	setDraft,
	setState,
	setThreadResolution,
	replyToThread,
	mergePR,
});
