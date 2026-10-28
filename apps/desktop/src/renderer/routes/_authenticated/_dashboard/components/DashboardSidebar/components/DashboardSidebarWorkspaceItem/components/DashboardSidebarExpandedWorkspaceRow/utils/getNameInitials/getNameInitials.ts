/**
 * Two-letter badge text for a repo name: the first letters of the first two
 * words (split on "-", "_" and spaces), or the first two letters of a
 * one-word name.
 */
export function getNameInitials(name: string): string {
	const words = name.split(/[-_\s]+/).filter(Boolean);
	const initials =
		words.length > 1
			? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`
			: (words[0] ?? "").slice(0, 2);
	return initials.toUpperCase();
}
