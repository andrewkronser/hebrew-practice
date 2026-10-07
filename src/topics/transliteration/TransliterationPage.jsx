import {
  Box, Button, Group, Paper, SegmentedControl, Stack, Text, TextInput, Title,
} from "@mantine/core";
import { DIACRITIC_KEYS } from "./data.js";
import { useTrainer } from "./useTrainer.js";
import { AnswerReveal, RecentNames } from "./components/AnswerReveal.jsx";
import { ProgressGrid } from "./components/ProgressGrid.jsx";
import { StatsTape } from "../../shared/components/StatsTape.jsx";
import { ConventionsPanel } from "./components/ConventionsPanel.jsx";

export default function TransliterationPage() {
  const t = useTrainer();
  if (!t.card) return null;

  const { item, isIntro } = t.card;
  const { settings, result, unlocking, seow } = t;

  const prompt = isIntro
    ? "Type it once to add it to your rotation"
    : item.word
      ? "A word built only from characters you've learned"
      : item.v
        ? "Type the vowel sound only — ignore the ב it rests on"
        : "Type how this character is transliterated";

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Transliteration
      </Title>

      {/* Every other section puts its control straight into the page Stack, so
          it fills the reading column. These sat in a Group at their natural
          widths, which read as a different kind of control. One per row, each
          spanning the column, matches Vocabulary and Gender and Number — a
          two-up grid left the odd one stranded at half width. */}
      <Stack gap="sm">
        <SegmentedControl
          fullWidth
          size="xs" value={settings.track} onChange={t.changeTrack}
          data={[{ label: "Unlock letters", value: "curriculum" },
                 { label: "Practice everything", value: "everything" }]}
        />
        {!unlocking && (
          <SegmentedControl
            fullWidth
            size="xs" value={settings.freeMode} onChange={t.changeFreeMode}
            data={[
              { label: "Letters", value: "letters" },
              { label: "Vowels", value: "vowels" },
              { label: "Words", value: "words" },
            ]}
          />
        )}
        <SegmentedControl
          fullWidth
          size="xs" value={settings.style} onChange={t.changeStyle}
          data={[{ label: "Everyday", value: "everyday" }, { label: "Seow", value: "seow" }]}
        />
        {seow && (
          <SegmentedControl
            fullWidth
            size="xs" value={settings.strict} onChange={t.changeStrict}
            data={[{ label: "Forgiving", value: "forgiving" }, { label: "Exact marks", value: "exact" }]}
          />
        )}
      </Stack>

      <Paper withBorder radius="lg" p="xl" shadow="sm">
        <Stack gap="md" align="center">
          {isIntro && (
            <Text size="xs" fw={700} c="tekhelet" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
              New character — {item.n}
            </Text>
          )}

          <Box className={`hebrew glyph${item.word ? " glyph-word" : ""}`} dir="rtl">
            {item.he}
          </Box>

          <Text size="sm" c="dimmed" ta="center" mih="1.5em">
            {isIntro ? (
              <>
                {item.n} →{" "}
                <Text span className="translit" fw={700} c="tekhelet">
                  {seow ? item.a : item.s}
                </Text>
              </>
            ) : t.hintText || prompt}
          </Text>

          <TextInput
            ref={t.inputRef}
            value={t.value}
            onChange={(e) => t.setValue(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); t.submit(); } }}
            readOnly={Boolean(result)}
            placeholder="your answer"
            variant="unstyled"
            size="xl"
            w="100%"
            maw={360}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Transliteration"
            classNames={{ input: "answer-input" }}
          />

          {seow && (
            <Group gap={6} justify="center">
              {DIACRITIC_KEYS.map((k) => (
                <Button
                  key={k} size="compact-sm" variant="default"
                  className="translit" onClick={() => t.insert(k)} tabIndex={-1}
                >
                  {k}
                </Button>
              ))}
            </Group>
          )}

          <Group gap="sm">
            <Button onClick={t.submit}>{result ? "Next" : "Check"}</Button>
            <Button variant="subtle" color="gray" onClick={t.showHint} disabled={Boolean(result) || isIntro}>
              Hint
            </Button>
            <Button variant="subtle" color="gray" onClick={t.reveal} disabled={Boolean(result)}>
              Show answer
            </Button>
          </Group>

          {result && (
            <Box w="100%">
              <AnswerReveal item={item} correct={result.correct} revealed={result.revealed} style={settings.style} />
            </Box>
          )}
        </Stack>
      </Paper>

      <RecentNames items={t.recent} />

      <StatsTape session={t.session} />

      {unlocking && (
        <Box mt="md">
          <ProgressGrid progress={t.progress} onUnlockNext={t.unlockNext} onReset={t.resetAll} />
        </Box>
      )}

      {seow && <ConventionsPanel />}

      <Text size="xs" c="dimmed" lh={1.6}>
        Enter checks, Enter again moves on.{" "}
        {unlocking && "Characters you keep missing come up more often; steady ones fade back. "}
        {seow && settings.strict === "exact"
          ? "Every mark has to match Seow exactly — ḥ is not h, and the parentheses count."
          : "Marks are optional while you learn: h counts for ḥ, torah for tôrā(h)."}
      </Text>
    </Stack>
  );
}
