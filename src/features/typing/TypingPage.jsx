import { Alert, Anchor, Box, Group, Kbd, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useTyping } from "./useTyping.js";
import { CURRICULUM, hebrewToKey } from "./layout.js";
import { active, gateLabel, typableWords } from "./typing.js";
import { KeyboardMap } from "./components/KeyboardMap.jsx";
import { StatsTape } from "../transliteration/components/ProgressGrid.jsx";

/* Names the key for a letter, so a miss can say which keys the word needed. */
const keyFor = (ch) => hebrewToKey.get(ch);

export default function TypingPage() {
  const t = useTyping();
  if (!t.card) return null;

  const { item, isIntro } = t.card;
  const { unlocked } = t.progress;
  const unlockedLetters = new Set(active(unlocked).map((k) => k.he));
  const gate = gateLabel(t.progress);
  const words = typableWords(unlocked).length;

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">Learn to Type</Title>

      {t.positionMode && (
        <Alert color="yellow" variant="light" title="Typing key positions">
          No Hebrew input source seems to be active, so Latin keys are being accepted
          at the positions they'd produce. Switch your OS input to Hebrew to type the
          letters themselves.
        </Alert>
      )}

      <Paper withBorder radius="lg" p="xl" shadow="sm">
        <Stack gap="md" align="center">
          {isIntro && (
            <Text size="xs" fw={700} c="tekhelet" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
              New key
            </Text>
          )}

          <Box className={`hebrew ${item.word ? "glyph-word" : "glyph"}`} dir="rtl">
            {item.he}
          </Box>

          <Text size="sm" c="dimmed" ta="center" mih="1.5em">
            {isIntro ? (
              <>on <Kbd>{item.key.toUpperCase()}</Kbd> — type it once</>
            ) : item.word ? (
              <>{item.gloss} — type the whole word</>
            ) : (
              "type this letter"
            )}
          </Text>

          <TextInput
            ref={t.inputRef}
            value={t.value}
            onChange={(e) => t.change(e.currentTarget.value)}
            readOnly={Boolean(t.result)}
            dir="rtl"
            variant="unstyled"
            size="xl"
            w="100%"
            maw={320}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type here"
            classNames={{ input: "hebrew answer-input" }}
          />

          <Box mih="2.2em">
            {t.result && (
              <Stack gap={4} align="center">
                <Text size="sm" fw={700} c={t.result.correct ? "teal" : "red"}>
                  {t.result.correct ? "Correct" : "Not quite"}
                </Text>
                {!t.result.correct && (
                  <Text size="sm" c="dimmed">
                    <Box component="span" className="hebrew" fz="lg">{item.he}</Box>
                    {" is "}
                    {[...item.he].map((ch, i) => (
                      <Kbd key={i} ml={4}>{(keyFor(ch) ?? "?").toUpperCase()}</Kbd>
                    ))}
                    {" — "}<Kbd>Enter</Kbd> to continue
                  </Text>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>

      <StatsTape session={t.session} />

      <Group justify="space-between" align="baseline" gap="md">
        <Text size="sm" c="dimmed">
          <Text span fw={600} c="var(--mantine-color-text)">
            {unlocked} of {CURRICULUM.length}
          </Text>{" "}
          keys in rotation{gate ? ` · ${gate}` : ""}
          {words >= 3 ? ` · ${words} words typable` : ""}
        </Text>
        <Group gap="md">
          {unlocked < CURRICULUM.length && (
            <Anchor component="button" type="button" size="sm" c="dimmed" onClick={t.unlockNext}>
              Unlock the next one
            </Anchor>
          )}
          <Anchor component="button" type="button" size="sm" c="dimmed" onClick={t.resetAll}>
            Start over
          </Anchor>
        </Group>
      </Group>

      <KeyboardMap unlockedLetters={unlockedLetters} target={item.he} />

      <Text size="xs" c="dimmed" lh={1.6}>
        Graded on the letter produced, not the key pressed, so it works with whatever
        Hebrew input your system provides. Words are real vocabulary with the points
        stripped. Niqqud aren't drilled yet — their key positions differ between
        Windows and macOS.
      </Text>
    </Stack>
  );
}
