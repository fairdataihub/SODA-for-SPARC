import { Stack, Space, Button, Text, Paper } from "@mantine/core";
import { useState } from "react";
import { IconChevronRight, IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import classes from "./DropDownNote.module.css";

import SodaGreenPaper from "../SodaGreenPaper";

const DropDownNote = ({ dropDownIcon, dropDownButtonText, dropDownNote }) => {
  const dropDownIcons = {
    info: <IconInfoCircle color="black" className={classes.dropDownIcon} />,
  };
  const [dropDownOpen, setDropDownOpen] = useState(false);
  return (
    <Stack gap="xs">
      <Button justify="left" variant="subtle" onClick={() => setDropDownOpen(!dropDownOpen)}>
        {dropDownIcon && dropDownIcons[dropDownIcon]}
        <Text
          td="underline"
          size="md"
          className={classes.dropDownButtonText}
          style={{
            marginLeft: "4px",
            marginRight: "7px",
          }}
        >
          {dropDownButtonText}
        </Text>
        {dropDownOpen ? (
          <IconChevronDown color="black" className={classes.dropDownIcon} />
        ) : (
          <IconChevronRight color="black" className={classes.dropDownIcon} />
        )}
      </Button>
      {dropDownOpen && <SodaGreenPaper>{dropDownNote}</SodaGreenPaper>}
      <Space />
    </Stack>
  );
};

export default DropDownNote;
