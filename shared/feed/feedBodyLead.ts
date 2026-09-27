/** Split post body into a bold lead sentence and the remainder for feed cards. */
export function splitFeedBodyLead(body: string): { lead: string | null; rest: string } {
  const trimmed = body.trim();
  if (!trimmed) return { lead: null, rest: "" };

  const paragraphBreak = trimmed.indexOf("\n\n");
  if (paragraphBreak > 0 && paragraphBreak < 280) {
    const first = trimmed.slice(0, paragraphBreak).trim();
    const rest = trimmed.slice(paragraphBreak + 2).trim();
    if (first.length > 0) return { lead: first, rest };
  }

  const sentenceMatch = trimmed.match(/^(.+?[.!?])(\s+|$)/);
  if (sentenceMatch && sentenceMatch[1].length >= 12 && sentenceMatch[1].length <= 220) {
    const lead = sentenceMatch[1].trim();
    const rest = trimmed.slice(sentenceMatch[0].length).trim();
    if (rest.length > 0) return { lead, rest };
  }

  return { lead: null, rest: trimmed };
}
