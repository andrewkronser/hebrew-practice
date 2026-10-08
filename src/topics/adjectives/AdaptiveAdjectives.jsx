import {
  Anchor, Box, Button, Divider, Group, Paper, SimpleGrid, Stack, Text,
} from "@mantine/core";
import { useAdaptiveAdjectives } from "./useAdaptiveAdjectives.js";
import { CLASSES, classById } from "./reading.js";
import { StatsTape } from "../../shared/components/StatsTape.jsx";
import { Verdict } from "../../shared/components/Verdict.jsx";
import { Prose } from "../../shared/components/Prose.jsx";

/* The reading half: one phrase, four readings, pick what the adjective is
   doing. The sibling of GuidedAdjectives, which asks you to write a form —
   this asks what a form you are shown amounts to, which is the part of the
   lesson production cannot reach. */

export default function AdaptiveAdjectives() {
  const d = useAdaptiveAdjectives();
  if (!d.phrase) return null;

  const { phrase, result } = d;

  return (
    <Stack gap="lg">
      <Paper withBorder radius="lg" p="xl" shadow="sm">
        <Stack gap="md" align="center">
          <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
            What is the adjective doing?
          </Text>

          <Box className="hebrew glyph-word" dir="rtl">{phrase.he}</Box>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" w="100%" maw={620}>
            {/* Mantine variants rather than classes of our own, the way the
                identify drill marks its cells — right in teal, your wrong pick
                in red, the rest left alone. */}
            {CLASSES.map((c) => {
              const chosen = result?.chosen === c.id;
              const isAnswer = phrase.answer === c.id;
              let color = "gray";
              let variant = "default";
              if (result) {
                if (isAnswer) { color = "teal"; variant = "light"; }
                else if (chosen) { color = "red"; variant = "light"; }
              }
              return (
                <Button
                  key={c.id}
                  variant={variant}
                  color={color}
                  h="auto"
                  py={8}
                  onClick={() => d.answer(c.id)}
                  disabled={Boolean(result)}
                  /* The visible text is two fragments — the reading and a gloss
                     of it — so the button needs a name of its own. */
                  aria-label={c.label}
                  styles={{ label: { display: "block", whiteSpace: "normal" } }}
                >
                  <Text size="sm" fw={600}>{c.label}</Text>
                  <Text size="xs" c="dimmed" fw={400}>{c.short}</Text>
                </Button>
              );
            })}
          </SimpleGrid>

          <Box className="answer-footer">
            {result && (
              <Stack gap={6} align="center" w="100%">
                <Divider w="100%" opacity={0.4} />
                <Group gap="sm" align="baseline" wrap="nowrap">
                  <Verdict result={result} />
                  <Text size="sm" fw={600}>{classById.get(phrase.answer)?.label}</Text>
                </Group>
                <Text size="sm" ta="center" maw={560}>{phrase.gloss}</Text>
                <Prose size="xs" c="dimmed" ta="center" maw={560}>{phrase.why}</Prose>
                <Button size="xs" variant="light" onClick={d.next} mt={2}>Next</Button>
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>

      <StatsTape session={d.session} />

      <Group justify="space-between" align="center" gap="md">
        <Text size="sm" c="dimmed">
          Every phrase stays in rotation; the ones you misread come round more often.
        </Text>
        <Anchor component="button" type="button" size="sm" c="dimmed" onClick={d.resetAll}>
          Start over
        </Anchor>
      </Group>

      <Text size="xs" c="dimmed" lh={1.6}>
        Two things settle it when they are there: an article on both words means attributive,
        and an adjective standing first means predicate. With an indefinite noun and the
        adjective following, neither applies — and then "either" is the right answer, not a
        cop-out.
      </Text>
    </Stack>
  );
}
