import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionIcon, Box, Button, Container, Group, Paper, SegmentedControl,
  Stack, Text, TextInput, Title, Tooltip, useMantineColorScheme, useComputedColorScheme,
} from "@mantine/core";
import { CURRICULUM, DIACRITIC_KEYS } from "./data.js";
import {
  emptyProgress, judge, scoreAnswer, penalizeWord, shouldUnlock,
  pickNext, freePool, shuffled,
} from "./trainer.js";
import { loadSaved, save, clearSaved } from "./storage.js";
import { AnswerReveal, RecentNames } from "./components/AnswerReveal.jsx";
import { ProgressGrid, StatsTape } from "./components/ProgressGrid.jsx";
import { ConventionsPanel } from "./components/ConventionsPanel.jsx";

const DEFAULT_SETTINGS = {
  track: "guided",
  style: "everyday",
  strict: "forgiving",
  freeMode: "letters",
};
const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });

export default function App() {
  const saved = useRef(loadSaved()).current;

  const [progress, setProgress] = useState(() => saved?.progress ?? emptyProgress());
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) }));
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));

  const [card, setCard] = useState(null);       // { item, isIntro }
  const [result, setResult] = useState(null);   // { correct, revealed }
  const [value, setValue] = useState("");
  const [hinted, setHinted] = useState(false);
  const [hintText, setHintText] = useState("");
  const [recent, setRecent] = useState([]);

  const progressRef = useRef(progress);
  const queueRef = useRef([]);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());
  const inputRef = useRef(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  /* ------------------------------------------------------------ dealing -- */

  const deal = useCallback((fromProgress) => {
    const p = fromProgress ?? progressRef.current;
    setResult(null);
    setValue("");
    setHinted(false);
    setHintText("");

    if (settings.track === "free") {
      if (!queueRef.current.length) queueRef.current = shuffled(freePool(settings.freeMode));
      setCard({ item: queueRef.current.shift(), isIntro: false });
    } else {
      const next = pickNext(p, lastIdRef.current);
      setCard(next);
      if (next.isIntro) {
        const cleared = { ...p, introOf: null };
        progressRef.current = cleared;
        setProgress(cleared);
      }
    }
    startedAt.current = Date.now();
  }, [settings.track, settings.freeMode]);

  useEffect(() => { deal(); /* first card, and again whenever the track changes */ }, [deal]);
  useEffect(() => { inputRef.current?.focus(); }, [card]);

  useEffect(() => {
    save({ progress, settings, best: session.best });
  }, [progress, settings, session.best]);

  /* ----------------------------------------------------------- answering -- */

  const finish = useCallback((item, correct, { counted, revealed = false, ms = 0 }) => {
    setResult({ correct, revealed });
    setRecent((r) => (item.word ? r : [item, ...r.filter((x) => x.id !== item.id)].slice(0, 4)));
    lastIdRef.current = item.id;

    if (!counted) return;

    setSession((s) => {
      const streak = correct ? s.streak + 1 : 0;
      return {
        right: s.right + (correct ? 1 : 0),
        total: s.total + 1,
        streak,
        best: Math.max(s.best, streak),
        tape: [...s.tape, correct].slice(-24),
      };
    });

    if (settings.track !== "guided") return;

    setProgress((p) => {
      const stats = item.word
        ? correct ? p.stats : penalizeWord(p.stats, p.unlocked, item)
        : scoreAnswer(p.stats, item, { correct, ms, hinted });
      let next = { ...p, stats, since: p.since + 1 };
      if (shouldUnlock(next)) {
        next = { ...next, introOf: next.unlocked, unlocked: next.unlocked + 1, since: 0 };
      }
      return next;
    });
  }, [settings.track, hinted]);

  const submit = useCallback(() => {
    if (!card) return;
    if (result) { deal(); return; }
    if (!value.trim()) return;
    const correct = judge(value, card.item, settings);
    finish(card.item, correct, { counted: !card.isIntro, ms: Date.now() - startedAt.current });
  }, [card, result, value, settings, finish, deal]);

  const reveal = useCallback(() => {
    if (!card || result) return;
    finish(card.item, false, { counted: !card.isIntro, revealed: true, ms: 1e6 });
  }, [card, result, finish]);

  const showHint = useCallback(() => {
    if (!card || result || card.isIntro) return;
    setHinted(true);
    const it = card.item;
    const target = settings.style === "seow" ? it.a : it.s;
    setHintText(it.word ? `“${it.g}” — ${target.length} letters, starts with ${target[0]}` : it.n);
  }, [card, result, settings.style]);

  /* Enter submits; Enter again moves on, even if focus has wandered. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || !result) return;
      if (e.target === inputRef.current) return; // the input handles its own
      e.preventDefault();
      deal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [result, deal]);

  const insert = (ch) => {
    const el = inputRef.current;
    if (!el || result) return;
    const a = el.selectionStart ?? value.length;
    const b = el.selectionEnd ?? a;
    const next = value.slice(0, a) + ch + value.slice(b);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + ch.length, a + ch.length);
    });
  };

  const unlockNext = () => {
    const p = progressRef.current;
    if (p.unlocked >= CURRICULUM.length) return;
    const next = { ...p, introOf: p.unlocked, unlocked: p.unlocked + 1, since: 0 };
    progressRef.current = next;
    setProgress(next);
    deal(next);
  };

  const resetAll = () => {
    clearSaved();
    const fresh = emptyProgress();
    progressRef.current = fresh;
    setProgress(fresh);
    setSession(emptySession(0));
    setRecent([]);
    lastIdRef.current = null;
    deal(fresh);
  };

  const changeTrack = (track) => { queueRef.current = []; setSettings((s) => ({ ...s, track })); };
  const changeFreeMode = (freeMode) => { queueRef.current = []; setSettings((s) => ({ ...s, freeMode })); };

  if (!card) return null;
  const { item, isIntro } = card;
  const guided = settings.track === "guided";
  const seow = settings.style === "seow";

  const prompt = isIntro
    ? "Type it once to add it to your rotation"
    : item.word
      ? "A word built only from characters you've learned"
      : item.v
        ? "Type the vowel sound only — ignore the ב it rests on"
        : "Type how this character is transliterated";

  return (
    <Container size={660} py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>
            Hebrew transliteration{" "}
            <Text span c="dimmed" fw={400} inherit>trainer</Text>
          </Title>
          <ColorSchemeToggle />
        </Group>

        <Group gap="sm">
          <SegmentedControl
            size="xs" value={settings.track} onChange={changeTrack}
            data={[{ label: "Guided", value: "guided" }, { label: "Free practice", value: "free" }]}
          />
          {!guided && (
            <SegmentedControl
              size="xs" value={settings.freeMode} onChange={changeFreeMode}
              data={[
                { label: "Letters", value: "letters" },
                { label: "Vowels", value: "vowels" },
                { label: "Words", value: "words" },
              ]}
            />
          )}
          <SegmentedControl
            size="xs" value={settings.style}
            onChange={(style) => setSettings((s) => ({ ...s, style }))}
            data={[{ label: "Everyday", value: "everyday" }, { label: "Seow", value: "seow" }]}
          />
          {seow && (
            <SegmentedControl
              size="xs" value={settings.strict}
              onChange={(strict) => setSettings((s) => ({ ...s, strict }))}
              data={[{ label: "Forgiving", value: "forgiving" }, { label: "Exact marks", value: "exact" }]}
            />
          )}
        </Group>

        <Paper withBorder radius="lg" p="xl" shadow="sm">
          <Stack gap="md" align="center">
            {isIntro && (
              <Text size="xs" fw={700} c="tekhelet" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
                New character — {item.n}
              </Text>
            )}

            <Box className={`hebrew glyph${item.word ? " glyph-word" : ""}`} dir="rtl">
              {item.he}
            </Box>

            <Text size="sm" c="dimmed" ta="center" mih="1.5em">
              {isIntro ? (
                <>
                  {item.n} →{" "}
                  <Text span className="translit" fw={700} c="tekhelet">
                    {seow ? item.a : item.s}
                  </Text>
                </>
              ) : hintText || prompt}
            </Text>

            <TextInput
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              readOnly={Boolean(result)}
              placeholder="your answer"
              variant="unstyled"
              size="xl"
              w="100%"
              maw={360}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Transliteration"
              classNames={{ input: "answer-input" }}
            />

            {seow && (
              <Group gap={6} justify="center">
                {DIACRITIC_KEYS.map((k) => (
                  <Button
                    key={k} size="compact-sm" variant="default"
                    className="translit" onClick={() => insert(k)} tabIndex={-1}
                  >
                    {k}
                  </Button>
                ))}
              </Group>
            )}

            <Group gap="sm">
              <Button onClick={submit}>{result ? "Next" : "Check"}</Button>
              <Button variant="subtle" color="gray" onClick={showHint} disabled={Boolean(result) || isIntro}>
                Hint
              </Button>
              <Button variant="subtle" color="gray" onClick={reveal} disabled={Boolean(result)}>
                Show answer
              </Button>
            </Group>

            {result && (
              <Box w="100%">
                <AnswerReveal item={item} correct={result.correct} revealed={result.revealed} style={settings.style} />
              </Box>
            )}
          </Stack>
        </Paper>

        <RecentNames items={recent} />

        <StatsTape session={session} />

        {guided && (
          <Box mt="md">
            <ProgressGrid progress={progress} onUnlockNext={unlockNext} onReset={resetAll} />
          </Box>
        )}

        {seow && <ConventionsPanel />}

        <Text size="xs" c="dimmed" lh={1.6}>
          Enter checks, Enter again moves on.{" "}
          {guided && "Characters you keep missing come up more often; steady ones fade back. "}
          {seow && settings.strict === "exact"
            ? "Every mark has to match Seow exactly — ḥ is not h, and the parentheses count."
            : "Marks are optional while you learn: h counts for ḥ, torah for tôrā(h)."}
        </Text>
      </Stack>
    </Container>
  );
}

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const dark = computed === "dark";
  return (
    <Tooltip label={dark ? "Light" : "Dark"} withArrow>
      <ActionIcon
        variant="default" size="lg" radius="xl"
        onClick={() => setColorScheme(dark ? "light" : "dark")}
        aria-label="Toggle colour scheme"
      >
        {dark ? "☀" : "☾"}
      </ActionIcon>
    </Tooltip>
  );
}
