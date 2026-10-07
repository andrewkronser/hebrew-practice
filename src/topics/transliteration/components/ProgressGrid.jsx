import { useState } from "react";
import { Box, Group, Stack, Text, UnstyledButton, Anchor, Tooltip } from "@mantine/core";
import { CURRICULUM } from "../data.js";
import { statOf, isMastered } from "../../../shared/adaptive.js";
import { gateLabel, readableWords } from "../trainer.js";

/* The whole curriculum at a glance: unlocked characters fill as you settle them,
   locked ones stay dim. Position in the grid is order of introduction. */

export function ProgressGrid({ progress, onUnlockNext, onReset }) {
  const [info, setInfo] = useState(null);
  const { unlocked, stats } = progress;
  const words = readableWords(unlocked).length;
  const gate = gateLabel(progress);

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="baseline" gap="md">
        <Text size="sm" c="dimmed">
          <Text span fw={600} c="var(--mantine-color-text)">
            {unlocked >= CURRICULUM.length ? `All ${CURRICULUM.length}` : `${unlocked} of ${CURRICULUM.length}`}
          </Text>{" "}
          characters in rotation
          {gate ? ` · ${gate}` : ""}
          {words >= 3 ? ` · ${words} words readable` : ""}
        </Text>
        <Group gap="md">
          {unlocked < CURRICULUM.length && (
            <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onUnlockNext}>
              Unlock the next one
            </Anchor>
          )}
          <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onReset}>
            Start over
          </Anchor>
        </Group>
      </Group>

      <Group gap={6}>
        {CURRICULUM.map((it, i) => {
          const locked = i >= unlocked;
          const r = statOf(stats, it.id);
          const done = !locked && isMastered(stats, it);
          return (
            <Tooltip key={it.id} label={locked ? "Not yet unlocked" : `${it.n} — ${it.a}`} withArrow openDelay={250}>
              <UnstyledButton
                className={`tile${locked ? " tile-locked" : ""}`}
                disabled={locked}
                onClick={() => !locked && setInfo(it)}
                aria-label={locked ? "Locked character" : `${it.n}, ${it.a}`}
              >
                <Box className="hebrew tile-glyph" aria-hidden="true">
                  {locked ? "·" : it.he}
                </Box>
                <Box className="tile-bar">
                  <Box
                    className="tile-fill"
                    style={{
                      width: `${Math.round(r.s * 100)}%`,
                      background: done
                        ? "var(--mantine-color-teal-6)"
                        : "var(--mantine-color-tekhelet-6)",
                    }}
                  />
                </Box>
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </Group>

      <Text size="sm" c="dimmed" mih="1.5em">
        {info ? (
          <>
            <Text span fw={600} c="var(--mantine-color-text)">{info.n}</Text>
            {" — "}
            <Text span className="translit">{info.a}</Text>
            {" / "}
            <Text span className="translit">{info.s}</Text>
            {info.note ? ` · ${info.note}` : ""}
          </>
        ) : (
          "Tap any unlocked character for its name."
        )}
      </Text>
    </Stack>
  );
}
