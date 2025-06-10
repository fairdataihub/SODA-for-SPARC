import React from "react";
import { Checkbox, Text, UnstyledButton } from "@mantine/core";
import classes from "./CheckboxCard.module.css";

// Import Tabler Icons you want to use
import { IconSun, IconBuildingFactory, IconMountain, IconSnowflake } from "@tabler/icons-react";

const dataMap = {
  "generate-dataset-locally": {
    title: "Beach vacation",
    description: "Sun and sea",
    Icon: IconSun,
  },
  city: { title: "City trips", description: "Sightseeing", Icon: IconBuildingFactory },
  mountain: { title: "Hiking vacation", description: "Mountains", Icon: IconMountain },
  winter: { title: "Winter vacation", description: "Snow and ice", Icon: IconSnowflake },
};

const CheckboxCard = ({ id, checked, onChange, className, ...others }) => {
  const data = dataMap[id];

  if (!data) {
    return <div>Invalid id: {id}</div>;
  }

  const { title, description, Icon } = data;

  return (
    <UnstyledButton
      {...others}
      onClick={() => onChange(!checked, id)}
      data-checked={true}
      className={`${classes.button} ${className || ""}`}
      style={{ display: "flex", alignItems: "center" }} // Ensure horizontal alignment
    >
      {Icon && <Icon size={40} style={{ marginRight: 16 }} />}

      <div className={classes.body}>
        <Text c="dimmed" size="xs" lh={1} mb={5}>
          {description}
        </Text>
        <Text fw={500} size="sm" lh={1}>
          {title}
        </Text>
      </div>

      <Checkbox
        checked={true}
        onChange={(e) => onChange(e.currentTarget.checked, id)}
        tabIndex={-1}
        styles={{ input: { cursor: "pointer" } }}
        onClick={(e) => e.stopPropagation()}
      />
    </UnstyledButton>
  );
};

export default CheckboxCard;
