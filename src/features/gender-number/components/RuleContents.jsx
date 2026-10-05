import { Box, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { RULES, FREE_PRACTICE } from "../rules.js";
import { ruleState } from "../useRuleDrill.js";

/* The syllabus as a table of contents: the progress display, the navigation,
   and the sense that this is a system rather than a pile of exceptions.

   A rule is done, in progress, or locked — and separately, one of them is the
   one you are currently practising. Those two come apart as soon as you step
   back to revise something finished, which is why the mark on the left shows
   state and the filled background shows where you are. */

const MARK = { done: "✓", active: "▸", locked: "·" };

export function RuleContents({ progress, onSelect }) {
  const rows = [];
  let lastGroup = null;
  for (const rule of RULES) {
    if (rule.group && rule.group !== lastGroup) {
      rows.push({ kind: "group", label: rule.group, key: `g-${rule.group}` });
    }
    lastGroup = rule.group ?? null;
    rows.push({ kind: "rule", rule, key: rule.id });
  }
  rows.push({ kind: "rule", rule: FREE_PRACTICE, key: FREE_PRACTICE.id });

  return (
    <Box pl="md" py={4}>
      <Stack gap={2}>
        {rows.map((row) => {
          if (row.kind === "group") {
            return (
              <Text key={row.key} size="xs" c="dimmed" tt="uppercase" mt={6} mb={2}
                    style={{ letterSpacing: "0.07em" }}>
                {row.label}
              </Text>
            );
          }
          const { rule } = row;
          const state = ruleState(rule.id, progress.done);
          const viewing = progress.ruleId === rule.id;
          const locked = state === "locked";
          return (
            <UnstyledButton
              key={row.key}
              onClick={() => !locked && onSelect(rule.id)}
              disabled={locked}
              className={`toc-row${viewing ? " toc-viewing" : ""}${locked ? " toc-locked" : ""}`}
              style={{ paddingInlineStart: rule.group ? 14 : 4 }}
              aria-current={viewing ? "step" : undefined}
              data-state={state}
            >
              <Group gap="xs" wrap="nowrap" align="center">
                <Box className={`toc-mark toc-mark-${state}`} aria-hidden="true">
                  {MARK[state]}
                </Box>
                <Text
                  size="sm"
                  fw={viewing || state === "active" ? 600 : 400}
                  c={viewing ? "tekhelet" : locked ? "dimmed" : undefined}
                >
                  {rule.title}
                </Text>
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}

/** Progress toward the current rule's streak, as a row of pips. */
export function StreakMeter({ streak, target }) {
  if (!target) return null;
  return (
    <Group gap={5} align="center">
      {Array.from({ length: target }, (_, i) => (
        <Box key={i} className={`pip${i < streak ? " pip-on" : ""}`} />
      ))}
      <Text size="xs" c="dimmed" ml={4}>
        {streak} of {target} in a row
      </Text>
    </Group>
  );
}
