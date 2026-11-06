import { useLingui } from "@lingui/react/macro";
import type { WorkspaceChecklistItem } from "@superset/shared/workspace-checklist";
import { cn } from "@superset/ui/utils";
import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import { ChecklistRow } from "../ChecklistRow";

interface ChecklistItemsProps {
	items: WorkspaceChecklistItem[];
	disabled: boolean;
	onDoneChange: (
		index: number,
		childIndex: number | null,
		done: boolean,
	) => void;
}

export function ChecklistItems({
	items,
	disabled,
	onDoneChange,
}: ChecklistItemsProps) {
	const { t } = useLingui();
	// Keyed by text: the agent rewrites the whole list, so indexes shift.
	const [collapsedItems, setCollapsedItems] = useState<ReadonlySet<string>>(
		new Set(),
	);
	const hasSubItems = items.some((item) => item.children.length > 0);

	function toggleCollapsed(text: string) {
		setCollapsedItems((current) => {
			const next = new Set(current);
			if (!next.delete(text)) next.add(text);
			return next;
		});
	}

	return (
		<ul>
			{items.map((item, index) => {
				const isCollapsed = collapsedItems.has(item.text);
				const hasChildren = item.children.length > 0;
				const doneChildren = item.children.filter((child) => child.done);
				return (
					<li key={`${index}:${item.text}`}>
						<ChecklistRow
							text={item.text}
							done={item.done}
							disabled={disabled}
							onDoneChange={(done) => onDoneChange(index, null, done)}
							leading={
								hasChildren ? (
									<button
										type="button"
										aria-expanded={!isCollapsed}
										aria-label={
											isCollapsed
												? t({ message: "Expand" })
												: t({ message: "Collapse" })
										}
										onClick={() => toggleCollapsed(item.text)}
										className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
									>
										<LuChevronRight
											className={cn(
												"size-3 transition-transform",
												!isCollapsed && "rotate-90",
											)}
										/>
									</button>
								) : (
									hasSubItems && <span className="size-4 shrink-0" />
								)
							}
							trailing={
								hasChildren && (
									<span className="shrink-0 text-muted-foreground tabular-nums leading-4">
										{doneChildren.length}/{item.children.length}
									</span>
								)
							}
						/>
						{hasChildren && !isCollapsed && (
							<ul className="ml-8">
								{item.children.map((child, childIndex) => (
									<li key={`${childIndex}:${child.text}`}>
										<ChecklistRow
											text={child.text}
											done={child.done}
											disabled={disabled}
											onDoneChange={(done) =>
												onDoneChange(index, childIndex, done)
											}
										/>
									</li>
								))}
							</ul>
						)}
					</li>
				);
			})}
		</ul>
	);
}
