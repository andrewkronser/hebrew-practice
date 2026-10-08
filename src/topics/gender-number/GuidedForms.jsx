import { useState } from "react";
import {
  Anchor, Badge, Box, Button, Divider, Grid, Group, Paper, Stack, Text, TextInput,
} from "@mantine/core";
import { useGuidedForms, ruleState } from "./useGuidedForms.js";
import { CONTENTS, MIXED_REVIEW, GLOSSARY, REDUCTION_PREAMBLE, ruleById, syllabus } from "./rules.js";
import { GuidedContents, StreakMeter } from "../../shared/components/GuidedContents.jsx";
import { Prose } from "../../shared/components/Prose.jsx";
import { useOs } from "../../shared/settings.jsx";
import { KeyboardMap } from "../../shared/components/KeyboardMap.jsx";
import { forgivenLabel, markedClusters } from "../../shared/forgive.js";
import { Verdict } from "../../shared/components/Verdict.jsx";

/* Layout note: the syllabus column is styled to read as an aside — a pinned,
   full-height region with a dividing rule — without being an AppShell.Aside.
   A real aside would cost a portal to cross the component tree, a media-query
   fallback so the syllabus doesn't vanish on a phone, and an answer for what
   the other mode puts there. As page content it needs none of that, the Grid
   stacks it on small screens for free, and the reading column works out the
   same width either way.

   Separately, the keyboard is reference material and must not move while you
   work. Two things above it would otherwise change height — the rule panel,
   whose statement runs one to three lines, and the card's lower half, which
   swaps the buttons for the reveal. Both get a reserved height, so switching
   rules and answering a question leave the keyboard exactly where it was.

   The reduction preamble is the one genuinely tall block, so it collapses by
   default. Expanding it does shift the page, but that is the reader's own
   doing rather than something that happens under their hands. */

