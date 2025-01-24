import React from "react";
import { Paper, Group, Text, Divider, Box } from "@mantine/core";

const EntityListContainer = ({
  title, // The title displayed at the top
  children, // The content inside the scrollable box
  shadow = "lg", // Shadow for the Paper component
  padding = "md", // Padding for the Paper component
  radius = "md", // Border radius for the Paper component
  withBorder = true, // Whether the Paper component has a border
}) => {
  return (
    <Paper shadow={shadow} p={padding} radius={radius} withBorder={withBorder}>
      <Text size="lg" weight={500}>
        {title}
      </Text>
      <Divider my="xs" />
      <Box style={{ maxHeight: "300px", overflowY: "auto" }}>{children}</Box>
    </Paper>
  );
};

export default EntityListContainer;
