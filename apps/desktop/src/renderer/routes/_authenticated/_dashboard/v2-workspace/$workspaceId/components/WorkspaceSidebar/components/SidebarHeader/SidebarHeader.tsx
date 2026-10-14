import { useLingui } from "@lingui/react/macro";
import { Tooltip, TooltipContent, TooltipTrigger } from "@superset/ui/tooltip";
import { cn } from "@superset/ui/utils";
import type { ReactNode } from "react";
import { LuX } from "react-icons/lu";
import { getSidebarHeaderTabButtonClassName } from "renderer/screens/main/components/WorkspaceView/RightSidebar/headerTabStyles";
import type { SidebarTabDefinition } from "../../types";

interface SidebarHeaderProps {
	tabs: SidebarTabDefinition[];
	activeTab: string;
	onTabChange: (id: string) => void;
	compact?: boolean;
	onCloseTab: (id: string) => void;
	tabsMenu: ReactNode;
}

export function SidebarHeader({
	tabs,
	activeTab,
	onTabChange,
	compact,
	onCloseTab,
	tabsMenu,
}: SidebarHeaderProps) {
	const { t } = useLingui();
	const actions = tabs.find((tab) => tab.id === activeTab)?.actions;

	return (
		<div className="-mt-px flex h-10 shrink-0 items-stretch bg-muted/45 shadow-[inset_0_-1px_0_var(--border)] dark:bg-muted/35">
			<div className="flex min-w-0 flex-1 items-center h-full overflow-hidden pt-1">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					const badge =
						typeof tab.badge === "number" && tab.badge > 0
							? formatBadgeCount(tab.badge)
							: null;
					const label = badge ? `${tab.label} (${badge})` : tab.label;
					const btn = (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							onAuxClick={(event) => {
								if (event.button !== 1) return;
								event.preventDefault();
								onCloseTab(tab.id);
							}}
							aria-label={label}
							className={cn(
								getSidebarHeaderTabButtonClassName({
									isActive,
									compact,
									inverted: true,
								}),
								// Size by content: equal thirds truncate "Changes 99+" to
								// "Ch…" at the default width while "Files" sits on slack.
								"relative min-w-0 justify-center",
								compact ? "flex-auto" : "w-full",
							)}
						>
							{tab.icon && <tab.icon className="size-3 shrink-0" />}
							{!compact && <span className="truncate">{tab.label}</span>}
							{badge && (
								<span
									aria-hidden="true"
									className={cn(
										"shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-medium leading-4 tabular-nums text-muted-foreground",
										isActive && "bg-background/80 text-foreground",
										compact &&
											"absolute right-1 top-1 min-w-3 px-1 text-[9px] leading-3",
									)}
								>
									{badge}
								</span>
							)}
						</button>
					);

					if (compact) {
						return (
							<Tooltip key={tab.id}>
								<TooltipTrigger asChild>{btn}</TooltipTrigger>
								<TooltipContent side="bottom">{label}</TooltipContent>
							</Tooltip>
						);
					}

					return (
						<div
							key={tab.id}
							className="group/tab relative flex h-full min-w-0 flex-auto"
						>
							{btn}
							<button
								type="button"
								aria-label={t({ message: "Close tab" })}
								onClick={() => onCloseTab(tab.id)}
								className="absolute top-1/2 right-1 flex size-4 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/tab:opacity-100"
							>
								<LuX className="size-3" />
							</button>
						</div>
					);
				})}
				{tabsMenu}
			</div>
			{actions && (
				<div className="flex shrink-0 items-center h-10 pr-2 gap-0.5">
					{actions}
				</div>
			)}
		</div>
	);
}

function formatBadgeCount(count: number): string {
	return count > 99 ? "99+" : String(count);
}
