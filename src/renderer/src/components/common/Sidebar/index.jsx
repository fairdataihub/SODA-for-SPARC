import useGlobalStore from "../../../stores/globalStore";

import { IconScreenShare, IconBook, IconUser, IconMail, IconInfoCircle } from "@tabler/icons-react";
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
  ScrollArea,
  Paper,
} from "@mantine/core";
import classes from "./Sidebar.module.css";
import LinksGroup from "./LinksGroup.jsx";

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

const Sidebar = ({ id }) => {
  let activeTab = useGlobalStore((state) => state.activeTab);
  if (activeTab === "organize") {
    activeTab = "guided_mode";
  }
  const appVersion = useGlobalStore((state) => state.appVersion);
  const guidedModeSidebarDatasetName = useGlobalStore(
    (state) => state.guidedModeSidebarDatasetName
  );

  const guidedModePageStructureObject = useGlobalStore(
    (state) => state.guidedModePageStructureObject
  );
  const guidedModePageStructureKeys = Object.keys(guidedModePageStructureObject);
  const showGuidedModePageNavigation = useGlobalStore(
    (state) => state.showGuidedModePageNavigation
  );

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        {id === "main-sidebar" && (
          <Stack align="center" mb="xl" gap="xs">
            <Image src="./img/logo-new-green.png" alt="Logo" w={90} />
            <Text fw={600} size="xl" c="var(--color-soda-green)">
              SODA
            </Text>
            <Code fw={700} id="version">
              {appVersion}
            </Code>
            <Divider my="sm" />
          </Stack>
        )}

        {id === "main-sidebar" &&
          links.map((link) => {
            const isActive = activeTab === link.section;
            return (
              <UnstyledButton
                key={link.id}
                data-section={link.section}
                id={link.id}
                className={isActive ? `${classes.link} ${classes.linkActive}` : classes.link}
                onClick={() => window.handleSideBarTabClick(link.id, link.section)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                }}
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

        {id === "guided-sidebar" && (
          <>
            <Stack gap={2} align="center">
              <Text size="md" fw={500}>
                Current Dataset
              </Text>
              <Text size="lg" fw={550} mt={-5}>
                {guidedModeSidebarDatasetName}
              </Text>
              <Text size="md" fw={500} mt="xl" mb="xs">
                Page Navigation
              </Text>
            </Stack>

            <ul id="guided-nav-items" className="guided--container-nav-items hidden"></ul>
            {showGuidedModePageNavigation && (
              <div>
                {Object.entries(guidedModePageStructureObject).map(([pageKey, pageChildren]) => (
                  <LinksGroup key={pageKey} label={pageKey} pages={pageChildren} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
