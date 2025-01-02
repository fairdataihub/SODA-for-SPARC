import { Menu } from "@mantine/core";
import { useEffect, forwardRef } from "react";

const ContextMenu = forwardRef(({ isOpened, position, onClose, contextMenuData }, ref) => {
  console.log("isOpened", isOpened);
  console.log("position", position);
  console.log("contextMenuData", contextMenuData);
  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log("ref.current", ref.current);
      console.log(
        "Click was inside the context menu",
        ref.current && ref.current.contains(event.target)
      );
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpened) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpened, onClose, ref]);

  // To prevent menu from being cut off on the screen edges, we can add a little offset.
  const menuStyles = {
    position: "absolute",
    top: position.y,
    left: position.x,
    zIndex: 99999,
  };

  return (
    <div ref={ref}>
      <Menu
        opened={isOpened}
        onClose={onClose}
        position="top" // or any position like 'bottom', 'left', 'right'
        offset={5} // Optional, adjust for more spacing
        styles={{
          dropdown: {
            ...menuStyles, // Apply styles here to override the portal positioning
          },
        }}
      >
        <Menu.Dropdown>
          <Menu.Item onClick={() => console.log("Open")}>Rename</Menu.Item>
          <Menu.Item onClick={() => console.log("Rename")}>Move</Menu.Item>
          <Menu.Item onClick={() => console.log("Delete")}>ddd</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
});

export default ContextMenu;
