import {
  ActionIcon, AppShell, Box, Burger, Container, Group, NavLink, Text, Tooltip,
  useMantineColorScheme, useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet, useLocation } from "react-router-dom";
import { SECTIONS } from "./routes.jsx";

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
            <Text fw={600} c="var(--mantine-color-text)">
              Hebrew{" "}
              <Text span c="dimmed" fw={400} inherit>Practice</Text>
            </Text>
          </Group>

          <Box style={{ marginLeft: "auto" }}>
            <ColorSchemeToggle />
          </Box>
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
        <Container size={660} py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
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
