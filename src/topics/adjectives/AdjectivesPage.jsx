import { SegmentedControl, Stack, Title } from "@mantine/core";
import { useState } from "react";
import GuidedAdjectives from "./GuidedAdjectives.jsx";
import AdaptiveAdjectives from "./AdaptiveAdjectives.jsx";
import { loadSlice, saveSlice } from "../../shared/storage.js";

const MODE_SLICE = "adjectives-mode";

/* Two exercises, split by what they can test rather than by difficulty.
   "Write the form" walks the agreement rules in order and asks you to produce
   an adjective. "Read the phrase" shows you one and asks what it is doing,
   which production cannot ask: by the time you are typing a single word, the
   word order and the pattern of articles — the whole signal — is gone.

   It is also where the honest answer is sometimes "either". An indefinite noun
   with the adjective after it is genuinely both readings, and only a reading
   exercise has room to say so. */

export default function AdjectivesPage() {
  const [mode, setMode] = useState(() => loadSlice(MODE_SLICE)?.mode ?? "guided");
  const choose = (next) => { setMode(next); saveSlice(MODE_SLICE, { mode: next }); };

  const header = (
    <Stack gap="sm">
      <Title order={1} size="h2">Adjectives</Title>
      <SegmentedControl
        size="xs"
        value={mode}
        onChange={choose}
        data={[
          { label: "Write the form", value: "guided" },
          { label: "Read the phrase", value: "adaptive" },
        ]}
        aria-label="Exercise"
      />
    </Stack>
  );

  if (mode === "guided") return <GuidedAdjectives header={header} />;

  return (
    <Stack gap="lg">
      {header}
      <AdaptiveAdjectives />
    </Stack>
  );
}
