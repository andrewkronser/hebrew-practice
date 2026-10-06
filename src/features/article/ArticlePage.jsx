import {
  Anchor, Badge, Box, Button, Divider, Grid, Group, Paper, Stack, Switch,
  Table, Text, TextInput, Title,
} from "@mantine/core";
import { useArticleDrill } from "./useArticleDrill.js";
import {
  CONTENTS, DECISION_TABLE, FREE_PRACTICE, lessonById, syllabus,
} from "./lessons.js";
import { SyllabusContents, StreakMeter } from "../../shared/components/SyllabusContents.jsx";
import { BidiText } from "../../shared/components/BidiText.jsx";
import { KeyboardMap } from "../../shared/components/KeyboardMap.jsx";
import { loadSlice } from "../../shared/storage.js";

/* Same layout as the plural rules: the syllabus is a sticky column dressed as
   an aside, and the page header sits inside the reading column so the dividing
   rule runs its full height.

   The keyboard carries no `target` — lighting up the keys would hand over the
   article, which is the entire question. */

export default function ArticlePage() {
  const d = useArticleDrill();
  const os = loadSlice("typing")?.os === "win" ? "win" : "mac";
  if (!d.word) return null;

  const { word, lesson, result, progress } = d;
  const step = lesson ?? FREE_PRACTICE;
  const frontierLesson = lessonById.get(d.frontier) ?? null;

  const header = (
    <Stack gap="sm">
      <Title order={1} size="h2">The Definite Article</Title>
    </Stack>
  );

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 8 }} order={{ base: 1, sm: 1 }}>
        <Stack gap="sm">
          {header}

          {/* Shares the plural drill's rule-panel class for the small-screen
              rules. The panel is deliberately not height-reserved: these
              statements run one to four lines, and reserving for the tallest
              cost enough page to push the keyboard off a laptop screen. */}
          <Paper withBorder radius="md" p="md" className="rule-panel">
            <Stack gap={6}>
              <Group gap="xs" align="baseline" justify="space-between" wrap="nowrap">
                <Group gap="sm" align="baseline" wrap="nowrap">
                  <Text fw={600} size="sm">{step.n}. {step.title}</Text>
                  {step.article && (
                    <Box className="hebrew" fz={20} dir="rtl">{step.article}</Box>
                  )}
                </Group>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>Seow {step.seow}</Text>
              </Group>

              <BidiText size="sm">{step.statement}</BidiText>

              {!d.isFree && !d.revising && (
                <StreakMeter streak={progress.streak} target={d.target} />
              )}
              {!d.isFree && d.revising && frontierLesson && (
                <Text size="xs" c="dimmed">
                  Revising — nothing counts here. Your run continues on{" "}
                  <Anchor component="button" type="button" size="xs"
                          onClick={() => d.goToLesson(d.frontier)}>
                    {frontierLesson.title}
                  </Anchor>.
                </Text>
              )}
            </Stack>
          </Paper>


          <Paper withBorder radius="lg" p="md" shadow="sm">
            <Stack gap={8} align="center">
              <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
                Add the article
              </Text>

              <Box className="hebrew glyph-word" dir="rtl">{word.he}</Box>
              <Text size="sm" c="dimmed">{word.gloss}</Text>

              <TextInput
                ref={d.inputRef}
                value={d.value}
                onChange={(e) => d.setValue(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); d.submit(); } }}
                readOnly={Boolean(result)}
                dir="rtl"
                variant="unstyled"
                size="xl"
                w="100%"
                maw={360}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Definite form"
                classNames={{ input: "hebrew answer-input" }}
              />

              <Box className="drill-footer">
                {result
                  ? <Reveal word={word} result={result} onNext={d.next} />
                  : (
                    <Group gap="sm" justify="center">
                      <Button onClick={d.submit}>Check</Button>
                      <Button variant="subtle" color="gray" onClick={d.reveal}>
                        Show answer
                      </Button>
                    </Group>
                  )}
              </Box>
            </Stack>
          </Paper>

          <Box className="kbd-scroll">
            <KeyboardMap os={os} onType={d.insert} />
          </Box>

          {/* Below the keyboard, not above it: the table is reference material
              you consult while answering, so switching it on must not move the
              keys you are typing with. Above the card it pushed the keyboard
              clean off a 13" screen.

              Rendered conditionally rather than with a Collapse — Mantine's
              left it at display:none here, so the content sat in the DOM
              unseen, which also quietly passed any test that only checked it
              was present. */}
          {d.showTable && (
            <Paper withBorder radius="md" p="md" bg="var(--mantine-color-tekhelet-light)">
              <Table verticalSpacing={4} horizontalSpacing="md" fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>First letter</Table.Th>
                    <Table.Th>Its vowel</Table.Th>
                    <Table.Th>Article</Table.Th>
                    <Table.Th>Dagesh</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {DECISION_TABLE.map((row, i) => (
                    <Table.Tr key={i}>
                      <Table.Td><Box component="span" className="hebrew" dir="rtl">{row.letter}</Box></Table.Td>
                      <Table.Td>{row.vowel}</Table.Td>
                      {/* Larger than the rest of the row: this column is the
                          answer, and patah, qamats and segol are three small
                          marks that are easy to confuse at body size. */}
                      <Table.Td><Box component="span" className="hebrew" fz={22} dir="rtl">{row.article}</Box></Table.Td>
                      <Table.Td>{row.dagesh ? "yes" : "no"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          <Text size="xs" c="dimmed" lh={1.6}>
            Type the whole definite form, fully pointed. The dagesh is graded strictly here —
            it is the only thing separating rule 1 from rule 3.
          </Text>
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 2, sm: 2 }} className="aside-col">
        <Box className="toc-sticky">
          <SyllabusContents
            steps={CONTENTS}
            progress={progress}
            stateOf={syllabus.stateOf}
            onSelect={d.goToLesson}
            labelOf={(s) => `${s.n}. ${s.title}`}
          />
          <Box pl="md" pt="xs">
            <Switch
              size="xs"
              label="Show the table"
              checked={d.showTable}
              onChange={(e) => d.setShowTable(e.currentTarget.checked)}
            />
          </Box>
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
          <Box className="hebrew" fz={24} dir="rtl">{word.def}</Box>
        )}
      </Group>

      {result.forgiven && (
        <Text size="xs" c="dimmed" ta="center" maw={520}>
          Counted as correct — but a letter is in the wrong shape for its position.
        </Text>
      )}

      {result.diagnosis && (
        <Text size="sm" c="red.7" ta="center" maw={520}>{result.diagnosis}</Text>
      )}

      {word.note && (
        <BidiText size="xs" c="dimmed" ta="center" maw={520}>{word.note}</BidiText>
      )}
      {word.was && (
        <Text size="xs" c="dimmed" ta="center" maw={520}>{word.was}</Text>
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
