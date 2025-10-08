import { Group, Paper, Box } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

const InstructionsTowardsLeftContainer = ({ children }) => {
  return (
    <Paper p={10} radius="md" bg="gray.0" withBorder={true}>
      <Group align="center" justify="flex-start" spacing="md" wrap="nowrap">
        <IconArrowLeft size={40} color="var(--color-soda-primary)" stroke={1.6} />
        {children}
      </Group>
    </Paper>
  );
};

export default InstructionsTowardsLeftContainer;
