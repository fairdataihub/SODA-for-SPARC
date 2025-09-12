import { useState } from "react";
import {
  IconAdjustments,
  IconCalendarStats,
  IconFileAnalytics,
  IconGauge,
  IconLock,
  IconNotes,
  IconPresentationAnalytics,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  Box,
  Collapse,
  Group,
  ScrollArea,
  Text,
  ThemeIcon,
  UnstyledButton,
  Code,
} from "@mantine/core";
import navbarClasses from "./NavbarNested.module.css";
import linkClasses from "./NavbarLinksGroup.module.css";

// ---------------- LinksGroup ----------------
function LinksGroup({ icon: Icon, label, initiallyOpened, links }) {
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const items = (hasLinks ? links : []).map((link) => (
    <Text
      component="a"
      className={linkClasses.link}
      href={link.link}
      key={link.label}
      onClick={(event) => event.preventDefault()}
    >
      {link.label}
    </Text>
  ));

  return (
    <>
      <UnstyledButton onClick={() => setOpened((o) => !o)} className={linkClasses.control}>
        <Group justify="space-between" gap={0}>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size={18} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={linkClasses.chevron}
              stroke={1.5}
              size={16}
              style={{ transform: opened ? "rotate(-90deg)" : "none" }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}

// ---------------- NavBar ----------------
const mockdata = [
  { label: "Dashboard", icon: IconGauge },
  {
    label: "Market news",
    icon: IconNotes,
    initiallyOpened: true,
    links: [
      { label: "Overview", link: "/" },
      { label: "Forecasts", link: "/" },
      { label: "Outlook", link: "/" },
      { label: "Real time", link: "/" },
    ],
  },
  {
    label: "Releases",
    icon: IconCalendarStats,
    links: [
      { label: "Upcoming releases", link: "/" },
      { label: "Previous releases", link: "/" },
      { label: "Releases schedule", link: "/" },
    ],
  },
  { label: "Analytics", icon: IconPresentationAnalytics },
  { label: "Contracts", icon: IconFileAnalytics },
  { label: "Settings", icon: IconAdjustments },
  {
    label: "Security",
    icon: IconLock,
    links: [
      { label: "Enable 2FA", link: "/" },
      { label: "Change password", link: "/" },
      { label: "Recovery codes", link: "/" },
    ],
  },
];

const Navbar = () => {
  const links = mockdata.map((item) => <LinksGroup {...item} key={item.label} />);

  return (
    <nav className={navbarClasses.navbar}>
      <div className={navbarClasses.header}>
        <Group justify="space-between">
          {/* <Logo style={{ width: 120 }} /> */}
          <Code fw={700}>v3.1.2</Code>
        </Group>
      </div>

      <ScrollArea className={navbarClasses.links}>
        <div className={navbarClasses.linksInner}>{links}</div>
      </ScrollArea>
    </nav>
  );
};

export default Navbar;
