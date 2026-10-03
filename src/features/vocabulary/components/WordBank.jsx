import { Anchor, Box, Group, SimpleGrid, Spoiler, Stack, Text } from "@mantine/core";
import { WORD_BANK } from "../data.js";
import { statOf, isMastered, gateLabel } from "../../../shared/progression.js";

/* Words you've unlocked, in three columns, with a strength bar each.

   Locked words aren't shown at all — there's no value in a wall of greyed-out
   boxes for words you haven't met. That removes any sense of the whole, so the
   count carries it instead. Collapsed by default past a couple of rows. */

export function WordBank({ progress, onUnlockNext, onReset }) {
  const { unlocked, stats } = progress;
  const learned = WORD_BANK.slice(0, unlocked);
  const gate = gateLabel(progress, WORD_BANK);
  const solid = learned.filter((w) => isMastered(stats, w)).length;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="baseline" gap="md">
        <Text size="sm" c="dimmed">
          <Text span fw={600} c="var(--mantine-color-text)">
            {unlocked} of {WORD_BANK.length}
          </Text>{" "}
          words in rotation · {solid} solid{gate ? ` · ${gate}` : ""}
        </Text>
        <Group gap="md">
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

      <Spoiler
        maxHeight={128}
        showLabel="See more…"
        hideLabel="See less"
        styles={{ control: { fontSize: "var(--mantine-font-size-sm)" } }}
      >
        <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="xs" verticalSpacing={6}>
          {learned.map((w) => {
            const r = statOf(stats, w.id);
            const done = isMastered(stats, w);
            return (
              <Box key={w.id} className="bank-cell">
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
            );
          })}
        </SimpleGrid>
      </Spoiler>
    </Stack>
  );
}
