import { useLingui } from "@lingui/react/macro";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@superset/ui/resizable";
import { Fragment, type ReactNode } from "react";
import { LuX } from "react-icons/lu";
import type { SidebarTabDefinition } from "../../types";

interface StackedSidebarTabsProps {
	tabs: SidebarTabDefinition[];
	onCloseTab: (id: string) => void;
	tabsMenu: ReactNode;
}

/** Every open tab at once, one resizable section each, top to bottom. */
export function StackedSidebarTabs({
	tabs,
	onCloseTab,
	tabsMenu,
}: StackedSidebarTabsProps) {
	const { t } = useLingui();
	return (
		<ResizablePanelGroup
			direction="vertical"
			autoSaveId="workspace-sidebar-stacked-tabs"
		>
			{tabs.map((tab, index) => (
				<Fragment key={tab.id}>
					{index > 0 && <ResizableHandle />}
					<ResizablePanel
						id={tab.id}
						order={index}
						minSize={8}
						className="flex min-h-0 flex-col"
					>
						<div className="group/section flex h-7 shrink-0 items-center gap-1.5 bg-muted/45 pl-2 text-muted-foreground text-xs shadow-[inset_0_-1px_0_var(--border)] dark:bg-muted/35">
							{tab.icon && <tab.icon className="size-3 shrink-0" />}
							<span className="truncate font-medium text-foreground">
								{tab.label}
							</span>
							{typeof tab.badge === "number" && tab.badge > 0 && (
								<span className="shrink-0 rounded-full bg-muted px-1.5 font-medium text-[10px] tabular-nums leading-4">
									{tab.badge > 99 ? "99+" : tab.badge}
								</span>
							)}
							<div className="ml-auto flex h-full shrink-0 items-center gap-0.5">
								{tab.actions}
								<button
									type="button"
									aria-label={t({ message: "Close tab" })}
									onClick={() => onCloseTab(tab.id)}
									className="flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/section:opacity-100"
								>
									<LuX className="size-3" />
								</button>
								{index === 0 && tabsMenu}
							</div>
						</div>
						<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
							{tab.content}
						</div>
					</ResizablePanel>
				</Fragment>
			))}
		</ResizablePanelGroup>
	);
}
