import { Checkbox } from "@superset/ui/checkbox";
import { cn } from "@superset/ui/utils";
import { type ReactNode, useId } from "react";

interface ChecklistRowProps {
	text: string;
	done: boolean;
	disabled: boolean;
	onDoneChange: (done: boolean) => void;
	leading?: ReactNode;
	trailing?: ReactNode;
}

export function ChecklistRow({
	text,
	done,
	disabled,
	onDoneChange,
	leading,
	trailing,
}: ChecklistRowProps) {
	const id = useId();
	return (
		<div className="flex items-start gap-2 rounded-sm px-1.5 py-1 hover:bg-muted/50">
			{leading}
			<Checkbox
				id={id}
				checked={done}
				disabled={disabled}
				onCheckedChange={(checked) => onDoneChange(checked === true)}
				className="mt-px"
			/>
			<label
				htmlFor={id}
				className={cn(
					"min-w-0 flex-1 cursor-pointer break-words leading-4",
					done && "text-muted-foreground line-through",
				)}
			>
				{text}
			</label>
			{trailing}
		</div>
	);
}
