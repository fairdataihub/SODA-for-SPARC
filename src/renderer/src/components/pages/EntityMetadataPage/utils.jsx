import { Stack, Text, Divider } from "@mantine/core";
// OptionalFieldsNotice: Notice for optional form fields
export const OptionalFieldsNotice = () => (
  <Stack gap={0}>
    <Text size="xs" align="center" c="dimmed">
      The form inputs below are optional and can be filled in later.
    </Text>
    <Divider size="lg" />
  </Stack>
);
