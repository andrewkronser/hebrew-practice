import { useState } from "react";
import { Anchor, Box, Group, SimpleGrid, Spoiler, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { WORD_BANK } from "../data.js";
import { statOf, isMastered, gateLabel } from "../../../shared/progression.js";

/* Words you've unlocked, in three columns, with a strength bar each.

   Locked words aren't shown at all — there's no value in a wall of greyed-out
   boxes for words you haven't met. That removes any sense of the whole, so the
   count carries it instead.

   Click a word to switch it off: it stops being asked and stops holding up the
   unlock gate, so a set that's grown unwieldy can be trimmed by hand. It stays
   in the bank as a distractor, since a word you know well is a good wrong
   answer. The filter is display-only and never changes what's practised. */

export function WordBank({ progress, disabled, onToggle, onEnableAll, onUnlockNext, onReset }) {
  const [query, setQuery] = useState("");
  const { unlocked, stats } = progress;

  const learned = WORD_BANK.slice(0, unlocked);
  const off = learned.filter((w) => disabled[w.id]).length;
  const gate = gateLabel(progress, WORD_BANK, (w) => disabled[w.id]);
  const solid = learned.filter((w) => isMastered(stats, w) && !disabled[w.id]).length;

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? learned.filter((w) =>
        w.he.includes(query.trim()) ||
        w.key.includes(needle) ||
        w.glosses.some((g) => g.toLowerCase().includes(needle)))
    : learned;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="baseline" gap="md">
        <Text size="sm" c="dimmed">
          <Text span fw={600} c="var(--mantine-color-text)">
            {unlocked - off} of {WORD_BANK.length}
          </Text>{" "}
          words in practice · {solid} solid
          {off ? ` · ${off} switched off` : ""}
          {gate ? ` · ${gate}` : ""}
        </Text>
        <Group gap="md">
          {off > 0 && (
            <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onEnableAll}>
              Switch all back on
            </Anchor>
          )}
          {unlocked < WORD_BANK.length && (
            <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onUnlockNext}>
              Unlock the next one
            </Anchor>
          )}
          <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onReset}>
            Start over
          </Anchor>
        </Group>
      </Group>

      <TextInput
        size="xs"
        placeholder="Filter by Hebrew or meaning"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        aria-label="Filter words"
      />

      <Spoiler
        maxHeight={needle ? 10000 : 128}
        showLabel="See more…"
        hideLabel="See less"
        styles={{ control: { fontSize: "var(--mantine-font-size-sm)" } }}
      >
        {shown.length === 0 ? (
          <Text size="sm" c="dimmed">Nothing matches “{query.trim()}”.</Text>
        ) : (
          <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="xs" verticalSpacing={6}>
            {shown.map((w) => {
              const r = statOf(stats, w.id);
              const done = isMastered(stats, w);
              const isOff = Boolean(disabled[w.id]);
              return (
                <Tooltip
                  key={w.id}
                  label={isOff ? "Switched off — click to practise again" : "Click to stop practising"}
                  withArrow
                  openDelay={400}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onToggle(w.id)}
                    className={`bank-cell${isOff ? " bank-off" : ""}`}
                    aria-pressed={!isOff}
                  >
                    <Group gap="xs" wrap="nowrap" align="baseline" justify="space-between">
                      <Box className="hebrew" fz="lg" dir="rtl" style={{ lineHeight: 1.4 }}>
                        {w.he}
                      </Box>
                      <Text size="xs" c="dimmed" truncate style={{ minWidth: 0 }}>
                        {w.glosses[0]}
                      </Text>
                    </Group>
                    <Box className="tile-bar" w="100%">
                      <Box
                        className="tile-fill"
                        style={{
                          width: `${Math.round(r.s * 100)}%`,
                          background: done
                            ? "var(--mantine-color-teal-6)"
                            : "var(--mantine-color-tekhelet-6)",
                        }}
                      />
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}
          </SimpleGrid>
        )}
      </Spoiler>
    </Stack>
  );
}
