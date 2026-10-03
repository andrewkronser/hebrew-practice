import { Box, Group, Kbd, Stack, Text } from "@mantine/core";
import { ROWS, LAYOUT_NAME, NIQQUD, hebrewToKey } from "../layout.js";

/* Reference layout. Keys you haven't unlocked are dimmed, the key you need next
   is highlighted, and that's the whole feature — no finger animation, no live
   hand diagram.

   Points get their own strip below, because they live on a modifier layer and
   on macOS mostly on the number row, which isn't drawn here. */

const ROW_OFFSET = ["0rem", "0.6rem", "1.4rem"]; // the usual staggered rows
const CARRIER = "ב"; // ב, so a bare point has something to sit on

export function KeyboardMap({ unlockedChars, target, os }) {
  const wantedKeys = new Set([...(target ?? "")].map((ch) => hebrewToKey.get(ch)).filter(Boolean));
  const wantedPoints = new Set([...(target ?? "")]);
  const anyPointUnlocked = NIQQUD.some((n) => unlockedChars.has(n.he));

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">{LAYOUT_NAME}</Text>

      <Stack gap={4}>
        {ROWS.map((row, i) => (
          <Group key={i} gap={4} wrap="nowrap" style={{ paddingInlineStart: ROW_OFFSET[i] }}>
            {row.map(({ key, he }) => {
              const isLetter = /[א-ת]/.test(he);
              const known = unlockedChars.has(he);
              const active = wantedKeys.has(key);
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

      {anyPointUnlocked && (
        <Stack gap={6} mt="xs">
          <Text size="xs" c="dimmed">
            Niqqud — hold {os === "mac" ? <Kbd>⌥</Kbd> : <Kbd>AltGr</Kbd>}
          </Text>
          <Group gap={6}>
            {NIQQUD.filter((n) => unlockedChars.has(n.he)).map((n) => (
              <Box
                key={n.id}
                className={`kbd-key kbd-point${wantedPoints.has(n.he) ? " kbd-active" : ""}`}
                title={n.name}
              >
                <Box component="span" className="hebrew kbd-he">{CARRIER + n.he}</Box>
                <Box component="span" className="kbd-cap">
                  {(os === "mac" ? n.mac : n.win).toUpperCase()}
                </Box>
              </Box>
            ))}
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
