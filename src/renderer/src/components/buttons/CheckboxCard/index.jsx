import useGlobalStore from "../../../stores/globalStore";
import { Checkbox, Text, UnstyledButton, Stack } from "@mantine/core";
import pennsieveLogo from "../../../assets/img/pennsieveLogo.png";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../stores/slices/checkboxCardSlice";

import { IconDeviceDesktop } from "@tabler/icons-react";

const dataMap = {
  "generate-dataset-locally": {
    title: "Generate dataset locally",
    description: "Create a local copy of your dataset on your computer",
    Icon: IconDeviceDesktop,
  },
  "generate-dataset-on-pennsieve": {
    title: "Generate dataset on Pennsieve",
    description: "Pennsieve is the official data management platform for the SPARC program.",
    image: pennsieveLogo,
  },
};

const CheckboxCard = ({ id }) => {
  const data = dataMap[id];

  if (!data) {
    return <div>Invalid id: {id}</div>;
  }

  const { title, description, Icon, image } = data;
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
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "270px",
        minHeight: "180px",
        padding: "var(--mantine-spacing-lg)",
        border: checked
          ? "2px solid var(--mantine-color-blue-6)"
          : "2px solid var(--mantine-color-gray-3)",
        background: checked ? "var(--mantine-color-blue-0)" : "#fff",
        borderRadius: 12,
        boxSizing: "border-box",
        boxShadow: checked ? "0 2px 8px 0 rgba(34,139,230,0.08)" : "none",
        transition: "border 0.2s, background 0.2s",
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
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          marginBottom: 0,
          zIndex: 2,
        }}
      />
      {image ? (
        <img
          src={image}
          alt={title}
          style={{ width: 48, height: 48, marginBottom: 16, objectFit: "contain" }}
        />
      ) : (
        Icon && (
          <Icon size={48} style={{ marginBottom: 16, color: checked ? "#228be6" : "#868e96" }} />
        )
      )}
      <Stack align="center" gap={4} style={{ width: "100%" }}>
        <Text fw={600} size="md" lh={1} align="center" mb="sm">
          {title}
        </Text>
        <Text c="dimmed" size="sm" lh={1.3} align="center">
          {description}
        </Text>
      </Stack>
    </UnstyledButton>
  );
};

export default CheckboxCard;
