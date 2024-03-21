import { Stack, Space, Button, Text, Paper } from "@mantine/core";
import { useState } from "react";
import { IconChevronRight, IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import classes from "./DropDownNote.module.css";

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
          size="lg"
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
      {dropDownOpen && (
        <Paper
          p="sm"
          shadow="sm"
          withBorder
          style={{
            backgroundColor: "var(--color-transparent-soda-green)",
            border: "1px solid var(--color-light-green)",
          }}
        >
          {dropDownNote}
        </Paper>
      )}
      <Space />
    </Stack>
  );
};

export default DropDownNote;
