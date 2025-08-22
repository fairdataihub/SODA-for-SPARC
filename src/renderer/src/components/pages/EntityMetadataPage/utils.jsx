import { Stack, Text, Divider } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
// OptionalFieldsNotice: Notice for optional form fields
export const OptionalFieldsNotice = () => {
  const showFullMetadataFormFields = useGlobalStore((state) => state.showFullMetadataFormFields);

  if (showFullMetadataFormFields) {
    return null; // Don't show the notice if the full metadata form fields are not displayed
  }

  return (
    <Stack gap={0}>
      <Text size="xs" align="center" c="dimmed">
        The form inputs below are optional and can be filled in later.
      </Text>
      <Divider size="lg" />
    </Stack>
  );
};
