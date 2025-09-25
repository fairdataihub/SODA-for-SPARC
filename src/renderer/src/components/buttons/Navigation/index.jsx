import { Button, Group } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconArrowLeft, IconArrowRight, IconDeviceFloppy } from "@tabler/icons-react";
import classes from "./NavigationButton.module.css";
import { useEffect } from "react";

import useGlobalStore from "../../../stores/globalStore";

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

  const navigationButtonStates = useGlobalStore((state) => state.navigationButtonStates);
  console.log("Navigation Button States:", navigationButtonStates);
  const isDisabled = navigationButtonStates?.[buttonId] === false;

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
      disabled={isDisabled}
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
