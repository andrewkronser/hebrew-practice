import {
  ActionIcon, AppShell, Box, Burger, Container, Group, NavLink, SegmentedControl, Text, Tooltip,
  useMantineColorScheme, useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet, useLocation } from "react-router-dom";
import { SECTIONS } from "./routes.jsx";
import { useSettings } from "./shared/settings.jsx";

/* Chrome around every page.

   Header holds only the burger, the brand, and the colour-scheme toggle. Every
   section lives in the navbar, which collapses on both desktop and mobile.
   Mantine wants separate state for the two breakpoints — the desktop navbar
   starts open, the mobile one starts closed so it doesn't cover the page. */

export default function Shell() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="md" wrap="nowrap">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" aria-label="Sections" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" aria-label="Sections" />

          <Group gap={8} wrap="nowrap" component={Link} to="/" style={{ textDecoration: "none" }}>
            <Box className="hebrew" fz="xl" c="tekhelet" aria-hidden="true">א</Box>
            {/* The wordmark gives up its second half before it gives up its
                line. With the platform control in the header too, "Hebrew
                Practice" wrapped on a phone, which looks like a bug rather than
                a tight fit; "א Hebrew" identifies the app on its own. */}
            <Text fw={600} c="var(--mantine-color-text)" style={{ whiteSpace: "nowrap" }}>
              Hebrew{" "}
              <Text span c="dimmed" fw={400} inherit className="brand-sub">Practice</Text>
            </Text>
          </Group>

          <Group gap="xs" wrap="nowrap" style={{ marginLeft: "auto" }}>
            <PlatformToggle />
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {SECTIONS.map(({ path, label }) => (
          <NavLink
            key={path}
            component={Link}
            to={path}
            label={label}
            active={pathname === path}
            onClick={closeMobile}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size={SECTIONS.find((s) => s.path === pathname)?.width ?? 660} py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

/* Which keyboard the key hints describe. It lives up here rather than on the
   typing page because five of the six topics draw a keyboard, and because it is
   a setting you want to be able to *check* at a glance — if it is wrong, every
   hint in the app is wrong, and that reads as the lesson being confusing rather
   than the setting being off. A segmented control states the answer without
   being touched, which an icon toggle cannot.

   Labelled, not iconographic: Mantine ships no icons, and a dependency for two
   glyphs that would then need a tooltip to be legible is a poor trade. */
function PlatformToggle() {
  const { os, setOs } = useSettings();
  return (
    <SegmentedControl
      size="xs"
      value={os}
      onChange={setOs}
      data={[{ label: "macOS", value: "mac" }, { label: "Windows", value: "win" }]}
      aria-label="Keyboard platform"
    />
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
