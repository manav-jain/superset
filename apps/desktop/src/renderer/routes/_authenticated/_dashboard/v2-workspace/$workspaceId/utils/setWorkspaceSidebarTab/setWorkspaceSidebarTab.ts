import type { useCollections } from "renderer/routes/_authenticated/providers/CollectionsProvider";
import {
	DEFAULT_V2_USER_PREFERENCES,
	V2_USER_PREFERENCES_ID,
	type WorkspaceSidebarTab,
} from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal/schema";
import { useRowlessSidebarTabStore } from "../../state/rowlessSidebarTabStore";

type Collections = ReturnType<typeof useCollections>;

/** The tab a workspace's sidebar shows before anything has been chosen. */
export const DEFAULT_WORKSPACE_SIDEBAR_TAB: WorkspaceSidebarTab = "changes";

/**
 * The tab a workspace's sidebar is on: its local-state row, else the
 * session fallback a rowless workspace wrote, else the default. A plain
 * read for event handlers — the sidebar itself subscribes to both sources.
 */
export function getWorkspaceSidebarTab(
	collections: Collections,
	workspaceId: string,
): WorkspaceSidebarTab {
	const row = collections.v2WorkspaceLocalState.get(workspaceId);
	if (row) return row.sidebarState.activeTab;
	return (
		useRowlessSidebarTabStore.getState().tabs[workspaceId] ??
		DEFAULT_WORKSPACE_SIDEBAR_TAB
	);
}

export function getDefaultSidebarTabs(
	collections: Collections,
): WorkspaceSidebarTab[] {
	return (
		collections.v2UserPreferences.get(V2_USER_PREFERENCES_ID)
			?.defaultSidebarTabs ?? DEFAULT_V2_USER_PREFERENCES.defaultSidebarTabs
	);
}

function openTabsWith(
	collections: Collections,
	openTabs: WorkspaceSidebarTab[] | null | undefined,
	tab: WorkspaceSidebarTab,
): WorkspaceSidebarTab[] | null {
	const current = openTabs ?? getDefaultSidebarTabs(collections);
	return current.includes(tab) ? null : [...current, tab];
}

/** Set which tabs a workspace's right sidebar shows. */
export function setWorkspaceSidebarOpenTabs(
	collections: Collections,
	workspaceId: string,
	tabs: WorkspaceSidebarTab[],
): void {
	if (!collections.v2WorkspaceLocalState.get(workspaceId)) {
		useRowlessSidebarTabStore.getState().setOpenTabs(workspaceId, tabs);
		return;
	}
	collections.v2WorkspaceLocalState.update(workspaceId, (draft) => {
		draft.sidebarState.openTabs = tabs;
	});
}

/**
 * Switch a workspace's right-sidebar tab, reopening it if it was closed. The sidebar reads its active tab
 * from per-workspace local state (not the global v2 preferences row), so
 * every flow that surfaces a tab's content — a file reveal, opening Changes,
 * the tab strip itself — writes here. An auto-included local `main`
 * workspace has no local row, and creating one would place it explicitly in
 * the sidebar, so its choice goes to the in-memory fallback the sidebar
 * reads whenever the row is missing.
 */
export function setWorkspaceSidebarTab(
	collections: Collections,
	workspaceId: string,
	tab: WorkspaceSidebarTab,
): void {
	if (!collections.v2WorkspaceLocalState.get(workspaceId)) {
		const store = useRowlessSidebarTabStore.getState();
		store.setTab(workspaceId, tab);
		const openTabs = openTabsWith(
			collections,
			store.openTabs[workspaceId],
			tab,
		);
		if (openTabs) store.setOpenTabs(workspaceId, openTabs);
		return;
	}
	collections.v2WorkspaceLocalState.update(workspaceId, (draft) => {
		draft.sidebarState.activeTab = tab;
		const openTabs = openTabsWith(
			collections,
			draft.sidebarState.openTabs,
			tab,
		);
		if (openTabs) draft.sidebarState.openTabs = openTabs;
	});
}
