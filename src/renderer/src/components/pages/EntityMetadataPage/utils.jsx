import { Stack, Text, Divider, Badge, Group } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
// OptionalFieldsNotice: Notice for optional form fields
export const OptionalFieldsNotice = () => {
  const showFullMetadataFormFields = useGlobalStore((state) => state.showFullMetadataFormFields);

  if (showFullMetadataFormFields) {
    return null; // Don't show the notice if the full metadata form fields are not displayed
  }

  return (
    <Stack gap={0}>
      <Group position="center">
        <Divider style={{ flex: 1 }} />
        <Text size="xs" align="center" c="dimmed">
          The inputs below are optional and can be filled in later.
        </Text>
        <Divider style={{ flex: 1 }} />
      </Group>
    </Stack>
  );
};
export const AdditionalMetadataFieldDivider = (dataStandard) => {
  if (!dataStandard) return null;
  return (
    <Stack gap={5}>
      <Group position="center">
        <Divider style={{ flex: 1 }} />
        <Badge
          variant="gradient"
          gradient={{ from: "rgb(77, 43, 95)", to: "rgb(171, 76, 50)", deg: 90 }}
        >
          {dataStandard} Specific Fields
        </Badge>
        <Divider style={{ flex: 1 }} />
      </Group>
      <Text size="xs" align="center" c="dimmed">
        The inputs below are specific to the {dataStandard} data standard.
      </Text>
    </Stack>
  );
};
