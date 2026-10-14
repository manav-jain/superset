import { Trans, useLingui } from "@lingui/react/macro";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@superset/ui/dropdown-menu";
import { LuPlus } from "react-icons/lu";
import type { SidebarTabDefinition } from "../../types";

interface SidebarTabsMenuProps {
	tabs: SidebarTabDefinition[];
	openTabIds: readonly string[];
	onToggleTab: (id: string, open: boolean) => void;
	onSaveAsDefault: () => void;
	isDefault: boolean;
}

export function SidebarTabsMenu({
	tabs,
	openTabIds,
	onToggleTab,
	onSaveAsDefault,
	isDefault,
}: SidebarTabsMenuProps) {
	const { t } = useLingui();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={t({ message: "Choose tabs" })}
					className="flex h-full w-8 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
				>
					<LuPlus className="size-3.5" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-52">
				{tabs.map((tab) => (
					<DropdownMenuCheckboxItem
						key={tab.id}
						checked={openTabIds.includes(tab.id)}
						onCheckedChange={(checked) => onToggleTab(tab.id, checked)}
						onSelect={(event) => event.preventDefault()}
					>
						{tab.icon && <tab.icon className="size-3.5" />}
						{tab.label}
					</DropdownMenuCheckboxItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled={isDefault} onSelect={onSaveAsDefault}>
					<Trans>Make these the default tabs</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
