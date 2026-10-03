import { Paper, Group, Stack, Text, Box, Divider } from "@mantine/core";

/* Shown once you've answered. For a single character the letter's *name* is the
   largest thing here on purpose — the glyph and its transliteration are already
   in front of you, but the name is the part that needs drilling. */

export function AnswerReveal({ item, correct, revealed, style }) {
  const tone = revealed ? "gray" : correct ? "teal" : "red";
  const verdict = revealed ? "Answer" : correct ? "Correct" : "Not quite";
  const isWord = Boolean(item.word);

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      bg={`var(--mantine-color-${tone}-light)`}
      style={{ borderColor: `var(--mantine-color-${tone}-outline)` }}
    >
      <Stack gap="sm">
        <Text size="xs" fw={700} c={tone} tt="uppercase" style={{ letterSpacing: "0.06em" }}>
          {verdict}
        </Text>

        <Group gap="lg" wrap="nowrap" align="center">
          <Box className="reveal-glyph" aria-hidden="true">
            {item.he}
          </Box>

          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text className="reveal-name" fw={600}>
              {isWord ? item.g : item.n}
            </Text>
            <Group gap="xs" wrap="wrap" align="baseline">
              <Text className="translit" fz="xl" fw={500}>
                {item.a}
              </Text>
              <Text size="sm" c="dimmed">
                Seow
              </Text>
              <Text c="dimmed">·</Text>
              <Text className="translit" fz="lg" c="dimmed">
                {item.s}
              </Text>
              <Text size="sm" c="dimmed">
                everyday
              </Text>
            </Group>
            {isWord && (
              <Text size="sm" c="dimmed" mt={2}>
                letter name drill applies to single characters
              </Text>
            )}
          </Stack>
        </Group>

        {item.note && (
          <>
            <Divider opacity={0.4} />
            <Text size="sm" c="dimmed">
              {item.note}
            </Text>
          </>
        )}
      </Stack>
    </Paper>
  );
}

/* A running tail of the characters you've just seen, names attached, so they
   stay in view while you answer the next card. */
export function RecentNames({ items }) {
  if (!items.length) return null;
  return (
    <Group gap="lg" justify="center" wrap="wrap">
      {items.map((it, i) => (
        <Group key={`${it.id}-${i}`} gap={6} align="baseline">
          <Box component="span" className="hebrew" fz="lg">
            {it.he}
          </Box>
          <Text size="sm" c="dimmed">
            {it.n}
          </Text>
        </Group>
      ))}
    </Group>
  );
}
