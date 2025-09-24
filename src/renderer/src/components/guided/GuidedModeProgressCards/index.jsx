import React from "react";
import useGlobalStore from "../../../stores/globalStore";
import { Card, Text, Stack, Group, Image, Button, Badge, Tooltip } from "@mantine/core";
import { IconClock, IconTrash } from "@tabler/icons-react";

const GuidedModeProgressCards = () => {
  const guidedModeProgressCardsLoading = useGlobalStore(
    (state) => state.guidedModeProgressCardsLoading
  );
  const guidedModeProgressCardsDataArray = useGlobalStore(
    (state) => state.guidedModeProgressCardsDataArray || []
  );

  if (guidedModeProgressCardsLoading) {
    return <Text>Loading...</Text>;
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
            Select the dataset that you would like to continue working with and click "Continue"
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

              return (
                <Card
                  key={progressFileName}
                  shadow="sm"
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
                    <Image
                      src={
                        bannerImagePath ||
                        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80"
                      }
                      alt="Dataset banner image"
                      w={100}
                      h={100}
                      radius="md"
                      fit="cover"
                    />

                    {/* Section 2: Text */}
                    <Stack gap={4} flex={1} ml="md" justify="center" align="start">
                      <Text
                        fw={700}
                        size="md"
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
                      <Button
                        size="md"
                        variant="light"
                        color="black"
                        onClick={() => {
                          if (window.guidedResumeProgress) {
                            window.guidedResumeProgress(progressFileName);
                          }
                        }}
                      >
                        Resume curation
                      </Button>

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
