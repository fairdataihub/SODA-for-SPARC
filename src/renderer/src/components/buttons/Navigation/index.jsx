import { Button, Group } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconArrowLeft, IconArrowRight, IconDeviceFloppy } from "@tabler/icons-react";
import classes from "./NavigationButton.module.css";

const NavigationButton = ({
  buttonId,
  buttonText,
  navIcon,
  buttonSize,
  buttonColor,
  buttonCustomWidth,
  buttonCustomClass,
  onClick,
}) => {
  const { hovered, ref } = useHover();
  console.log("buttonColor:", buttonColor);
  return (
    <Button
      variant="outline"
      color={buttonColor || "black"}
      id={buttonId}
      size={buttonSize}
      ref={ref}
      style={{ width: buttonCustomWidth }}
      className={classes[buttonCustomClass]}
      onClick={onClick}
    >
      <Group>
        {navIcon === "save" && <IconDeviceFloppy />}
        {navIcon === "left-arrow" && (
          <IconArrowLeft className={hovered && classes.hoveredArrowLeft} />
        )}
        <span className="nav-button-text">{buttonText}</span>
        {navIcon === "right-arrow" && (
          <IconArrowRight className={hovered && classes.hoveredArrowRight} />
        )}
      </Group>
    </Button>
  );
};

export default NavigationButton;
