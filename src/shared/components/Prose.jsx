import { Fragment } from "react";
import { Box, Text, Tooltip } from "@mantine/core";

/* A line of teaching prose: a rule statement, a note under an answer, a caveat.

   Two things have to happen to such a line, and until now each topic got
   whichever one its component did.

   Hebrew quoted inside an English sentence needs isolating. Dropped in as bare
   characters, a Hebrew run drags the surrounding punctuation to the wrong end —
   "strip ־ִים, ־וֹת, ־ָה" comes out with its commas shuffled — so each run gets
   its own span and the bidi algorithm resolves it without touching the
   sentence. The plural rules carried Hebrew in four of their statements and
   never had this, because their component only did the other half.

   {Braced} jargon becomes an underlined span with the definition on hover. The
   terms stay, which is the point; looking one up just shouldn't cost you the
   sentence you were reading. A topic with no glossary passes none and gets the
   bidi handling alone — which is what the article and roots statements were
   already getting from the component this replaces.

   Order matters: braces are split first, because a term is looked up whole and
   a Hebrew run inside the surrounding text must not split it. */

const HEBREW_RUN = /[֐-׿‏־‐-―]+/g;

/** Hebrew runs isolated, everything else left alone. */
function withIsolatedHebrew(text, keyPrefix) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(HEBREW_RUN)) {
    if (m.index > last) {
      out.push(<Fragment key={`${keyPrefix}-t${last}`}>{text.slice(last, m.index)}</Fragment>);
    }
    out.push(
      <Box component="span" key={`${keyPrefix}-h${m.index}`} className="hebrew" dir="rtl"
           style={{ unicodeBidi: "isolate" }}>{m[0]}</Box>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(<Fragment key={`${keyPrefix}-t${last}`}>{text.slice(last)}</Fragment>);
  }
  return out;
}

export function Prose({ children, terms, size = "sm", ...rest }) {
  const text = String(children ?? "");
  const parts = text.split(/(\{[^}]+\})/g).filter(Boolean);

  return (
    <Text size={size} {...rest}>
      {parts.map((part, i) => {
        const match = part.match(/^\{([^}]+)\}$/);
        if (!match) return <Fragment key={i}>{withIsolatedHebrew(part, i)}</Fragment>;

        const term = match[1];
        const definition = terms?.[term];
        /* An unknown term still reads as the word it is, braces stripped —
           better a missing tooltip than a sentence with punctuation in it. */
        if (!definition) return <Fragment key={i}>{term}</Fragment>;

        return (
          <Tooltip
            key={i}
            label={definition}
            multiline
            w={300}
            withArrow
            events={{ hover: true, focus: true, touch: true }}
          >
            <Text component="span" className="glossed" tabIndex={0}>{term}</Text>
          </Tooltip>
        );
      })}
    </Text>
  );
}
