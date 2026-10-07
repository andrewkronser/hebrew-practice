import { Box, Group, Kbd, Stack, Text } from "@mantine/core";
import {
  ROWS, LAYOUT_NAME, NIQQUD, hebrewToKey, niqqudKey, carrierFor, composedLetter,
} from "../hebrewKeyboard.js";

/* Reference layout, shared by any module that involves typing Hebrew.

   All three props are optional:

   `target`        the string being typed; its keys are highlighted. Leave it
                   out where the answer is what's being tested — in the plural
                   exercise, lighting up the keys would hand over the vowels.
   `unlockedChars` dims letters not yet learned. Omit it and everything shows,
                   which is what a module without its own progression wants.
   `onType`        makes the keys clickable, each sending its character to the
                   caller. A key can carry both a letter and a point, so the
                   cell is a container with two buttons rather than one button
                   with something nested inside it. */

const ROW_OFFSET = ["0rem", "0rem", "0.6rem", "1.4rem"];

const ALL_CHARS = new Set([
  ...ROWS.flat().map((k) => k.he),
  ...NIQQUD.map((n) => n.he),
]);

const isHebrewLetter = (ch) => /[א-ת]/.test(ch);

function pointTitle(point, key, he, os) {
  const cap = key.toUpperCase();
  if (!point) return `${cap} → ${he}`;
  const whole = composedLetter(point.he, os);
  const mod = os === "mac" ? "\u2325" : "AltGr+";
  return whole
    ? `${cap} → ${he}   ·   ${mod}${cap} → ${whole + point.he} (${point.name}, whole letter)`
    : `${cap} → ${he}   ·   ${mod}${cap} → ${point.name}`;
}

export function KeyboardMap({ unlockedChars, target, os = "mac", learned = {}, onType }) {
  const known = unlockedChars ?? ALL_CHARS;
  const wantedPoints = new Set([...(target ?? "")].filter((ch) => NIQQUD.some((n) => n.he === ch)));

  /* Where one key emits a letter and its point together, the letter is not a
     separate press — highlighting it as well would read as "type ש, then שׁ". */
  const composed = new Set([...wantedPoints].map((p) => composedLetter(p, os)).filter(Boolean));
  const wantedKeys = new Set(
    [...(target ?? "")]
      .filter((ch) => !composed.has(ch))
      .map((ch) => hebrewToKey.get(ch))
      .filter(Boolean)
  );

  const pointsByCap = new Map();
  for (const n of NIQQUD) {
    if (!known.has(n.he)) continue;
    const k = niqqudKey(n.he, os, learned);
    if (k?.cap) pointsByCap.set(k.cap, { ...n, ...k });
  }
  const anyGuessed = [...pointsByCap.values()].some((p) => !p.observed);

  /* Keeping focus in the input means the caret stays where the typist left it. */
  const hold = (e) => e.preventDefault();

  return (
    <Stack gap="sm">
      <Group gap="xs" align="baseline">
        <Text size="xs" c="dimmed">{LAYOUT_NAME}</Text>
        {pointsByCap.size > 0 && (
          <Text size="xs" c="dimmed">
            · points need {os === "mac" ? <Kbd>⌥</Kbd> : <Kbd>AltGr</Kbd>}
          </Text>
        )}
        {onType && <Text size="xs" c="dimmed">· click a key to type it</Text>}
      </Group>

      <Stack gap={4}>
        {ROWS.map((row, i) => (
          <Group key={i} gap={4} wrap="nowrap" style={{ paddingInlineStart: ROW_OFFSET[i] }}>
            {row.map(({ key, he }) => {
              const letter = isHebrewLetter(he);
              const unlocked = letter && known.has(he);
              const point = pointsByCap.get(key);
              const activeKey = wantedKeys.has(key);
              const activePoint = point && wantedPoints.has(point.he);
              const idle = !letter && !point;

              const typeable = Boolean(onType) && unlocked;
              const pointTypeable = Boolean(onType) && Boolean(point);

              return (
                <Box
                  key={key}
                  className={[
                    "kbd-key",
                    idle ? "kbd-punct" : "",
                    letter && !unlocked ? "kbd-locked" : "",
                    activeKey ? "kbd-active" : "",
                    activePoint ? "kbd-point-wanted" : "",
                    typeable ? "kbd-typeable" : "",
                  ].filter(Boolean).join(" ")}
                  title={pointTitle(point, key, he, os)}
                >
                  {point && (
                    <Box
                      component={pointTypeable ? "button" : "span"}
                      type={pointTypeable ? "button" : undefined}
                      onMouseDown={pointTypeable ? hold : undefined}
                      onClick={pointTypeable ? () => onType(point.he) : undefined}
                      aria-label={pointTypeable ? `Type ${point.name}` : undefined}
                      className={[
                        "hebrew kbd-niqqud",
                        point.observed ? "kbd-seen" : "",
                        pointTypeable ? "kbd-hit" : "",
                        activePoint ? "kbd-point-active" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {point.shift ? "⇧" : ""}{carrierFor(point.he) + point.he}
                    </Box>
                  )}

                  <Box
                    component={typeable ? "button" : "span"}
                    type={typeable ? "button" : undefined}
                    onMouseDown={typeable ? hold : undefined}
                    onClick={typeable ? () => onType(he) : undefined}
                    aria-label={typeable ? `Type ${he}` : undefined}
                    className={`kbd-face${typeable ? " kbd-hit" : ""}`}
                  >
                    <Box component="span" className="hebrew kbd-he">{he}</Box>
                    <Box component="span" className="kbd-cap">{key}</Box>
                  </Box>
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
