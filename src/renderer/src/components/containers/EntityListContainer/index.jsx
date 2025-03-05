import React from "react";
import { Paper, Group, Text, Divider, Box } from "@mantine/core";

const EntityListContainer = ({
  title, // The title displayed at the top
  children, // The content inside the scrollable box
}) => {
  return (
    <Paper padding="md" shadow="sm" radius="md" p="sm" flex={1} w="100%" withBorder>
      <Text size="lg" fw={500}>
        {title}
      </Text>
      <Divider my="xs" />
      <Box style={{ maxHeight: "300px", overflowY: "auto" }}>{children}</Box>
    </Paper>
  );
};

export default EntityListContainer;
