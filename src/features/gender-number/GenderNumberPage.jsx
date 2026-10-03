import {
  Anchor, Box, Button, Divider, Group, Paper, SimpleGrid, Stack, Switch, Text, Title,
} from "@mantine/core";
import { useGenderNumber } from "./useGenderNumber.js";
import { FORMS, CELLS, GENDERS, NUMBERS } from "./data.js";
import { correctCells, gateLabel } from "./drill.js";
import { StatsTape } from "../transliteration/components/ProgressGrid.jsx";

export default function GenderNumberPage() {
  const g = useGenderNumber();
  if (!g.card) return null;

  const { unlocked } = g.progress;
  const gate = gateLabel(g.progress);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} size="h2">Gender and Number</Title>
        <Switch
          size="sm"
          label="Transliteration hint"
          checked={g.showTranslit}
          onChange={(e) => g.setShowTranslit(e.currentTarget.checked)}
        />
      </Group>

      <Paper withBorder radius="lg" p="xl" shadow="sm">
        {g.card.kind === "intro" ? (
          <Introduction form={g.card.form} onContinue={g.acknowledge} />
        ) : (
          <Question
            form={g.card.form}
            result={g.result}
            showTranslit={g.showTranslit}
            onAnswer={g.answer}
            onNext={g.next}
          />
        )}
      </Paper>

      <StatsTape session={g.session} />

      <Group justify="space-between" align="baseline" gap="md">
        <Text size="sm" c="dimmed">
          <Text span fw={600} c="var(--mantine-color-text)">
            {unlocked} of {FORMS.length}
          </Text>{" "}
          forms in rotation{gate ? ` · ${gate}` : ""}
        </Text>
        <Group gap="md">
          {unlocked < FORMS.length && (
            <Anchor component="button" type="button" size="sm" c="dimmed" onClick={g.unlockNext}>
              Unlock the next one
            </Anchor>
          )}
          <Anchor component="button" type="button" size="sm" c="dimmed" onClick={g.resetAll}>
            Start over
          </Anchor>
        </Group>
      </Group>

      <Text size="xs" c="dimmed" lh={1.6}>
        Press 1–6 to answer, Enter to move on. Duals come up far more often here than
        their share of the vocabulary, since only seven forms in the whole bank take
        one. A few words are attested in both genders — either column counts.
      </Text>
    </Stack>
  );
}

function Parse({ form }) {
  const cells = correctCells(form);
  const gender = [...new Set(cells.map((c) => c.gender))]
    .map((id) => GENDERS.find((x) => x.id === id).label.toLowerCase())
    .join(" or ");
  const number = NUMBERS.find((n) => n.id === form.number).label.toLowerCase();
  return <>{gender} {number}</>;
}

function Introduction({ form, onContinue }) {
  return (
    <Stack gap="md" align="center">
      <Text size="xs" fw={700} c="tekhelet" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
        New form
      </Text>
      <Box className="hebrew glyph-word" dir="rtl">{form.he}</Box>
      <Text className="translit" c="dimmed" fz="lg">{form.tr}</Text>
      <Text fw={600}><Parse form={form} /></Text>
      <Text size="sm" c="dimmed">{form.gloss}</Text>
      {form.note && (
        <Text size="xs" c="dimmed" ta="center" maw={420}>{form.note}</Text>
      )}
      <Button onClick={onContinue}>Got it</Button>
    </Stack>
  );
}

function Question({ form, result, showTranslit, onAnswer, onNext }) {
  const right = result ? correctCells(form).map((c) => c.id) : [];

  return (
    <Stack gap="md" align="center">
      <Stack gap={2} align="center">
        <Box className="hebrew glyph-word" dir="rtl">{form.he}</Box>
        {/* Held either way, so flipping the hint doesn't shift the grid. */}
        <Text className="translit" c="dimmed" fz="lg" mih="1.6em">
          {showTranslit ? form.tr : " "}
        </Text>
      </Stack>

      <Stack gap={6} w="100%" maw={420}>
        <SimpleGrid cols={2} spacing="xs">
          {GENDERS.map((gender) => (
            <Text key={gender.id} size="xs" c="dimmed" ta="center" tt="uppercase"
                  style={{ letterSpacing: "0.06em" }}>
              {gender.label}
            </Text>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs">
          {CELLS.map((cell, i) => {
            const chosen = result?.chosen?.id === cell.id;
            const isRight = right.includes(cell.id);
            let color = "gray";
            let variant = "default";
            if (result) {
              if (isRight) { color = "teal"; variant = "light"; }
              else if (chosen) { color = "red"; variant = "light"; }
            }
            const numberLabel = NUMBERS.find((n) => n.id === cell.number).label;
            const genderLabel = GENDERS.find((x) => x.id === cell.gender).label;
            return (
              <Button
                key={cell.id}
                variant={variant}
                color={color}
                size="md"
                justify="flex-start"
                onClick={() => onAnswer(cell)}
                disabled={Boolean(result) && !isRight && !chosen}
                aria-label={`${genderLabel} ${numberLabel}`}
                leftSection={<Text size="xs" c="dimmed" w={14} ta="center">{i + 1}</Text>}
              >
                {numberLabel}
              </Button>
            );
          })}
        </SimpleGrid>
      </Stack>

      {result && (
        <>
          <Divider w="100%" opacity={0.4} />
          <Stack gap={6} align="center">
            <Text size="sm" fw={700} c={result.correct ? "teal" : "red"}>
              {result.correct ? "Correct" : "Not quite"}
            </Text>
            <Text size="sm" ta="center">
              <Box component="span" className="hebrew" fz="lg">{form.he}</Box>
              {" "}
              <Text span className="translit" c="dimmed">{form.tr}</Text>
              {" — "}
              <Text span fw={600}><Parse form={form} /></Text>
              {", "}{form.gloss}
            </Text>
            {form.note && (
              <Text size="xs" c="dimmed" ta="center" maw={440}>{form.note}</Text>
            )}
            <Button mt="xs" onClick={onNext}>Next</Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
