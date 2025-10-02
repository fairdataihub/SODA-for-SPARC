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
        onClick={async (event) => {
          event.preventDefault();
          // Replicate guided sidebar navigation logic
          const pageToNavigateTo = page.pageID;

          if (!pageToNavigateTo || !currentPage || pageToNavigateTo === currentPage) {
            console.log(
              "[LinksGroup] No navigation needed. because pageToNavigateTo:",
              pageToNavigateTo,
              "currentPage:",
              currentPage
            );
            return;
          }
          try {
            // Save changes on current page
            await window.savePageChanges(currentPage);
            // Get all non-skipped pages in the DOM
            const allNonSkippedPages = window
              .getNonSkippedGuidedModePages(document)
              .map((element) => element.id);
            // Find pages between current and target
            const pagesBetweenCurrentAndTargetPage = allNonSkippedPages.slice(
              allNonSkippedPages.indexOf(currentPage) + 1,
              allNonSkippedPages.indexOf(pageToNavigateTo)
            );
            // Validate intermediate pages if skipping forward
            for (const pageId of pagesBetweenCurrentAndTargetPage) {
              try {
                await window.checkIfPageIsValid(pageId);
              } catch (error) {
                const pageWithErrorName =
                  document.getElementById(pageId)?.getAttribute("data-page-name") || pageId;
                await window.openPage(pageId);
                await window.Swal.fire({
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
                  width: 700,
                });
                return;
              }
            }
            // All pages validated, open target
            await window.openPage(pageToNavigateTo);
          } catch (error) {
            const pageWithErrorName = window.CURRENT_PAGE?.dataset?.pageName || currentPage;
            const { value: continueWithoutSavingCurrPageChanges } = await Swal.fire({
              title: "The current page was not able to be saved",
              html: `The following error${
                (error || []).length > 1 ? "s" : ""
              } occurred when attempting to save the ${pageWithErrorName} page:<br /><br /><ul>${(
                error || []
              )
                .map((err) => `<li class='text-left'>${err.message}</li>`)
                .join(
                  ""
                )}</ul><br />Would you like to continue without saving the changes to the current page?`,
              icon: "info",
              showCancelButton: true,
              confirmButtonText: "Yes, continue without saving",
              cancelButtonText: "No, I would like to address the errors",
              confirmButtonWidth: 255,
              cancelButtonWidth: 255,
              focusCancel: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              width: 700,
            });
            if (continueWithoutSavingCurrPageChanges) {
              await window.openPage(pageToNavigateTo);
            }
          }
        }}
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
