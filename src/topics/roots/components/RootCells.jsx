import { Box, Group, Text } from "@mantine/core";

/* Three cells, because a root has three consonants and knowing that is half the
   skill. When a word shows only two letters the empty cell is the question.

   Laid out right to left: the first radical is the rightmost cell. Each holds
   one letter and hands focus to the next, so typing runs the way reading does. */

const ORDINALS = ["first", "second", "third"];

export function RootCells({ cells, refs, onChange, onFocusCell, onKeyDown, state }) {
  return (
    <Group gap="sm" justify="center" wrap="nowrap" style={{ direction: "rtl" }}>
      {[0, 1, 2].map((i) => (
        <Box key={i} className="root-cell-wrap">
          <Box
            component="input"
            ref={(el) => { refs.current[i] = el; }}
            className={`hebrew root-cell${state ? ` root-cell-${state}` : ""}`}
            value={cells[i]}
            onChange={(e) => onChange(i, e.currentTarget.value)}
            onFocus={() => onFocusCell(i)}
            onKeyDown={(e) => onKeyDown(i, e)}
            readOnly={Boolean(state)}
            dir="rtl"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={`${ORDINALS[i]} radical`}
          />
          <Text size="xs" c="dimmed" ta="center" mt={4}>{ORDINALS[i]}</Text>
        </Box>
      ))}
    </Group>
  );
}
