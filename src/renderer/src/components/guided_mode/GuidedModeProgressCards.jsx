import React from "react";
import { Card, Text, Stack, Center, Badge, Button, Group, Image } from "@mantine/core";

/**
 * @param {Object[]} cards - Array of progress card data objects
 * @param {Function} onResume - Function called with progressFileName when resume button is clicked
 * @param {Function} onDelete - Function called with progressFileName when delete is clicked
 */
const GuidedModeProgressCards = ({ cards, onResume, onDelete }) => {
  if (!cards || cards.length === 0) {
    return (
      <Center my="xl">
        <Text c="dimmed" size="lg">
          No datasets in progress found.
        </Text>
      </Center>
    );
  }
  return (
    <Stack gap="md" my="md">
      <Text fw={600} size="lg" align="center" mb="sm">
        Select the dataset that you would like to continue working with and click "Continue"
      </Text>
      <Group justify="center" wrap="wrap" gap="md">
        {cards.map((progressFile) => {
          const bannerImagePath = progressFile?.["digital-metadata"]?.["banner-image-path"] || "";
          const progressFileImage = bannerImagePath ? (
            <Image
              src={`file://${bannerImagePath}`}
              alt="Dataset banner image"
              width={80}
              height={80}
              radius="md"
            />
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
              alt="Dataset banner image placeholder"
              width={80}
              height={80}
              radius="md"
            />
          );
          const progressFileName = progressFile["digital-metadata"]["name"] || "";
          const progressFileSubtitle =
            progressFile["digital-metadata"]["subtitle"] || "No designated subtitle";
          const progressFileLastModified = new Date(progressFile["last-modified"]).toLocaleString(
            [],
            { year: "numeric", month: "numeric", day: "numeric" }
          );
          const failedUploadInProgress =
            progressFile["previously-uploaded-data"] &&
            Object.keys(progressFile["previously-uploaded-data"]).length > 0;
          return (
            <Card key={progressFileName} shadow="sm" padding="md" radius="md" w={340} withBorder>
              <Group align="flex-start" gap="md">
                {progressFileImage}
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text fw={600} size="md" lineClamp={1} title={progressFileName}>
                    {progressFileName}
                  </Text>
                  <Text c="dimmed" size="sm" lineClamp={2} title={progressFileSubtitle}>
                    {progressFileSubtitle}
                  </Text>
                  <Group gap={4} align="center">
                    <Text size="xs" c="dimmed">
                      {progressFileLastModified}
                    </Text>
                    {failedUploadInProgress && (
                      <Badge color="yellow" size="xs">
                        Incomplete upload
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Group>
              <Group justify="apart" mt="md">
                <Button size="xs" color="blue" onClick={() => onResume(progressFileName)}>
                  Continue
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={() => onDelete(progressFileName)}
                >
                  Delete
                </Button>
              </Group>
            </Card>
          );
        })}
      </Group>
    </Stack>
  );
};

export default GuidedModeProgressCards;
