import useGlobalStore from "../../../stores/globalStore";
import { Checkbox, Text, UnstyledButton, Stack } from "@mantine/core";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../stores/slices/checkboxCardSlice";

import { IconSun, IconBuildingFactory, IconMountain, IconSnowflake } from "@tabler/icons-react";

const dataMap = {
  "generate-dataset-locally": {
    title: "Generate dataset locally",
    description: "Create a local copy of your dataset on your computer",
    Icon: IconSun,
  },
  "generate-dataset-on-pennsieve": {
    title: "Generate dataset on Pennsieve",
    description: "Generate a dataset directly on the Pennsieve platform",
    Icon: IconBuildingFactory,
  },
};

const CheckboxCard = ({ id }) => {
  const data = dataMap[id];

  if (!data) {
    return <div>Invalid id: {id}</div>;
  }

  const { title, description, Icon } = data;
  const checked = useGlobalStore((state) => !!state.checkboxes[id]);

  const handleCardClick = () => {
    if (checked) {
      setCheckboxCardUnchecked(id);
    } else {
      setCheckboxCardChecked(id);
    }
  };

  return (
    <UnstyledButton
      onClick={handleCardClick}
      style={{
        display: "flex",
        alignItems: "center",
        width: "300px",
        padding: "var(--mantine-spacing-sm)",
        border: checked
          ? "1px solid var(--mantine-color-blue-6)"
          : "1px solid var(--mantine-color-gray-3)",
        background: checked ? "var(--mantine-color-blue-0)" : "transparent",
      }}
    >
      <Checkbox
        checked={checked}
        onChange={(e) => {
          e.stopPropagation();
          if (checked) {
            setCheckboxCardUnchecked(id);
          } else {
            setCheckboxCardChecked(id);
          }
        }}
        tabIndex={-1}
        styles={{ input: { cursor: "pointer" } }}
      />
      {Icon && <Icon size={40} style={{ marginRight: 16 }} />}
      <Stack>
        <Text fw={500} size="sm" lh={1}>
          {title}
        </Text>
        <Text c="dimmed" size="xs" lh={1} mb={5}>
          {description}
        </Text>
      </Stack>
    </UnstyledButton>
  );
};

export default CheckboxCard;
