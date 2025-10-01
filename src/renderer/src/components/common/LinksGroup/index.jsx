import { useState } from "react";
import { IconCalendarStats, IconChevronRight } from "@tabler/icons-react";
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import classes from "./LinksGroup.module.css";

const LinksGroup = ({ icon: Icon, label, initiallyOpened, pages }) => {
  const hasPages = Array.isArray(pages);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const items = (hasPages ? pages : []).map((page) => (
    <Text
      component="a"
      className={classes.link}
      href={page.link}
      key={page.label}
      onClick={(event) => event.preventDefault()}
    >
      {page.label}
    </Text>
  ));

  return (
    <>
      <UnstyledButton onClick={() => setOpened((o) => !o)} className={classes.control}>
        <Group justify="space-between" gap={0}>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size={18} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasPages && (
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              size={16}
              style={{ transform: opened ? "rotate(-90deg)" : "none" }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasPages ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
};

export default LinksGroup;