export default function GuidedForms({ header = null }) {
  const os = useOs();
  const d = useGuidedForms();
  const [showPreamble, setShowPreamble] = useState(false);
  if (!d.prompt) return null;

  const { prompt, rule, result, progress } = d;
  const inReduction = rule?.group === "Reduction";

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 8 }} order={{ base: 1, sm: 1 }}>
        <Stack gap="sm">
          {header}

          <Paper withBorder radius="md" p="md" className="rule-panel">
            <Stack gap={6}>
              <Group gap="xs" align="baseline" justify="space-between" wrap="nowrap">
                <Text fw={600} size="sm">
                  {d.isMixed ? MIXED_REVIEW.title : `${rule.n}. ${rule.title}`}
                </Text>
                {inReduction && (
                  <Anchor
                    component="button"
                    type="button"
                    size="xs"
                    c="dimmed"
                    onClick={() => setShowPreamble((v) => !v)}
                    style={{ flexShrink: 0 }}
                  >
                    {showPreamble ? "Hide" : "How reduction works"}
                  </Anchor>
                )}
              </Group>

              <Prose terms={GLOSSARY} size="sm">{d.isMixed ? MIXED_REVIEW.statement : rule.statement}</Prose>

              {/* The streak belongs to the rule in progress, so while you are
                  revising a finished one there is no run to show here — the
                  meter used to pair the frontier's count with this rule's
                  target and read "2 of 5" for a run of 2 of 8. */}
              {!d.isMixed && !d.revising && (
                <StreakMeter streak={progress.streak} target={d.target} />
              )}
              {!d.isMixed && d.revising && (
                <Text size="xs" c="dimmed">
                  Revising — nothing counts here. Your run continues on{" "}
                  <Anchor component="button" type="button" size="xs"
                          onClick={() => d.goToRule(d.frontier)}>
                    {ruleById.get(d.frontier)?.title ?? "Mixed Review"}
                  </Anchor>.
                </Text>
              )}
            </Stack>
          </Paper>

          {/* Not Collapse: it left this at display:none, so the preamble never
              actually appeared — and a test that only looked for the text in
              the DOM found it anyway and passed. */}
          {inReduction && showPreamble && (
            <Paper withBorder radius="md" p="md" bg="var(--mantine-color-tekhelet-light)">
              <Stack gap={4}>
                {REDUCTION_PREAMBLE.map((line, i) => (
                  <Prose terms={GLOSSARY} key={i} size="xs">{line}</Prose>
                ))}
              </Stack>
            </Paper>
          )}

          <Paper withBorder radius="lg" p="md" shadow="sm">
            <Stack gap={8} align="center">
              <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
                Give the {prompt.target}
              </Text>

              <Box className="hebrew glyph-word" dir="rtl">{prompt.he}</Box>
              {/* Rendered only when on, rather than held blank. This mode has
                  no transliteration toggle, so holding the line reserved 29px
                  of page for a hint that cannot currently be shown. If a toggle
                  is added here, flipping it will shift the card by one line. */}
              {d.showTranslit && (
                <Text className="translit" c="dimmed" fz="lg">{prompt.tr}</Text>
              )}
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
                maw={340}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Plural form"
                classNames={{ input: "hebrew answer-input" }}
              />

              {/* Reserved: buttons before answering, the reveal after. A hint,
                  where a word has one, sits inside the same block so it costs
                  no extra height. */}
              <Box className="answer-footer">
                {result
                  ? <Reveal prompt={prompt} result={result} onNext={d.next} />
                  : (
                    <Stack gap="sm" align="center">
                      {prompt.hint && (
                        <Text size="xs" c="dimmed" ta="center" maw={520} fs="italic">
                          {prompt.hint}
                        </Text>
                      )}
                      <Group gap="sm" justify="center">
                        <Button onClick={d.submit}>Check</Button>
                        <Button variant="subtle" color="gray" onClick={d.reveal}>
                          Show answer
                        </Button>
                      </Group>
                    </Stack>
                  )}
              </Box>
            </Stack>
          </Paper>

          {/* No `target`: highlighting the keys for the answer would hand over
              the vowels, which are the whole thing being tested. */}
          <Box className="kbd-scroll">
            <KeyboardMap os={os} onType={d.insert} />
          </Box>

          <Text size="xs" c="dimmed" lh={1.6}>
            Type the fully pointed form — these rules are entirely about vowels, so an
            unpointed answer can't be graded. Enter checks, Enter again moves on. A wrong
            answer resets the streak, typos included.
          </Text>
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }} order={{ base: 2, sm: 2 }} className="aside-col">
        <Box className="toc-sticky">
          <GuidedContents
            steps={CONTENTS}
            progress={progress}
            stateOf={ruleState}
            canOpen={syllabus.canOpen}
            onSelect={d.goToRule}
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

/* The input above still shows what you typed, so this doesn't repeat it — just
   the verdict, the form that was wanted, and why your answer missed. */
function Reveal({ prompt, result, onNext }) {
  const completed = result.completed ? ruleById.get(result.completed) : null;

  return (
    <Stack gap={6} align="center" w="100%">
      <Divider w="100%" opacity={0.4} />

      <Group gap="sm" align="baseline" wrap="nowrap">
        <Verdict result={result} />
        {/* A forgiven answer still shows the form, so the slip is visible
            rather than merely described. */}
        {(!result.correct || result.forgiven) && (
          <>
            <Box className="hebrew" fz={24} dir="rtl">
              {result.forgiven
                ? <MarkedForm answer={prompt.answer} at={result.forgiven.at} />
                : prompt.answer}
            </Box>
            <Text className="translit" size="sm" c="dimmed">{prompt.answerTr}</Text>
          </>
        )}
      </Group>

      {result.forgiven && (
        <Text size="xs" c="dimmed" ta="center" maw={520}>
          Counted as correct — but {forgivenLabel(result.forgiven.kinds)}.
        </Text>
      )}

      {result.diagnosis && (
        <Text size="sm" c="red.7" ta="center" maw={520}>{result.diagnosis}</Text>
      )}

      {prompt.note && (
        <Prose terms={GLOSSARY} size="xs" c="dimmed" ta="center" maw={520}>{prompt.note}</Prose>
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
   wrapped, not the bare dagesh: a combining mark split into its own element
   has no base to sit on and renders as a stray dot. */
function MarkedForm({ answer, at }) {
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
