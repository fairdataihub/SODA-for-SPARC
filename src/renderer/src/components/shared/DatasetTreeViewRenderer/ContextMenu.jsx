import { Menu } from "@mantine/core";
import { useEffect } from "react";
import useGlobalStore from "../../../stores/globalStore";
import { closeContextMenu } from "../../../stores/slices/datasetTreeViewSlice";

const ContextMenu = () => {
  const {
    contextMenuIsOpened,
    contextMenuPosition,
    contextMenuItemType,
    contextMenuItemName,
    contextMenuItemData,
  } = useGlobalStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuElement = document.getElementById("context-menu");
      if (menuElement && !menuElement.contains(event.target)) {
        closeContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuIsOpened]);

  const menuStyles = {
    position: "absolute", // Changed to fixed to check if that resolves the positioning issue
    top: (contextMenuPosition?.y || 0) + 5,
    left: (contextMenuPosition?.x || 0) + 5,
    zIndex: 99999,
  };

  if (!contextMenuIsOpened) {
    return null;
  }
  console.log("Context menu data:", contextMenuItemData);
  console.log("Context menu item type:", contextMenuItemType);
  console.log("Context menu item name:", contextMenuItemName);

  return (
    <div id="context-menu" style={menuStyles}>
      <Menu
        opened={true}
        position="top" // or any position like 'bottom', 'left', 'right'
        offset={5} // Optional, adjust for more spacing
        styles={{
          dropdown: {
            ...menuStyles, // Apply styles here to override the portal positioning
          },
        }}
      >
        <Menu.Dropdown>
          {contextMenuItemData?.relativePath && (
            <Menu.Item onClick={() => console.log("Open")}>
              {contextMenuItemData?.relativePath}
            </Menu.Item>
          )}
          <Menu.Item onClick={() => console.log("Rename")}>Rename</Menu.Item>
          <Menu.Item onClick={() => console.log("Move")}>Move</Menu.Item>
          <Menu.Item onClick={() => console.log("Delete")}>Delete</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};

export default ContextMenu;
