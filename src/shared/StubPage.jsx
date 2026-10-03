import { Stack, Title, Text } from "@mantine/core";

/* Placeholder for sections that exist in the nav but aren't built yet.
   Deliberately bare — but not blank, because an empty <main> reads as a
   bug rather than as a section that's coming. */

export default function StubPage({ title }) {
  return (
    <Stack gap="xs">
      <Title order={1} size="h2">{title}</Title>
      <Text c="dimmed">Not built yet.</Text>
    </Stack>
  );
}
