import { Box, Group, Kbd, Stack, Text } from "@mantine/core";
import { ROWS, LAYOUT_NAME, NIQQUD, hebrewToKey, niqqudKey } from "../hebrewKeyboard.js";

/* Every letter and point, for callers that have no progression of their own. */
const ALL_CHARS = new Set([
  ...ROWS.flat().map((k) => k.he),
  ...NIQQUD.map((n) => n.he),
]);

/* Reference layout, shared by any module that involves typing Hebrew.

   `target` is optional: pass the string currently being typed to highlight the
   keys it needs, or leave it out for a plain reference chart. `unlockedChars`
   is likewise optional — omit it and every letter is shown as available, which
   is what a module without its own progression wants.

   Letters you haven't unlocked are dimmed, the key you need next is
   highlighted, and that's the whole feature — no finger animation.

   Points are drawn on the keys they actually live on rather than in a separate
   strip, which is why the number row is here: on macOS that's where most of
   them sit. A point shown from the published chart rather than from a keystroke
   we've watched is marked, because those charts have been wrong before. */

const ROW_OFFSET = ["0rem", "0rem", "0.6rem", "1.4rem"];
const CARRIER = "ב"; // ב, so a bare point has something to sit on

export function KeyboardMap({ unlockedChars, target, os = "mac", learned = {} }) {
  /* No progression supplied: treat the whole keyboard as available. */
  const known = unlockedChars ?? ALL_CHARS;
  const wantedKeys = new Set([...(target ?? "")].map((ch) => hebrewToKey.get(ch)).filter(Boolean));
  const wantedPoints = new Set([...(target ?? "")].filter((ch) => NIQQUD.some((n) => n.he === ch)));

  /* cap -> the point that lives there, for points already unlocked. */
  const pointsByCap = new Map();
  for (const n of NIQQUD) {
    if (!known.has(n.he)) continue;
    const k = niqqudKey(n.he, os, learned);
    if (k?.cap) pointsByCap.set(k.cap, { ...n, ...k });
  }
  const anyGuessed = [...pointsByCap.values()].some((p) => !p.observed);

  return (
    <Stack gap="sm">
      <Group gap="xs" align="baseline">
        <Text size="xs" c="dimmed">{LAYOUT_NAME}</Text>
        {pointsByCap.size > 0 && (
          <Text size="xs" c="dimmed">
            · points need {os === "mac" ? <Kbd>⌥</Kbd> : <Kbd>AltGr</Kbd>}
          </Text>
        )}
      </Group>

      <Stack gap={4}>
        {ROWS.map((row, i) => (
          <Group key={i} gap={4} wrap="nowrap" style={{ paddingInlineStart: ROW_OFFSET[i] }}>
            {row.map(({ key, he }) => {
              const isLetter = /[א-ת]/.test(he);
              const unlocked = isLetter && known.has(he);
              const point = pointsByCap.get(key);
              const activeKey = wantedKeys.has(key);
              const activePoint = point && wantedPoints.has(point.he);
              const idle = !isLetter && !point;
              return (
                <Box
                  key={key}
                  className={[
                    "kbd-key",
                    idle ? "kbd-punct" : "",
                    isLetter && !unlocked ? "kbd-locked" : "",
                    activeKey || activePoint ? "kbd-active" : "",
                  ].filter(Boolean).join(" ")}
                  title={point ? `${point.shift ? "Shift+" : ""}${key.toUpperCase()} → ${point.name}` : `${key.toUpperCase()} → ${he}`}
                >
                  {point && (
                    <Box
                      component="span"
                      className={`hebrew kbd-niqqud${point.observed ? " kbd-seen" : ""}`}
                      title={point.name}
                    >
                      {point.shift ? "⇧" : ""}{CARRIER + point.he}
                    </Box>
                  )}
                  <Box component="span" className="hebrew kbd-he">{he}</Box>
                  <Box component="span" className="kbd-cap">{key}</Box>
                </Box>
              );
            })}
          </Group>
        ))}
      </Stack>

      {anyGuessed && (
        <Text size="xs" c="dimmed">
          Points in a dotted box come from a published chart and aren't confirmed —
          type one and the map corrects itself to the key you actually pressed.
        </Text>
      )}
    </Stack>
  );
}
