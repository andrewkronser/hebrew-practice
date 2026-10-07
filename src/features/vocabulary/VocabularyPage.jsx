import {
  Badge, Box, Button, Divider, Group, Paper, SegmentedControl, Stack, Switch, Text, Title,
} from "@mantine/core";
import { useVocabulary } from "./useVocabulary.js";
import { DIRECTIONS } from "./quiz.js";
import { WordBank } from "./components/WordBank.jsx";
import { StatsTape } from "../../shared/components/StatsTape.jsx";
import { Verdict } from "../../shared/components/Verdict.jsx";

export default function VocabularyPage() {
  const v = useVocabulary();
  if (!v.card) return null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} size="h2">Vocabulary</Title>
        <Switch
          size="sm"
          label="Transliteration hint"
          checked={v.showTranslit}
          onChange={(e) => v.setShowTranslit(e.currentTarget.checked)}
        />
      </Group>

      <SegmentedControl
        size="xs"
        value={v.direction}
        onChange={v.changeDirection}
        data={Object.values(DIRECTIONS).map((d) => ({ label: d.label, value: d.id }))}
        aria-label="Quiz direction"
      />

      <Paper withBorder radius="lg" p="xl" shadow="sm">
        {v.card.kind === "intro" ? (
          <Introduction word={v.card.word} onContinue={v.acknowledge} />
        ) : v.card.kind === "empty" ? (
          <Stack gap="xs" align="center">
            <Text fw={600}>Every unlocked word is switched off.</Text>
            <Text size="sm" c="dimmed" ta="center">
              Click one in the bank below to practise it again, or switch them all back on.
            </Text>
          </Stack>
        ) : (
          <Question
            question={v.card.question}
            result={v.result}
            showTranslit={v.showTranslit}
            onAnswer={v.answer}
            onNext={v.next}
          />
        )}
      </Paper>

      <StatsTape session={v.session} />

      <Box mt="md">
        <WordBank
          progress={v.view}
          disabled={v.disabled}
          onToggle={v.toggleWord}
          onEnableAll={v.enableAll}
          onUnlockNext={v.unlockNext}
          onReset={v.resetAll}
        />
      </Box>

      <Text size="xs" c="dimmed" lh={1.6}>
        Press 1–4 to answer, Enter to move on. Each question shows one sense of the
        word — the first meaning comes up about half the time, with the others
        rotating through the rest. Each direction keeps its own strengths, since
        recognising a word and producing it are different skills. Click any word
        below to stop practising it.
      </Text>
    </Stack>
  );
}

/* A new word arrives with its full sense range, once, before it's ever quizzed —
   otherwise the first question would be testing something never taught. */
function Introduction({ word, onContinue }) {
  return (
    <Stack gap="md" align="center">
      <Text size="xs" fw={700} c="tekhelet" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
        New word
      </Text>
      <Box className="hebrew glyph-word" dir="rtl">{word.he}</Box>
      <Text className="translit" c="dimmed" fz="lg">{word.tr}</Text>
      <Group gap="xs" justify="center" wrap="wrap">
        {word.glosses.map((g) => (
          <Badge key={g} variant="light" color="tekhelet" size="lg" radius="sm">{g}</Badge>
        ))}
      </Group>
      <Text size="sm" c="dimmed" ta="center">
        {word.glosses.length > 1
          ? `${word.glosses.length} senses — questions will cycle through them.`
          : "One sense."}
      </Text>
      <Button onClick={onContinue}>Got it</Button>
    </Stack>
  );
}

function Question({ question, result, showTranslit, onAnswer, onNext }) {
  const { word, options, answer, reverse } = question;

  return (
    <Stack gap="md" align="center">
      <Stack gap={2} align="center">
        {reverse ? (
          /* English prompt: the sense being asked for, nothing else, so the
             Hebrew is never on screen before you have answered. */
          <Text fz={34} fw={600} ta="center" lh={1.25}>{question.prompt}</Text>
        ) : (
          <>
            <Box className="hebrew glyph-word" dir="rtl">{word.he}</Box>
            {/* Reserve the line either way, so switching the hint on doesn't
                shift the options under the cursor mid-question. */}
            <Text className="translit" c="dimmed" fz="lg" mih="1.6em">
              {showTranslit ? word.tr : "\u00A0"}
            </Text>
          </>
        )}
      </Stack>

      <Stack gap="xs" w="100%" maw={420}>
        {options.map((opt, i) => {
          const chosen = result?.chosen === opt;
          let color = "gray";
          let variant = "default";
          if (result) {
            if (opt.correct) { color = "teal"; variant = "light"; }
            else if (chosen) { color = "red"; variant = "light"; }
          }
          return (
            <Button
              key={`${opt.from}-${opt.text}`}
              variant={variant}
              color={color}
              size="md"
              justify="flex-start"
              onClick={() => onAnswer(opt)}
              disabled={Boolean(result) && !opt.correct && !chosen}
              styles={{ label: { whiteSpace: "normal", textAlign: "left" } }}
              leftSection={<Text size="xs" c="dimmed" w={14} ta="center">{i + 1}</Text>}
            >
              {reverse ? (
                <Group gap="sm" align="baseline" wrap="nowrap">
                  <Box component="span" className="hebrew" fz="xl" dir="rtl">{opt.text}</Box>
                  {showTranslit && (
                    <Text span className="translit" size="sm" c="dimmed">{opt.word.tr}</Text>
                  )}
                </Group>
              ) : opt.text}
            </Button>
          );
        })}
      </Stack>

      {result && (
        <>
          <Divider w="100%" opacity={0.4} />
          <Stack gap={6} align="center">
            <Verdict result={result} />
            <Text size="sm" ta="center">
              <Box component="span" className="hebrew" fz="lg">{word.he}</Box>
              {" "}
              <Text span className="translit" c="dimmed">{word.tr}</Text>
              {" — "}
              <Text span fw={600}>{reverse ? question.prompt : answer}</Text>
            </Text>
            {word.glosses.length > 1 && (
              <Text size="xs" c="dimmed" ta="center">
                also: {word.glosses.filter((g) => g !== (reverse ? question.prompt : answer)).join(", ")}
              </Text>
            )}
            <Button mt="xs" onClick={onNext}>Next</Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
