import { Badge, Box, Button, Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useVocabulary } from "./useVocabulary.js";
import { WordBank } from "./components/WordBank.jsx";
import { StatsTape } from "../transliteration/components/ProgressGrid.jsx";

export default function VocabularyPage() {
  const v = useVocabulary();
  if (!v.card) return null;

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">Vocabulary</Title>

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
          <Question question={v.card.question} result={v.result} onAnswer={v.answer} onNext={v.next} />
        )}
      </Paper>

      <StatsTape session={v.session} />

      <Box mt="md">
        <WordBank
          progress={v.progress}
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
        rotating through the rest. Click any word below to stop practising it.
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

function Question({ question, result, onAnswer, onNext }) {
  const { word, options, answer } = question;

  return (
    <Stack gap="md" align="center">
      <Box className="hebrew glyph-word" dir="rtl">{word.he}</Box>

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
              leftSection={
                <Text size="xs" c="dimmed" w={14} ta="center">{i + 1}</Text>
              }
            >
              {opt.text}
            </Button>
          );
        })}
      </Stack>

      {result && (
        <>
          <Divider w="100%" opacity={0.4} />
          <Stack gap={6} align="center">
            <Text size="sm" fw={700} c={result.correct ? "teal" : "red"}>
              {result.correct ? "Correct" : "Not quite"}
            </Text>
            <Text size="sm" ta="center">
              <Box component="span" className="hebrew" fz="lg">{word.he}</Box>
              {" — "}
              <Text span fw={600}>{answer}</Text>
            </Text>
            {word.glosses.length > 1 && (
              <Text size="xs" c="dimmed" ta="center">
                also: {word.glosses.filter((g) => g !== answer).join(", ")}
              </Text>
            )}
            <Button mt="xs" onClick={onNext}>Next</Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
