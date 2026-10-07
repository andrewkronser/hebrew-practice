import { Box, Group, Stack, Text } from "@mantine/core";

/* Last two dozen answers, filled for right and hollow for wrong, with the
   session totals alongside.

   This lived inside the transliteration trainer's ProgressGrid file, which
   three other topics reached across for — an import path pointing into a
   sibling topic's folder is the clearest sign a thing is in the wrong place.
   Nothing here is specific to any one topic: it takes a session and draws it. */

export function StatsTape({ session }) {
  return (
    <Group justify="space-between" gap="md">
      <Group gap={3}>
        {session.tape.map((ok, i) => (
          <Box key={i} className={ok ? "tick tick-hit" : "tick tick-miss"} />
        ))}
      </Group>
      <Group gap="lg">
        <Stat label="streak" value={session.streak} />
        <Stat label="best" value={session.best} />
        <Stat label="correct" value={`${session.right}/${session.total}`} />
      </Group>
    </Group>
  );
}

function Stat({ label, value }) {
  return (
    <Text size="sm" c="dimmed">
      {label}{" "}
      <Text span fw={600} c="var(--mantine-color-text)">
        {value}
      </Text>
    </Text>
  );
}
