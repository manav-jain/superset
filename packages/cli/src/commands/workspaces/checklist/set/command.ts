import { CLIError, positional } from "@superset/cli-framework";
import { parseWorkspaceChecklist } from "@superset/shared/workspace-checklist";
import { command } from "../../../../lib/command";
import { readStdin } from "../../../../lib/plugins/inputs";
import { resolveHostClient } from "../../../../lib/resolve-host-client";
import { checklistOptions, checklistWorkspaceId } from "../shared";

export default command({
	description:
		"Replace the workspace's checklist. One markdown list line per item: `- [ ] todo`, `- [x] done`; indent a line to nest it one level. Run `get` first: the user can tick items in the app",
	args: [
		positional("checklist").desc(
			"The checklist as markdown; read from stdin when omitted. Pass an empty string to clear it",
		),
	],
	options: checklistOptions,
	run: async ({ ctx, args, options }) => {
		const id = checklistWorkspaceId(options);
		const markdown =
			(args.checklist as string | undefined) ?? (await readStdin());
		if (markdown == null) {
			throw new CLIError(
				"No checklist",
				"Pass the checklist as an argument or pipe it in",
			);
		}
		const items = parseWorkspaceChecklist(markdown);
		if (markdown.trim() && items.length === 0) {
			throw new CLIError(
				"No list items found",
				"Write one item per line: `- [ ] todo` or `- [x] done`",
			);
		}
		const client = await resolveHostClient(ctx, options);
		const saved = await client.workspace.setChecklist.mutate({ id, items });
		const total = items.flatMap((item) => [item, ...item.children]);
		return {
			data: saved,
			message: `Checklist saved: ${total.filter((entry) => entry.done).length} of ${total.length} done`,
		};
	},
});
