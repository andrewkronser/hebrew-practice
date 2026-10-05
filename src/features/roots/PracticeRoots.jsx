import {
  Anchor, Badge, Box, Button, Divider, Grid, Group, Paper, Stack, Text,
} from "@mantine/core";
import { usePracticeRoots } from "./usePracticeRoots.js";
import { lessonById, dotName, SHIN_DOT, SIN_DOT } from "./lessons.js";
import { RootCells } from "./components/RootCells.jsx";
import { ClassHealth } from "./components/ClassHealth.jsx";
import { BidiText } from "../../shared/components/BidiText.jsx";
import { KeyboardMap } from "../../shared/components/KeyboardMap.jsx";
import { ROWS } from "../../shared/hebrewKeyboard.js";
import { loadSlice } from "../../shared/storage.js";

/* Same layout as the lessons, with the syllabus swapped for the health
   readout — and no hint toggles. There the class is announced and the switches
   point at the clue; here spotting it unaided is the whole exercise, so a
   fingerprint highlight would hollow the thing out. */

const ROOT_CHARS = new Set([
  ...ROWS.flat().map((k) => k.he).filter((c) => /[א-ת]/.test(c)),
  SHIN_DOT, SIN_DOT,
]);

export default function PracticeRoots({ header = null }) {
  const d = usePracticeRoots();
  const os = loadSlice("typing")?.os === "win" ? "win" : "mac";
  if (!d.word) return null;

  const { word, result } = d;
  const state = result ? (result.correct ? "right" : "wrong") : null;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 8 }} order={{ base: 1, sm: 1 }}>
        <Stack gap="sm">
          {header}

          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" align="baseline" wrap="nowrap">
              <Text size="sm">
                Every class mixed, nothing announced. Which rule applies is the question.
              </Text>
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                {d.session.asked > 0 ? `${d.session.right} of ${d.session.asked}` : " "}
              </Text>
            </Group>
          </Paper>

          <Paper withBorder radius="lg" p="md" shadow="sm">
            <Stack gap={8} align="center">
              <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
                Give the root
              </Text>

              <Box className="hebrew glyph-word" dir="rtl">{word.he}</Box>
              <Text size="sm" c="dimmed">{word.gloss}</Text>

              <RootCells
                cells={d.cells}
                refs={d.cellRefs}
                onChange={d.setCell}
                onFocusCell={d.focusCell}
                onKeyDown={d.cellKeyDown}
                state={state}
              />

              <Box className="drill-footer">
                {result
                  ? <Reveal word={word} result={result} onNext={d.next} />
                  : (
                    <Group gap="sm" justify="center">
                      <Button onClick={d.submit} disabled={!d.ready}>Check</Button>
                      <Button variant="subtle" color="gray" onClick={d.reveal}>
                        Show answer
                      </Button>
                    </Group>
                  )}
              </Box>
            </Stack>
          </Paper>

          <Box className="kbd-scroll">
            <KeyboardMap unlockedChars={ROOT_CHARS} os={os} onType={d.insert} />
          </Box>

          <Text size="xs" c="dimmed" lh={1.6}>
            Words come up weighted toward whichever classes you are shakiest on, so the
            mix shifts as you go. Showing the answer counts as a miss.
          </Text>
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 2, sm: 2 }} className="aside-col">
        <Box className="toc-sticky">
          <ClassHealth health={d.health} />
          <Group justify="flex-end" mt="xs" pr="xs">
            <Anchor component="button" type="button" size="xs" c="dimmed" onClick={d.resetAll}>
              Reset progress
            </Anchor>
          </Group>
        </Box>
      </Grid.Col>
    </Grid>
  );
}

function Reveal({ word, result, onNext }) {
  const cls = lessonById.get(word.lesson);

  return (
    <Stack gap={6} align="center" w="100%">
      <Divider w="100%" opacity={0.4} />

      <Group gap="sm" align="baseline" wrap="nowrap">
        <Text size="sm" fw={700} c={result.correct ? "teal" : "red"}>
          {result.correct ? "Correct" : result.revealed ? "Answer" : "Not quite"}
        </Text>
        {(!result.correct || result.forgiven) && (
          <Box className="hebrew" fz={24} dir="rtl">{word.letters.join("")}</Box>
        )}
        {/* Naming the class is the teaching here: it is what you had to work out. */}
        <Badge size="sm" variant="light" color={word.memorise ? "grape" : "gray"}>
          {word.memorise ? "Exception" : cls?.title ?? ""}
        </Badge>
      </Group>

      {result.forgiven && (
        <Text size="xs" c="dimmed" ta="center" maw={520}>
          Counted as correct — but the ש is {result.forgiven.dots.map(dotName).join(" and ")}.
        </Text>
      )}

      {result.diagnosis && (
        <Text size="sm" c="red.7" ta="center" maw={520}>{result.diagnosis}</Text>
      )}

      {word.note && (
        <BidiText size="xs" c="dimmed" ta="center" maw={520}>{word.note}</BidiText>
      )}

      <Button size="xs" variant="light" onClick={onNext} mt={2}>Next</Button>
    </Stack>
  );
}
