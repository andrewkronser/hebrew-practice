import { Box, Group, Stack, Text, Tooltip } from "@mantine/core";

/* How solid each class is, as a row of bars.

   Two numbers, kept apart on purpose. The bar is mean confidence across the
   class — where you stand. The count beside it is how many of its words are
   solid, which is the thing that actually moves. A class you have never been
   asked about reads as untouched rather than as failing, because an empty bar
   and a bad bar mean very different things. */

const band = (row) => {
  if (!row.seen) return "none";
  if (row.solid === row.total) return "solid";
  if (row.mean >= 0.6) return "warm";
  if (row.mean >= 0.3) return "mid";
  return "cold";
};

export function ClassHealth({ health }) {
  const rows = [];
  let lastGroup = null;
  for (const row of health) {
    if (row.group && row.group !== lastGroup) {
      rows.push({ kind: "group", label: row.group, key: `g-${row.group}` });
    }
    lastGroup = row.group ?? null;
    rows.push({ kind: "row", row, key: row.id });
  }

  return (
    <Box pl="md" py={4}>
      <Text size="xs" c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.07em" }}>
        Where you stand
      </Text>
      <Stack gap={7}>
        {rows.map((entry) => {
          if (entry.kind === "group") {
            return (
              <Text key={entry.key} size="xs" c="dimmed" tt="uppercase" mt={4}
                    style={{ letterSpacing: "0.07em", opacity: 0.7 }}>
                {entry.label}
              </Text>
            );
          }
          const { row } = entry;
          const label = row.seen
            ? `${row.solid} of ${row.total} solid · ${Math.round(row.mean * 100)}% confident`
            : `Not asked yet · ${row.total} words`;
          return (
            <Tooltip key={entry.key} label={label} withArrow position="left" openDelay={150}>
              <Box className="health-row" style={{ paddingInlineStart: row.group ? 10 : 0 }}>
                <Group gap="xs" wrap="nowrap" justify="space-between" align="baseline">
                  <Text size="xs" lineClamp={1}>{row.n}. {row.title}</Text>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    {row.seen ? `${row.solid}/${row.total}` : "—"}
                  </Text>
                </Group>
                <Box className="health-bar">
                  <Box
                    className={`health-fill health-${band(row)}`}
                    style={{ width: `${Math.round(row.mean * 100)}%` }}
                  />
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}
