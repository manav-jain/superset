import { z } from "zod";

const checklistEntrySchema = z.object({
	text: z.string().trim().min(1).max(500),
	done: z.boolean(),
});

export const workspaceChecklistItemSchema = checklistEntrySchema.extend({
	children: z.array(checklistEntrySchema).max(50).default([]),
});

export const workspaceChecklistSchema = z
	.array(workspaceChecklistItemSchema)
	.max(100);

export type WorkspaceChecklistItem = z.infer<
	typeof workspaceChecklistItemSchema
>;

const LIST_LINE = /^(\s*)(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s*)?(\S.*)$/;

/** Markdown list lines to checklist items. An indented line nests under the item above it, one level deep. */
export function parseWorkspaceChecklist(
	markdown: string,
): WorkspaceChecklistItem[] {
	const items: WorkspaceChecklistItem[] = [];
	for (const line of markdown.split("\n")) {
		const match = LIST_LINE.exec(line);
		if (!match) continue;
		const [, indent = "", mark, text = ""] = match;
		const entry = { text: text.trim(), done: mark === "x" || mark === "X" };
		const parent = items.at(-1);
		if (indent.length > 0 && parent) parent.children.push(entry);
		else items.push({ ...entry, children: [] });
	}
	return items;
}

export function formatWorkspaceChecklist(
	items: WorkspaceChecklistItem[],
): string {
	const line = (entry: { text: string; done: boolean }) =>
		`- [${entry.done ? "x" : " "}] ${entry.text}`;
	return items
		.flatMap((item) => [
			line(item),
			...item.children.map((child) => `  ${line(child)}`),
		])
		.join("\n");
}
