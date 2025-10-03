import { useState } from "react";
import {
  IconCalendarStats,
  IconChevronRight,
  IconPlayerPlay,
  IconBlocks,
  IconListDetails,
  IconUpload,
} from "@tabler/icons-react";
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton, Button } from "@mantine/core";
import { getNonSkippedGuidedModePages } from "../../../scripts/guided-mode/pages/navigationUtils/pageSkipping";
import classes from "./Sidebar.module.css";
import Swal from "sweetalert2";

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
    console.log("[LinksGroup] Rendering link for page:", page);
    const currentPage = window.CURRENT_PAGE?.id;
    const pageIsCurrentPage = page.pageID === currentPage;

    return (
      <Button
        variant="subtle"
        size="compact-md"
        fullWidth
        justify="flex-start"
        className={`${classes.link} ${pageIsCurrentPage ? classes.linkActive : ""}`}
        key={page.pageID || page.pageName}
        disabled={!page.completed} // disable if not complete
        color="black"
        style={{
          fontWeight: pageIsCurrentPage ? "bold" : "normal",
        }}
        onClick={async () => {
          if (pageIsCurrentPage) {
            console.log("[LinksGroup] Current page is already active:", page.pageName);
            return;
          }
          const pageToNavigateTo = page.pageID;
          const allNonSkippedPages = getNonSkippedGuidedModePages(document).map(
            (element) => element.id
          );
          const pagesBetweenCurrentAndTargetPage = allNonSkippedPages.slice(
            allNonSkippedPages.indexOf(currentPage) + 1,
            allNonSkippedPages.indexOf(pageToNavigateTo)
          );
          const userIsNavigatingForward =
            allNonSkippedPages.indexOf(pageToNavigateTo) > allNonSkippedPages.indexOf(currentPage);
          console.log("[LinksGroup] User is navigating forward:", userIsNavigatingForward);
          console.log(
            "[LinksGroup] Pages between current and target:",
            pagesBetweenCurrentAndTargetPage
          );
          try {
            await window.savePageChanges(currentPage);
            console.log("[LinksGroup] Current page saved successfully:", currentPage);
          } catch (errorArray) {
            if (userIsNavigatingForward) {
              await Swal.fire({
                title: "The current page was not able to be saved",
                html: `The following error${
                  errorArray.length > 1 ? "s" : ""
                } occurred when attempting to save the current page:<br /><br /><ul>${errorArray
                  .map((err) => `<li class='text-left'>${err.message}</li>`)
                  .join("")}</ul><br />Please address the errors before continuing.`,
                icon: "info",
                confirmButtonText: "OK, I'll fix the errors",
                focusConfirm: true,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
                width: 800,
              });
              return;
            } else {
              console.info(
                "[LinksGroup] Current page had an issue being saved, but user is navigating back so ignoring."
              );
            }
          }
          if (userIsNavigatingForward) {
            for (const pageId of pagesBetweenCurrentAndTargetPage) {
              try {
                await window.checkIfPageIsValid(pageId);
              } catch (error) {
                const pageWithErrorName =
                  document.getElementById(pageId)?.getAttribute("data-page-name") || pageId;
                await window.openPage(pageId);
                await Swal.fire({
                  title: `An error occured on an intermediate page: ${pageWithErrorName}`,
                  html: `Please address the issues before continuing to ${
                    page.pageName
                  }:<br /><br /><ul>${(error || [])
                    .map((err) => `<li class='text-left'>${err.message}</li>`)
                    .join("")}</ul>`,
                  icon: "info",
                  confirmButtonText: "Fix the errors on this page",
                  focusConfirm: true,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                  width: 800,
                });
                return;
              }
            }
          }
          await window.openPage(pageToNavigateTo);
        }}
      >
        {page.pageName}
      </Button>
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
