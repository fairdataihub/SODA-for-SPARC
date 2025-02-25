import { Stack, Button, Text, Paper } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { IconChevronRight, IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import classes from "./DropDownNote.module.css";
import SodaGreenPaper from "../SodaGreenPaper";

const dropDownIcons = {
  info: <IconInfoCircle className={classes.dropDownIcon} color="black" />,
};

const DropDownNote = ({ dropDownIcon, dropDownButtonText, dropDownNote }) => {
  const [isOpen, toggleOpen] = useToggle([false, true]);

  return (
    <Stack gap="xs">
      <Button variant="subtle" justify="left" onClick={toggleOpen} className={classes.button}>
        {dropDownIcon && dropDownIcons[dropDownIcon]}
        <Text td="underline" className={classes.dropDownButtonText} sx={{ mx: 6 }}>
          {dropDownButtonText}
        </Text>
        {isOpen ? (
          <IconChevronDown className={classes.dropDownIcon} />
        ) : (
          <IconChevronRight className={classes.dropDownIcon} />
        )}
      </Button>
      {isOpen && <SodaGreenPaper>{dropDownNote}</SodaGreenPaper>}
    </Stack>
  );
};

export default DropDownNote;
