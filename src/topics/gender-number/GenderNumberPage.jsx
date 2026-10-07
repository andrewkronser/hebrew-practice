import { SegmentedControl, Stack, Title } from "@mantine/core";
import { useState } from "react";
import GuidedForms from "./GuidedForms.jsx";
import AdaptiveForms from "./AdaptiveForms.jsx";
import { loadSlice, saveSlice } from "../../shared/storage.js";

const MODE_SLICE = "gender-number-mode";

export default function GenderNumberPage() {
  const [mode, setMode] = useState(() => loadSlice(MODE_SLICE)?.mode ?? "identify");
  const choose = (next) => { setMode(next); saveSlice(MODE_SLICE, { mode: next }); };

  const header = (
    <Stack gap="sm">
      <Title order={1} size="h2">Gender and Number</Title>
      <SegmentedControl
        size="xs"
        value={mode}
        onChange={choose}
        data={[
          { label: "Identify a form", value: "identify" },
          { label: "Write the form", value: "form" },
        ]}
        aria-label="Exercise"
      />
    </Stack>
  );

  /* "Write the form" carries the syllabus in a column dressed as an aside, and
     an aside runs the full height of the content area — beside the title and the
     mode control, not starting below them. So that mode takes the header into
     its own layout and places it in the reading column, rather than having it
     sit above the grid where the dividing rule would begin mid-page. */
  if (mode === "form") return <GuidedForms header={header} />;

  return (
    <Stack gap="lg">
      {header}
      <AdaptiveForms />
    </Stack>
  );
}
