import { Box, Group, Stack, Text } from "@mantine/core";
import { ROWS, LAYOUT_NAME, hebrewToKey } from "../layout.js";

/* Reference layout. Keys you haven't unlocked are dimmed, the key you need next
   is highlighted, and that's the whole feature — no finger animation, no live
   hand diagram. The point is to answer "where is ח" without leaving the page. */

const ROW_OFFSET = ["0rem", "0.6rem", "1.4rem"]; // the usual staggered rows

export function KeyboardMap({ unlockedLetters, target }) {
  const wanted = new Set([...(target ?? "")].map((ch) => hebrewToKey.get(ch)).filter(Boolean));

  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed">{LAYOUT_NAME}</Text>
      <Stack gap={4}>
        {ROWS.map((row, i) => (
          <Group key={i} gap={4} wrap="nowrap" style={{ paddingInlineStart: ROW_OFFSET[i] }}>
            {row.map(({ key, he }) => {
              const isLetter = /[א-ת]/.test(he);
              const known = unlockedLetters.has(he);
              const active = wanted.has(key);
              return (
                <Box
                  key={key}
                  className={[
                    "kbd-key",
                    !isLetter ? "kbd-punct" : "",
                    isLetter && !known ? "kbd-locked" : "",
                    active ? "kbd-active" : "",
                  ].filter(Boolean).join(" ")}
                  title={`${key.toUpperCase()} → ${he}`}
                >
                  <Box component="span" className="hebrew kbd-he">{he}</Box>
                  <Box component="span" className="kbd-cap">{key}</Box>
                </Box>
              );
            })}
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
