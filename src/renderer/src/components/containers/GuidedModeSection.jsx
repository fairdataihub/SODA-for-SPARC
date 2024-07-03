import { Stack, Paper } from "@mantine/core";

const GuidedModeSection = ({ children, bordered }) => {
  return bordered ? (
    <Paper shadow="sm" radius="md" p="sm" withBorder>
      <Stack gap="sm" w="100%">
        {children}
      </Stack>
    </Paper>
  ) : (
    <Stack gap="sm" w="100%">
      {children}
    </Stack>
  );
};

export default GuidedModeSection;
