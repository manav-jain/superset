import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "../../../db/schema";
import type { WorkspaceChangedMessage } from "../../../events/types";
import type { HostServiceContext } from "../../../types";
import { workspaceRouter } from "./workspace";

const MIGRATIONS_FOLDER = resolve(import.meta.dir, "../../../../drizzle");
const MASTER = "1f0e8c7e-1234-4abc-8def-0123456789a1";
const WORKER = "1f0e8c7e-1234-4abc-8def-0123456789a2";

function createCaller() {
	const sqlite = new Database(":memory:");
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
	for (const id of [MASTER, WORKER]) {
		db.insert(schema.workspaces)
			.values({ id, worktreePath: `/tmp/${id}`, branch: id, type: "session" })
			.run();
	}
	const messages: Omit<WorkspaceChangedMessage, "type">[] = [];
	const ctx = {
		db,
		isAuthenticated: true,
		organizationId: "org",
		userId: null,
		eventBus: {
			broadcastWorkspaceChanged: (message: (typeof messages)[number]) =>
				messages.push(message),
		},
	} as unknown as HostServiceContext;
	return { caller: workspaceRouter.createCaller(ctx), messages };
}

describe("workspace.update parentWorkspaceId", () => {
	it("nests a worker, lists and broadcasts the link, and rejects a cycle", async () => {
		const { caller, messages } = createCaller();

		await caller.update({ id: WORKER, parentWorkspaceId: MASTER });
		expect(messages.at(-1)?.workspace?.parentWorkspaceId).toBe(MASTER);
		const listed = await caller.list();
		expect(listed.find((row) => row.id === WORKER)?.parentWorkspaceId).toBe(
			MASTER,
		);

		await expect(
			caller.update({ id: MASTER, parentWorkspaceId: WORKER }),
		).rejects.toThrow("cannot be nested under itself or its own child");

		await caller.update({ id: WORKER, parentWorkspaceId: null });
		expect(messages.at(-1)?.workspace?.parentWorkspaceId).toBeNull();
	});
});
