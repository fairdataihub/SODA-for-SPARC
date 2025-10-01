import useGlobalStore from "../../../stores/globalStore";
import {
  IconScreenShare,
  IconBook,
  IconUser,
  IconMail,
  IconInfoCircle,
  IconLogout,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import {
  Code,
  Group,
  Text,
  UnstyledButton,
  ThemeIcon,
  Box,
  Image,
  Stack,
  Divider,
} from "@mantine/core";
import classes from "./Sidebar.module.css";

const links = [
  {
    id: "guided_mode_view",
    label: "Curate and Share",
    section: "guided_mode",
    icon: <IconScreenShare size={20} color="black" />,
  },
  {
    id: "documentation-view",
    label: "Documentation",
    section: "documentation",
    icon: <IconBook size={20} color="black" />,
  },
  {
    id: "account-view",
    label: "Manage Accounts",
    section: "account",
    icon: <IconUser size={20} color="black" />,
  },
  {
    id: "contact-us-view",
    label: "Contact Us",
    section: "contact-us",
    icon: <IconMail size={20} color="black" />,
  },
  {
    id: "about-view",
    label: "About SODA",
    section: "about-us",
    icon: <IconInfoCircle size={20} color="black" />,
  },
];

const Sidebar = () => {
  let activeTab = useGlobalStore((state) => state.activeTab);
  // Map "organize" to "guided_mode" for active tab highlighting
  if (activeTab === "organize") {
    activeTab = "guided_mode";
  }
  const appVersion = useGlobalStore((state) => state.appVersion);

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Stack align="center" mb={50} gap="xs">
          <Image src="./img/logo-new-green.png" alt="Logo" w={80} gap="0px" />
          <Text fw={600} size="xl" c="var(--color-light-green)" mt="-8px">
            SODA
          </Text>
          <Code fw={700} id="version">
            {`${appVersion}`}
          </Code>
        </Stack>

        {links.map((link) => {
          const isActive = activeTab === link.section;
          console.log("Rendering link:", link.id, "section:", link.section);
          return (
            <UnstyledButton
              key={link.id}
              data-section={link.section}
              id={link.id}
              className={isActive ? `${classes.link} ${classes.linkActive}` : classes.link}
              onClick={() => window.handleSideBarTabClick(link.id, link.section)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, marginBottom: 4 }}
            >
              <Group justify="flex-start" gap={12}>
                <ThemeIcon variant="light" size={30} radius="md">
                  {link.icon}
                </ThemeIcon>
                <Box ml="md">
                  <Text fw={600} size="md" c="black">
                    {link.label}
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          );
        })}
      </div>

      {/*
      <div className={classes.footer}>
        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconSwitchHorizontal className={classes.linkIcon} stroke={1.5} />
          <span>Change account</span>
        </a>

        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
      */}
    </nav>
  );
};

export default Sidebar;
