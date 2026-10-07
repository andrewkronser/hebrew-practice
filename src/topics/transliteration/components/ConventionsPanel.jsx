import { Accordion, Text, Stack, Group, Box } from "@mantine/core";

const ROWS = [
  ["Begadkefat", "Hard forms are bare: b g d k p t. Soft forms are underlined — ḇ ḏ ḵ ṯ — except gimel and pe, which descend below the line and so are overlined instead: ḡ p̄."],
  ["Vowel classes", "Short vowels take no mark (a e i o u), long take a macron (ā ē ī ō ū), reduced take a breve (ă ĕ ŏ) with ə for vocal shewa, and historic long — written with a mater — take a circumflex (â ê î ô û)."],
  ["Final ה", "A final he acting as a vowel letter goes in parentheses: tôrā(h), ʾiššā(h), ḥoḵmā(h). Many other grammars write tôrâ instead."],
  ["Furtive patach", "Written as a in parentheses before the guttural rather than as a raised letter: rû(a)ḥ, gāḇō(a)h."],
  ["Stress", "Seow marks stress with an acute where it falls off the final syllable (méleḵ). This trainer doesn't ask you to type it."],
];

export function ConventionsPanel() {
  return (
    <Accordion variant="separated" radius="md" chevronPosition="left">
      <Accordion.Item value="conventions">
        <Accordion.Control>
          <Text size="sm" fw={600} c="dimmed">
            Seow's conventions, in brief
          </Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="sm">
            {ROWS.map(([term, body]) => (
              <Group key={term} align="flex-start" wrap="nowrap" gap="md">
                <Box w={120} style={{ flexShrink: 0 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                    {term}
                  </Text>
                </Box>
                <Text size="sm" className="translit-inline">
                  {body}
                </Text>
              </Group>
            ))}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
