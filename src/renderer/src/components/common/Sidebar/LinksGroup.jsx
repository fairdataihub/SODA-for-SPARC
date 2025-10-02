import { useState } from "react";
import {
  IconCalendarStats,
  IconChevronRight,
  IconPlayerPlay,
  IconBlocks,
  IconListDetails,
  IconUpload,
} from "@tabler/icons-react";
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import classes from "./Sidebar.module.css";
import Swal from "sweetalert2";
import { savePageChanges } from "../../../scripts/guided-mode/pages/savePageChanges";
import { getNonSkippedGuidedModePages } from "../../../scripts/guided-mode/pages/navigationUtils/pageSkipping";

const icons = {
  "Getting Started": <IconPlayerPlay />,
  "Dataset Structure": <IconBlocks />,
  "Dataset Metadata": <IconListDetails />,
  "Generate Dataset": <IconUpload />,
};

const LinksGroup = ({ label, initiallyOpened, pages }) => {
  console.log("[LinksGroup] Rendering LinksGroup with label:", label, "and pages:", pages);
  const hasPages = Array.isArray(pages);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const items = (hasPages ? pages : []).map((page) => {
    console.log("[LinksGroup] Creating link item for page:", page);
    const currentPage = window.CURRENT_PAGE?.id;
    const pageIsCurrentPage = page.pageID === currentPage;
    return (
      <Text
        component="a"
        className={`${classes.link} ${pageIsCurrentPage ? classes.linkActive : ""}`}
        key={page.pageID || page.pageName}
        py={3}
        px={7}
      >
        {page.pageName}
      </Text>
    );
  });

  return (
    <>
      <UnstyledButton className={classes.control}>
        <Group justify="flex-start" gap={12} onClick={() => setOpened((o) => !o)}>
          <ThemeIcon variant="light" size={30} radius="md">
            {icons[label]}
          </ThemeIcon>
          <Box ml="md">
            <Text fw={600} size="md" c="black">
              {label}
            </Text>
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
