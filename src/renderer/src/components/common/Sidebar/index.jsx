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
} from "@mantine/core";
import classes from "./Sidebar.module.css";
import { LinksGroup } from "../LinksGroup";

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
  const guidedModePageNavigationVisible = useGlobalStore(
    (state) => state.guidedModePageNavigationVisible
  );
  console.log("guidedModeSidebarDatasetName:", guidedModeSidebarDatasetName);
  const guidedModePageStructureObject = useGlobalStore(
    (state) => state.guidedModePageStructureObject
  );

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        {id === "main-sidebar" && (
          <Stack align="center" mb="xl" gap="xs">
            <Image src="./img/logo-new-green.png" alt="Logo" w={90} />
            <Text fw={600} size="xl" c="var(--color-light-green)">
              SODA
            </Text>
            <Code fw={700} id="version">
              {appVersion}
            </Code>
            <Divider my="sm" />
          </Stack>
        )}
        {id === "guided-sidebar" && (
          <Stack align="center" mb="xl" gap="xs">
            <Group>
              <Image src="./img/logo-new-green.png" alt="Logo" w={50} />
              <Text fw={600} size="xl" c="var(--color-light-green)">
                SODA
              </Text>
            </Group>

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
            <label
              className="guided--form-label centered mt-lg"
              style={{
                borderBottom: "1px solid var(--color-light-green)",
                width: "auto",
              }}
            >
              Current dataset
            </label>
            <p
              className="help-text text-center ellipsis-after-two-lines"
              id="guided-navbar-dataset-name-display"
            >
              {guidedModeSidebarDatasetName}
            </p>
            <label
              className="guided--form-label centered mt-lg"
              style={{
                borderBottom: "1px solid var(--color-light-green)",
                marginBottom: "0.5rem",
                width: "auto",
              }}
              id="guided-page-navigation-header"
            >
              Page navigation
            </label>
            <ul id="guided-nav-items" className="guided--container-nav-items"></ul>
            <div>
              {Object.entries(guidedModePageStructureObject).map(([key, value]) => (
                <Stack spacing={4} key={key} mb="sm">
                  <div key={key}>
                    <strong>{key}:</strong> {JSON.stringify(value)}
                  </div>
                </Stack>
              ))}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
