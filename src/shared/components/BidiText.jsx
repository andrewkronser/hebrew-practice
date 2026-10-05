import { Box, Text } from "@mantine/core";

/* Hebrew quoted inside an English sentence.

   Dropped into a left-to-right paragraph as bare characters, a Hebrew run lets
   the surrounding punctuation drift to the wrong end — "strip ־ִים, ־וֹת, ־ָה"
   comes out with its commas shuffled. Each run gets its own isolated span so
   the bidi algorithm resolves it on its own and leaves the sentence alone. */

const HEBREW_RUN = /[֐-׿‏־‐-―]+/g;

export function BidiText({ children, ...props }) {
  const text = String(children ?? "");
  const parts = [];
  let last = 0;

  for (const m of text.matchAll(HEBREW_RUN)) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index) });
    parts.push({ t: m[0], he: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last) });

  return (
    <Text {...props}>
      {parts.map((p, i) =>
        p.he
          ? <Box component="span" key={i} className="hebrew" dir="rtl"
                 style={{ unicodeBidi: "isolate" }}>{p.t}</Box>
          : <Box component="span" key={i}>{p.t}</Box>
      )}
    </Text>
  );
}
