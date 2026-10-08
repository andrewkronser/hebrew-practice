import {
  Anchor, Badge, Box, Button, Divider, Grid, Group, Paper, Stack, Text, TextInput,
} from "@mantine/core";
import { useGuidedAdjectives } from "./useGuidedAdjectives.js";
import { CONTENTS, MIXED_REVIEW, lessonById, syllabus } from "./lessons.js";
import { COLLECTIVE_NOTE } from "./data.js";
import { GuidedContents, StreakMeter } from "../../shared/components/GuidedContents.jsx";
import { Prose } from "../../shared/components/Prose.jsx";
import { Verdict } from "../../shared/components/Verdict.jsx";
import { KeyboardMap } from "../../shared/components/KeyboardMap.jsx";
import { useOs } from "../../shared/settings.jsx";
import { forgivenLabel, markedClusters } from "../../shared/forgive.js";

const GLOSSARY = {
  attributive: "Describing which noun is meant — \"the good man\". It follows the noun in Hebrew and agrees with it in gender, number and definiteness.",
  predicate: "Saying what the noun is — \"the man is good\". It agrees in gender and number but never takes the article, and may stand before or after the noun.",
  dual: "The form for a natural pair — two hands, two eyes. Nouns have one; adjectives do not.",
  collective: "One word naming many of a thing: צֹאן, a flock.",
};

/* The keyboard carries no `target`: lighting up the keys would hand over the
   form, which is the question. */

export default function GuidedAdjectives({ header = null }) {
  const d = useGuidedAdjectives();
  const os = useOs();
  if (!d.prompt) return null;

  const { prompt, lesson, result, progress } = d;
  const step = lesson ?? MIXED_REVIEW;
  const frontierLesson = lessonById.get(d.frontier) ?? null;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 8 }} order={{ base: 1, sm: 1 }}>
        <Stack gap="sm">
          {header}

          <Paper withBorder radius="md" p="md" className="rule-panel">
            <Stack gap={6}>
              <Group gap="xs" align="baseline" justify="space-between" wrap="nowrap">
                <Text fw={600} size="sm">{step.n}. {step.title}</Text>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>Seow {step.seow}</Text>
              </Group>

              <Prose size="sm" terms={GLOSSARY}>{step.statement}</Prose>

              {!d.isMixed && !d.revising && (
                <StreakMeter streak={progress.streak} target={d.target} />
              )}
              {!d.isMixed && d.revising && frontierLesson && (
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
                Write the adjective
              </Text>

              {/* The noun in its lexical form and the English you are aiming at.
                  The article on the noun is deliberately not shown — knowing it
                  would be there is half of what the step asks.

                  The row runs right to left, so the noun sits on the right and
                  the adjective to its left: the same order the finished phrase
                  has, read the same way. Laid out left to right it said
                  "adjective, then noun" to anyone reading it as Hebrew, which
                  is backwards from what an attributive adjective does. */}
              <Group gap="md" align="baseline" wrap="nowrap" style={{ direction: "rtl" }}>
                <Box className="hebrew glyph-word" dir="rtl">{prompt.noun.he}</Box>
                <Text size="sm" c="dimmed">+</Text>
                <Box className="hebrew" fz={28} dir="rtl">{prompt.adjective.ms}</Box>
              </Group>
              <Text size="sm" c="dimmed">{prompt.gloss}</Text>

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
                aria-label="Adjective"
                classNames={{ input: "hebrew answer-input" }}
              />

              <Box className="answer-footer">
                {result
                  ? <Reveal prompt={prompt} result={result} onNext={d.next} />
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

          {/* §4.c, which is read rather than written — see data.js. */}
          {(step.id === "dual" || step.id === "single") && (
            <Paper withBorder radius="md" p="md" bg="var(--mantine-color-tekhelet-light)">
              <Stack gap={4}>
                <Prose size="xs" terms={GLOSSARY}>{COLLECTIVE_NOTE.statement}</Prose>
                <Text size="xs" c="dimmed">{COLLECTIVE_NOTE.ref}</Text>
              </Stack>
            </Paper>
          )}

          <Text size="xs" c="dimmed" lh={1.6}>
            Type the adjective only, fully pointed — the noun is given. Enter checks, Enter
            again moves on. A dropped dagesh or a letter in the wrong shape is forgiven and
            shown; a wrong form is not.
          </Text>
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 2, sm: 2 }} className="aside-col">
        <Box className="toc-sticky">
          <GuidedContents
            steps={CONTENTS}
            progress={progress}
            stateOf={syllabus.stateOf}
            canOpen={syllabus.canOpen}
            onSelect={d.goToLesson}
            labelOf={(s) => `${s.n}. ${s.title}`}
          />
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

function Reveal({ prompt, result, onNext }) {
  const completed = result.completed ? lessonById.get(result.completed) : null;

  return (
    <Stack gap={6} align="center" w="100%">
      <Divider w="100%" opacity={0.4} />

      <Group gap="sm" align="baseline" wrap="nowrap">
        <Verdict result={result} />
        {(!result.correct || result.forgiven) && (
          <Box className="hebrew" fz={24} dir="rtl">
            {result.forgiven
              ? <Marked answer={prompt.answer} at={result.forgiven.at} />
              : prompt.answer}
          </Box>
        )}
      </Group>

      {/* The whole phrase, which is where the noun's own article turns up. A
          learner who wrote the adjective right but was unsure the noun took one
          finds out here. */}
      <Group gap="sm" align="baseline" wrap="nowrap">
        <Box className="hebrew" fz={22} dir="rtl">{prompt.phrase}</Box>
        <Text size="xs" c="dimmed">{prompt.gloss}</Text>
      </Group>

      {result.forgiven && (
        <Text size="xs" c="dimmed" ta="center" maw={520}>
          Counted as correct — but {forgivenLabel(result.forgiven.kinds)}.
        </Text>
      )}

      {result.diagnosis && (
        <Text size="sm" c="red.7" ta="center" maw={520}>{result.diagnosis}</Text>
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

/* The expected form with the missed cluster bolded. The whole cluster is
   wrapped, not the bare mark: a combining character split into its own element
   has no base to sit on and renders as a stray dot. */
function Marked({ answer, at }) {
  return (
    <>
      {markedClusters(answer, at).map((c, i) =>
        c.flagged
          ? <Box component="span" key={i} className="slip-mark">{c.text}</Box>
          : <Box component="span" key={i}>{c.text}</Box>
      )}
    </>
  );
}
