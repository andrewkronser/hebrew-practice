import {
  Anchor, Badge, Box, Button, Divider, Grid, Group, Paper, Stack, Switch, Text,
} from "@mantine/core";
import { useRootDrill } from "./useRootDrill.js";
import {
  LESSONS, syllabus, lessonById, annotatedWord, dotName, SHIN_DOT, SIN_DOT,
} from "./lessons.js";
import { RootCells } from "./components/RootCells.jsx";
import { SyllabusContents, StreakMeter } from "../../shared/components/SyllabusContents.jsx";
import { BidiText } from "../../shared/components/BidiText.jsx";
import { KeyboardMap } from "../../shared/components/KeyboardMap.jsx";
import { ROWS } from "../../shared/hebrewKeyboard.js";
import { loadSlice } from "../../shared/storage.js";

/* Layout follows "Write the form": the syllabus is a sticky column dressed as
   an aside, and the page header sits inside the reading column so the dividing
   rule runs its full height.

   Roots are unpointed, so the reference keyboard is handed letters only — with
   no points in `unlockedChars` the niqqud layer drops out of the map entirely,
   which is what this drill wants. */

/* Letters, plus the two dots — BDB files שׂ and שׁ apart, so the dot is part of
   the answer and has to be typeable. Every other point stays out of the map. */
const ROOT_CHARS = new Set([
  ...ROWS.flat().map((k) => k.he).filter((c) => /[א-ת]/.test(c)),
  SHIN_DOT, SIN_DOT,
]);

export default function RootDrill({ header = null, onFinish }) {
  const d = useRootDrill();
  const os = loadSlice("typing")?.os === "win" ? "win" : "mac";
  if (!d.word && !d.isFree) return null;

  const { word, lesson, result, progress } = d;
  const state = result ? (result.correct ? "right" : "wrong") : null;
  /* Absent once every lesson is finished — there is no frontier left. */
  const frontierLesson = lessonById.get(d.frontier) ?? null;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 8 }} order={{ base: 1, sm: 1 }}>
        <Stack gap="sm">
          {header}

          {d.isFree ? (
            <Paper withBorder radius="md" p="xl">
              <Stack gap="sm" align="center">
                <Badge color="teal" variant="light" size="lg">All eight learned</Badge>
                <Text size="sm" ta="center" maw={440}>
                  Every class has been worked through with its rule named. What is left is
                  deciding which one applies when nothing tells you — which is what Practice
                  roots is for, and where the words no rule reaches get asked.
                </Text>
                <Button mt="xs" onClick={onFinish}>Go to Practice roots</Button>
                <Text size="xs" c="dimmed" ta="center" mt={4}>
                  Any lesson stays open for revising from the list beside this.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <>
            <Paper withBorder radius="md" p="md" className="lesson-panel">
              <Stack gap={6}>
                <Group gap="xs" align="baseline" justify="space-between" wrap="nowrap">
                  <Text fw={600} size="sm">{lesson.n}. {lesson.title}</Text>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>Seow {lesson.seow}</Text>
                </Group>

                <BidiText size="sm">{lesson.statement}</BidiText>

                {!d.revising && <StreakMeter streak={progress.streak} target={d.target} />}
                {/* Revising, with a lesson still in progress to go back to. */}
                {d.revising && frontierLesson && (
                  <Text size="xs" c="dimmed">
                    Revising — nothing counts here. Your run continues on{" "}
                    <Anchor component="button" type="button" size="xs"
                            onClick={() => d.goToLesson(d.frontier)}>
                      {frontierLesson.title}
                    </Anchor>.
                  </Text>
                )}
                {/* Revising with nothing left in progress: the syllabus is done. */}
                {d.revising && !frontierLesson && (
                  <Text size="xs" c="dimmed">
                    Revising — all eight are finished, so nothing accrues here.
                  </Text>
                )}
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" p="md" shadow="sm">
              <Stack gap={8} align="center">
                <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
                  Give the root
                </Text>

                <Box className="hebrew glyph-word" dir="rtl">
                  {annotatedWord(word, {
                    clue: d.showMarks,
                    affix: d.showAffixes,
                  }).map((c, i) => (
                    <Box component="span" key={i}
                         className={c.kind === "clue" ? "slip-mark"
                                  : c.kind === "affix" ? "affix-mark" : undefined}>
                      {c.text}
                    </Box>
                  ))}
                </Box>
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

            {/* Letters and the two ש dots; the rest of the niqqud layer is noise. */}
            <Box className="kbd-scroll">
              <KeyboardMap unlockedChars={ROOT_CHARS} os={os} onType={d.insert} />
            </Box>

            <Text size="xs" c="dimmed" lh={1.6}>
              Type the three radicals unpointed, first on the right. Enter checks, Enter again
              moves on. A final form where the medial belongs is accepted.
            </Text>
            </>
          )}
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 2, sm: 2 }} className="aside-col">
        <Box className="toc-sticky">
          <SyllabusContents
            steps={LESSONS}
            progress={progress}
            stateOf={syllabus.stateOf}
            onSelect={d.goToLesson}
            labelOf={(s) => `${s.n}. ${s.title}`}
          />
          <Stack gap={6} pl="md" pt="xs">
            <Switch
              size="xs"
              label="Show the fingerprint"
              checked={d.showMarks}
              onChange={(e) => d.setShowMarks(e.currentTarget.checked)}
              classNames={{ track: "sw-clue" }}
            />
            <Switch
              size="xs"
              label="Show the affixes"
              checked={d.showAffixes}
              onChange={(e) => d.setShowAffixes(e.currentTarget.checked)}
              classNames={{ track: "sw-affix" }}
            />
          </Stack>
          <Group justify="flex-end" mt="xs">
            <Anchor component="button" type="button" size="xs" c="dimmed" onClick={d.resetAll}>
              Start over
            </Anchor>
          </Group>
        </Box>
      </Grid.Col>
    </Grid>
  );
}

function Reveal({ word, result, onNext }) {
  const completed = result.completed ? lessonById.get(result.completed) : null;

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

      {completed && (
        <Badge color="teal" variant="light">
          {completed.n}. {completed.title} — done
        </Badge>
      )}

      <Button size="xs" variant="light" onClick={onNext} mt={2}>Next</Button>
    </Stack>
  );
}
