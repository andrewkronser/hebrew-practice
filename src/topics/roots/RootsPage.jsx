import { SegmentedControl, Stack, Title } from "@mantine/core";
import { useState } from "react";
import GuidedRoots from "./GuidedRoots.jsx";
import AdaptiveRoots from "./AdaptiveRoots.jsx";
import { loadSlice, saveSlice } from "../../shared/storage.js";

const MODE_SLICE = "roots-mode";

/* Two modes, deliberately different in shape. "Learn root rules" is a locked
   syllabus with a streak per lesson: the class is announced and the task is
   applying its rule. "Practice roots" mixes everything with the confidence
   engine and nothing unlocked, where the task is deciding which class applies.
   That is why the hint toggles belong only to the first, and why the words no
   rule reaches are only ever asked in the second. */

export default function RootsPage() {
  const [mode, setMode] = useState(() => loadSlice(MODE_SLICE)?.mode ?? "learn");
  const choose = (next) => { setMode(next); saveSlice(MODE_SLICE, { mode: next }); };

  const header = (
    <Stack gap="sm">
      <Title order={1} size="h2">Roots</Title>
      <SegmentedControl
        size="xs"
        value={mode}
        onChange={choose}
        data={[
          { label: "Learn root rules", value: "learn" },
          { label: "Practice roots", value: "practice" },
        ]}
        aria-label="Exercise"
      />
    </Stack>
  );

  return mode === "learn"
    ? <GuidedRoots header={header} onFinish={() => choose("practice")} />
    : <AdaptiveRoots header={header} />;
}
