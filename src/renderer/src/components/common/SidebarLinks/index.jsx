import useGlobalStore from "../../../stores/globalStore";
import { IconScreenShare, IconBook, IconUser, IconMail, IconInfoCircle } from "@tabler/icons-react";
import { Text, UnstyledButton, Group, ThemeIcon, Box } from "@mantine/core";
import classes from "./sidebar.module.css";

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

const SidebarLinks = () => {
  const activeTab = useGlobalStore((state) => state.activeTab);
  return (
    <nav className={classes.sidebar}>
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
    </nav>
  );
};

export default SidebarLinks;
