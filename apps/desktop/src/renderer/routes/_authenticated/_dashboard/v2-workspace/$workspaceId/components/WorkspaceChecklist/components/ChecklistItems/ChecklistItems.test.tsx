import { afterEach, expect, test } from "bun:test";
import { ChecklistItems } from "./ChecklistItems";

const { cleanup, fireEvent, render } = await import("@testing-library/react");
afterEach(cleanup);

test("an item with sub-items collapses them and still shows its progress", () => {
	const view = render(
		<ChecklistItems
			disabled={false}
			onDoneChange={() => {}}
			items={[
				{
					text: "Purge",
					done: false,
					children: [
						{ text: "Delete rows", done: true },
						{ text: "Sweep S3", done: false },
					],
				},
				{ text: "Tell finance", done: false, children: [] },
			]}
		/>,
	);
	expect(view.getByText("Sweep S3")).toBeTruthy();

	fireEvent.click(view.getByRole("button", { expanded: true }));

	expect(view.queryByText("Sweep S3")).toBeNull();
	expect(view.getByText("1/2")).toBeTruthy();
	expect(view.getByText("Tell finance")).toBeTruthy();
});
