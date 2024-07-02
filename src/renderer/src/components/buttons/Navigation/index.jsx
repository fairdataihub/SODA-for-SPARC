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
  buttonOnClick,
}) => {
  const { hovered, ref } = useHover();
  return (
    <Button
      variant="outline"
      color={buttonColor}
      id={buttonId}
      size={buttonSize}
      ref={ref}
      style={{ width: buttonCustomWidth }}
      onClick={buttonOnClick}
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
