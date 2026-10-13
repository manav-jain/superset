export interface PullRequestReference {
	owner: string | null;
	name: string | null;
	number: number;
}

const URL_REFERENCE = /github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/i;
const REPO_REFERENCE = /^([\w.-]+)\/([\w.-]+)#(\d+)$/;
const NUMBER_REFERENCE = /^#?(\d+)$/;

/** A PR URL, `owner/repo#123`, `#123` or `123`. A bare number has no repo. */
export function parsePullRequestReference(
	input: string,
): PullRequestReference | null {
	const value = input.trim();
	const repoMatch = value.match(URL_REFERENCE) ?? value.match(REPO_REFERENCE);
	if (repoMatch) {
		return {
			owner: repoMatch[1] as string,
			name: repoMatch[2] as string,
			number: Number(repoMatch[3]),
		};
	}
	const numberMatch = value.match(NUMBER_REFERENCE);
	return numberMatch
		? { owner: null, name: null, number: Number(numberMatch[1]) }
		: null;
}

const GH_PR_CREATE = /\bgh\s+pr\s+create\b/;
const PULL_REQUEST_URL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;

function toolResultText(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.map((part) =>
			part && typeof part === "object" && "text" in part
				? String(part.text)
				: "",
		)
		.join("\n");
}

/**
 * PR URLs printed by `gh pr create` in Claude Code transcript lines (JSONL).
 * `pendingToolUseIds` carries `gh pr create` calls whose result is in a later
 * chunk.
 */
export function findCreatedPullRequestUrls(
	lines: string[],
	pendingToolUseIds: Set<string>,
): string[] {
	const urls: string[] = [];
	for (const line of lines) {
		if (!line.includes('"tool_')) continue;
		let entry: { message?: { content?: unknown } };
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		const content = entry.message?.content;
		if (!Array.isArray(content)) continue;
		for (const block of content) {
			if (block?.type === "tool_use") {
				const command = block.input?.command;
				if (typeof command === "string" && GH_PR_CREATE.test(command)) {
					pendingToolUseIds.add(block.id);
				}
			} else if (
				block?.type === "tool_result" &&
				pendingToolUseIds.delete(block.tool_use_id)
			) {
				urls.push(
					...(toolResultText(block.content).match(PULL_REQUEST_URL) ?? []),
				);
			}
		}
	}
	return urls;
}
