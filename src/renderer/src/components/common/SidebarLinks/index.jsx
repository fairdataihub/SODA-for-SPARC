import useGlobalStore from "../../../stores/globalStore";
import { IconScreenShare, IconBook, IconUser, IconMail, IconInfoCircle } from "@tabler/icons-react";
import { ActionIcon, Text } from "@mantine/core";
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
  console.log("Active Tab:", activeTab); // Debugging line
  return (
    <nav className={classes.sidebar}>
      {links.map((link) => {
        const isActive = activeTab === link.section;
        return (
          <a
            href="#"
            data-section={link.section}
            id={link.id}
            className={isActive ? `${classes.link} ${classes.linkActive}` : classes.link}
            key={link.label}
          >
            <ActionIcon variant="light" aria-label={link.label} mr="md" size={35}>
              {link.icon}
            </ActionIcon>
            <Text component="span" fw={600} ml="xs">
              {link.label}
            </Text>
          </a>
        );
      })}
    </nav>
  );
};

export default SidebarLinks;
