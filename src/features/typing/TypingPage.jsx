import { Alert, Anchor, Box, Group, Kbd, Paper, SegmentedControl, Stack, Text, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { useTyping } from "./useTyping.js";
import { hebrewToKey, niqqudHint } from "../../shared/hebrewKeyboard.js";
import { CURRICULUM, active, gateLabel, unlockedChars, typableWords, POINTED_WORDS, BARE_WORDS } from "./typing.js";
import { KeyboardMap } from "../../shared/components/KeyboardMap.jsx";
import { StatsTape } from "../transliteration/components/ProgressGrid.jsx";

/* Names the key for a letter, so a miss can say which keys the word needed. */
const keyFor = (ch) => hebrewToKey.get(ch);

export default function TypingPage() {
  const t = useTyping();
  /* Dismissed for this visit only — if the Hebrew input source is still not
     active on a reload, the warning is worth showing again. */
  const [noticeClosed, setNoticeClosed] = useState(false);
  if (!t.card) return null;

  const { item, prompt, isIntro } = t.card;
  const { unlocked } = t.progress;
  const known = unlockedChars(unlocked);
  const gate = gateLabel(t.progress);
  const bare = typableWords(unlocked, BARE_WORDS).length;
  const pointed = typableWords(unlocked, POINTED_WORDS).length;
  const words = bare + pointed;

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">Learn to Type</Title>

      {t.positionMode && !noticeClosed && (
        <Alert
          color="yellow"
          variant="light"
          title="Typing key positions"
          withCloseButton
          closeButtonLabel="Dismiss"
          onClose={() => setNoticeClosed(true)}
        >
          No Hebrew input source seems to be active, so Latin keys are being accepted
          at the positions they'd produce. Points have no bare-key equivalent, so
          switch your OS input to Hebrew before the niqqud stage.
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
            {prompt}
          </Box>

          <Text size="sm" c="dimmed" ta="center" mih="1.5em">
            {isIntro ? (
              item.point
                ? <>{item.name} — <Kbd>{niqqudHint(item.he, t.os, t.learned)}</Kbd> after the letter</>
                : <>on <Kbd>{item.key.toUpperCase()}</Kbd> — type it once</>
            ) : item.word ? (
              <>{item.gloss} — type the whole word</>
            ) : item.point ? (
              <>{item.name} — type the letter, then the point</>
            ) : (
              "type this letter"
            )}
          </Text>

          <TextInput
            ref={t.inputRef}
            value={t.value}
            onChange={(e) => t.change(e.currentTarget.value)}
            onKeyDown={t.noteKey}
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
                    <Box component="span" className="hebrew" fz="lg">{prompt}</Box>
                    {" is "}
                    {[...prompt].map((ch, i) => (
                      <Kbd key={i} ml={4}>
                        {keyFor(ch)?.toUpperCase() ?? niqqudHint(ch, t.os, t.learned) ?? "?"}
                      </Kbd>
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

      <Group justify="space-between" align="center" gap="md">
        <SegmentedControl
          size="xs"
          value={t.os}
          onChange={t.setOs}
          data={[{ label: "macOS", value: "mac" }, { label: "Windows", value: "win" }]}
          aria-label="Keyboard platform"
        />
        <Text size="sm" c="dimmed">
          <Text span fw={600} c="var(--mantine-color-text)">
            {unlocked} of {CURRICULUM.length}
          </Text>{" "}
          keys in rotation{gate ? ` · ${gate}` : ""}
          {words >= 3 ? ` · ${bare} words typable${pointed ? `, ${pointed} pointed` : ""}` : ""}
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

      <KeyboardMap unlockedChars={known} target={prompt} os={t.os} learned={t.learned} />

      <Text size="xs" c="dimmed" lh={1.6}>
        Graded on the character produced, not the key pressed, so it works with whatever
        Hebrew input your system provides. Letters come first, then the points — each
        drilled on a cluster lifted from a real word, so no impossible pointing is ever
        asked for. The platform switch only changes the key hints.
      </Text>
    </Stack>
  );
}
