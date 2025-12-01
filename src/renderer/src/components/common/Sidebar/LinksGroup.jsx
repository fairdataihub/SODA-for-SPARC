import { useState } from "react";
import {
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
import { setOpenSidebarTab } from "../../../stores/slices/sideBarSlice";
import { checkIfPageIsValid } from "../../../scripts/guided-mode/pages/sidebar";
import { swalShowError } from "../../../scripts/utils/swal-utils";
import useGlobalStore from "../../../stores/globalStore";
import { clientError } from "../../../scripts/others/http-error-handler/error-handler";

const icons = {
  "Getting Started": <IconPlayerPlay color="black" />,
  "Dataset Structure": <IconBlocks color="black" />,
  "Dataset Metadata": <IconListDetails color="black" />,
  "Generate Dataset": <IconUpload color="black" />,
};

/**
 * Handles navigation logic when clicking on a page button.
 */
async function handlePageNavigation(page, currentPage) {
  // No action if clicking on the current page
  if (page.pageID === currentPage) {
    return;
  }

  const targetPage = page.pageID;
  const allPages = getNonSkippedGuidedModePages(document).map((el) => el.id);
  const currentIndex = allPages.indexOf(currentPage);
  const targetIndex = allPages.indexOf(targetPage);
  const userIsNavigatingForward = targetIndex > currentIndex;

  const intermediatePages = allPages.slice(currentIndex + 1, targetIndex);

  try {
    await window.savePageChanges(currentPage);
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
    for (const pageId of intermediatePages) {
      try {
        await checkIfPageIsValid(pageId);
      } catch (error) {
        clientError(error);
        const pageName = document.getElementById(pageId)?.getAttribute("data-page-name") || pageId;
        await window.openPage(pageId);

        // Ensure error is an array and format it properly
        const errorArray = Array.isArray(error) ? error : [error];
        const errorListHtml =
          errorArray.length > 0
            ? `<ul>${errorArray
                .map((err) => `<li class='text-left'>${err?.message || err}</li>`)
                .join("")}</ul>`
            : "<p>Unknown error occurred</p>";

        await swalShowError(
          `An error occured on an intermediate page: ${pageName}`,
          `<div></div><div class="text-center">Please address the issues before continuing to ${page.pageName}:</div><br />${errorListHtml}</div>`
        );
        return;
      }
    }
  }

  await window.openPage(targetPage);
}

/**
 * Renders a button for a given page.
 */
function PageButton({ page, isActive, isNextPageToComplete }) {
  return (
    <Button
      variant="subtle"
      size="compact-md"
      fullWidth
      justify="flex-start"
      key={page.pageID || page.pageName}
      color="black"
      className={`
        ${classes.pageButton} ${isActive ? classes.pageButtonActive : ""}
        ${isNextPageToComplete ? classes.nextPageToComplete : ""}
        ${!page.completed && !isActive && !isNextPageToComplete ? classes.disabled : ""}
      `}
      style={{
        fontWeight: isActive ? 600 : 400,
      }}
      onClick={() => handlePageNavigation(page, window.CURRENT_PAGE?.id)}
    >
      <Text
        style={{
          whiteSpace: "normal",
          wordBreak: "break-word",
          textAlign: "left",
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {page.pageName}
      </Text>
    </Button>
  );
}

const LinksGroup = ({ label, pages }) => {
  const openSidebarTab = useGlobalStore((state) => state.openSidebarTab);
  const opened = openSidebarTab === label;
  const hasPages = Array.isArray(pages);
  const currentPage = window.CURRENT_PAGE?.id;
  const allPages = getNonSkippedGuidedModePages(document).map((el) => el.id);
  const userCompletedPages = window.sodaJSONObj["completed-tabs"] || [];
  const nextPage = allPages.find((page) => !userCompletedPages.includes(page)) || null;

  const items = hasPages
    ? pages.map((page) => (
        <PageButton
          key={page.pageID || page.pageName}
          page={page}
          isActive={page.pageID === currentPage}
          isNextPageToComplete={page.pageID === nextPage}
        />
      ))
    : null;

  return (
    <>
      <UnstyledButton
        className={`${classes.link} ${opened ? classes.linkActive : ""}`}
        onClick={() => setOpenSidebarTab(label)}
        p="xs"
        w="100%"
      >
        <Group justify="space-between" w="100%">
          <Group gap={8}>
            <ThemeIcon variant="light" size={30} radius="md">
              {icons[label]}
            </ThemeIcon>
            <Text fw={600} size="md" c="black">
              {label}
            </Text>
          </Group>

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
      {hasPages && <Collapse in={opened}>{items}</Collapse>}
    </>
  );
};

export default LinksGroup;
