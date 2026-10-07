import { Text } from "@mantine/core";

/* What an answer was, in one word.

   This was written out at six call sites and had already drifted: the
   transliteration trainer greys a revealed answer, while the three typed modes
   coloured it red — so asking to see the answer looked like getting it wrong.
   Gray is the right reading, so that is what they all do now.

   The words and the tone live here; the typography does not. Transliteration
   sets its verdict in small uppercase inside a tinted panel and the typed modes
   put it inline beside the expected form, which is a real difference rather
   than drift, so those call sites use `verdictOf` and style it themselves.

   Modes with no "Show answer" — the multiple-choice and the cell-picking ones —
   simply never pass `revealed`, and get the two-state answer without asking. */

export function verdictOf(result) {
  if (!result) return null;
  if (result.revealed) return { tone: "gray", label: "Answer" };
  return result.correct
    ? { tone: "teal", label: "Correct" }
    : { tone: "red", label: "Not quite" };
}

/** The inline treatment, used wherever the verdict sits beside the answer. */
export function Verdict({ result, size = "sm", ...rest }) {
  const v = verdictOf(result);
  if (!v) return null;
  return (
    <Text size={size} fw={700} c={v.tone} {...rest}>
      {v.label}
    </Text>
  );
}
