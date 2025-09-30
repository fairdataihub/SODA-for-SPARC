import React from "react";
import useGlobalStore from "../../../stores/globalStore";
import { Card, Text, Stack, Group, Image, Button, Badge, Tooltip, Loader } from "@mantine/core";
import { IconClock, IconTrash } from "@tabler/icons-react";
import Avvvatars from "avvvatars-react";
import { guidedGetCurrentUserWorkSpace } from "../../../scripts/guided-mode/workspaces/workspaces";

const generateProgressResumptionButton = (
  datasetStartingPoint,
  boolAlreadyUploadedToPennsieve,
  progressFileName,
  workspaceUserNeedsToSwitchTo,
  lastVersionOfSodaUsed
) => {
  let buttonText;
  let color = "blue";
  let variant = "filled";
  console.log("progressFileName:", progressFileName);
  const appVersion = useGlobalStore.getState().appVersion;
  console.log("App version:", appVersion);

  if (workspaceUserNeedsToSwitchTo) {
    if (!window.defaultBfAccount) {
      return (
        <Button
          size="md"
          color="gray"
          variant="light"
          onClick={() => window.openDropdownPrompt?.(null, "ps")}
        >
          Log in to Pennsieve to resume curation
        </Button>
      );
    }
    return (
      <Button
        size="md"
        color="blue"
        variant="light"
        onClick={() => window.openDropdownPrompt?.(null, "organization")}
      >
        Switch to {workspaceUserNeedsToSwitchTo} workspace to resume curation
      </Button>
    );
  }

  if (boolAlreadyUploadedToPennsieve) {
    buttonText = "Share with the Curation Team";
    color = "green";
  } else if (datasetStartingPoint === "new") {
    buttonText = "Resume curation";
    color = "blue";
  } else {
    buttonText = "Continue updating Pennsieve Dataset";
    color = "orange";
  }

  if (lastVersionOfSodaUsed < "16.0.0") {
    buttonText = "Continue using a previous version of SODA";
    color = "gray";
  }

  return (
    <Button
      size="md"
      color={color}
      variant={variant}
      onClick={() => window.guidedResumeProgress(progressFileName)}
    >
      {buttonText}
    </Button>
  );
};
const GuidedModeProgressCards = () => {
  const guidedModeProgressCardsLoadingText = useGlobalStore(
    (state) => state.guidedModeProgressCardsLoadingText
  );
  const guidedModeProgressCardsDataArray = useGlobalStore(
    (state) => state.guidedModeProgressCardsDataArray || []
  );

  if (guidedModeProgressCardsLoadingText) {
    return (
      <Stack align="center" gap="md">
        <Loader color="primary" type="bars" />

        <Text size="md" fw={500}>
          {guidedModeProgressCardsLoadingText}
        </Text>
      </Stack>
    );
  }

  return (
    <>
      {guidedModeProgressCardsDataArray.length === 0 ? (
        <Text c="dimmed" size="lg" ta="center" my="xl">
          No datasets in progress found.
        </Text>
      ) : (
        <>
          <Text fw={600} size="lg" ta="center" mb="sm">
            Select the dataset that you would like to continue working with and click "Resume
            Curation"
          </Text>

          <Stack gap="md" align="center" w="100%">
            {guidedModeProgressCardsDataArray.map((progressFile) => {
              const progressFileName = progressFile["digital-metadata"]["name"] || "";
              const progressFileSubtitle =
                progressFile["digital-metadata"]["subtitle"] || "No designated subtitle";
              const bannerImagePath =
                progressFile?.["digital-metadata"]?.["banner-image-path"] || "";
              const progressFileLastModified = new Date(
                progressFile["last-modified"]
              ).toLocaleString([], {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              });
              const failedUploadInProgress =
                progressFile["previously-uploaded-data"] &&
                Object.keys(progressFile["previously-uploaded-data"]).length > 0;

              const subtitleDisplay =
                progressFileSubtitle.length > 70
                  ? `${progressFileSubtitle.substring(0, 70)}...`
                  : progressFileSubtitle;

              const datasetStartingPoint = progressFile?.["starting-point"]?.["origin"];
              // True if the progress file has already been uploaded to Pennsieve
              const alreadyUploadedToPennsieve =
                !!progressFile?.["dataset-successfully-uploaded-to-pennsieve"];

              let workspaceUserNeedsToSwitchTo = false;
              const datasetWorkspace = progressFile?.["digital-metadata"]?.["dataset-workspace"];
              const currentWorkspace = guidedGetCurrentUserWorkSpace();
              if (datasetWorkspace && datasetWorkspace !== currentWorkspace) {
                workspaceUserNeedsToSwitchTo = datasetWorkspace;
              }
              const lastVersionOfSodaUsed = progressFile?.["last-version-of-soda-used"] || "1.0.0";

              return (
                <Card
                  key={progressFileName}
                  radius="md"
                  p="md"
                  w="100%"
                  withBorder
                  display="flex"
                  align="center"
                  justify="space-between"
                >
                  <Group w="100%" align="stretch" gap={0}>
                    {/* Section 1: Image */}
                    {bannerImagePath ? (
                      <Image
                        src={
                          bannerImagePath ||
                          "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80"
                        }
                        alt="Dataset banner image"
                        w={80}
                        h={80}
                        radius="md"
                        fit="cover"
                      />
                    ) : (
                      <Avvvatars value={progressFileName} size={80} style="shape" />
                    )}

                    {/* Section 2: Text */}
                    <Stack gap={4} flex={1} ml="lg" justify="center" align="start">
                      <Text
                        fw={700}
                        size="lg"
                        lineClamp={1}
                        title={progressFileName}
                        style={{ wordBreak: "break-all" }}
                      >
                        {progressFileName}
                      </Text>
                      <Text
                        c="dimmed"
                        size="sm"
                        lineClamp={2}
                        title={progressFileSubtitle}
                        fw={400}
                      >
                        {subtitleDisplay}
                      </Text>

                      <Group gap="xs" align="center" mt={4}>
                        <Tooltip
                          label={`Last modified: ${progressFileLastModified}`}
                          withArrow
                          position="top"
                          zIndex={2999}
                        >
                          <Text
                            size="xs"
                            style={{ display: "flex", alignItems: "center", cursor: "help" }}
                          >
                            <IconClock size={16} style={{ marginRight: 4 }} />
                            {progressFileLastModified}
                          </Text>
                        </Tooltip>
                        {failedUploadInProgress && (
                          <Badge color="yellow" size="xs">
                            Incomplete upload
                          </Badge>
                        )}
                      </Group>
                    </Stack>

                    {/* Section 3: Actions */}
                    <Stack
                      gap="xs"
                      align="flex-end"
                      justify="center"
                      ml="md"
                      style={{ minWidth: 180 }}
                    >
                      {generateProgressResumptionButton(
                        datasetStartingPoint,
                        alreadyUploadedToPennsieve,
                        progressFileName,
                        workspaceUserNeedsToSwitchTo,
                        lastVersionOfSodaUsed
                      )}

                      <Button
                        size="xs"
                        color="black"
                        variant="subtle"
                        leftSection={<IconTrash size={18} />}
                        onClick={() => {
                          if (window.deleteProgressCard) {
                            window.deleteProgressCard({
                              datasetName: progressFileName,
                            });
                          }
                        }}
                      >
                        Delete progress file
                      </Button>
                    </Stack>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </>
  );
};

export default GuidedModeProgressCards;
