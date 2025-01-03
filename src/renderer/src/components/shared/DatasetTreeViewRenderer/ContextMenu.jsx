import { Menu } from "@mantine/core";
import { useEffect } from "react";
import useGlobalStore from "../../../stores/globalStore";
import {
  closeContextMenu,
  deleteFilesByRelativePath,
} from "../../../stores/slices/datasetTreeViewSlice";

const ContextMenu = () => {
  const {
    contextMenuIsOpened,
    contextMenuPosition,
    contextMenuItemType,
    contextMenuItemName,
    contextMenuItemData,
  } = useGlobalStore();

  useEffect(() => {
    if (!contextMenuIsOpened) {
      console.log("🛑 Context menu is not open. Skipping listener setup.");
      return;
    }

    const handleClickOutside = (event) => {
      const menuElement = document.getElementById("context-menu");
      const portalMenuElement = document.querySelector(".mantine-Menu-dropdown");

      console.log("⚡ Click Detected!");
      console.log("🔍 Event Target:", event.target);
      console.log("📝 Menu Element:", menuElement);
      console.log("📝 Portal Menu Element:", portalMenuElement);

      if (!menuElement && !portalMenuElement) {
        console.warn("🚨 Neither menu element nor portal menu found in the DOM!");
        return;
      }

      // Check if the click happened inside the menu or its portal
      if (event.target.closest("#context-menu") || event.target.closest(".mantine-Menu-dropdown")) {
        console.log("✅ Click was inside the context menu or portal. Ignoring...");
      } else {
        console.log("❌ Click was outside the context menu. Closing menu...");
        closeContextMenu();
      }
    };

    console.log("✅ Adding click outside listener.");
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      console.log("🔄 Cleaning up click outside listener.");
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
          <Menu.Item onClick={() => console.log("Move")}>Move</Menu.Item>
          <Menu.Item
            onClick={() => {
              if (contextMenuItemData?.relativePath) {
                deleteFilesByRelativePath([contextMenuItemData.relativePath]);
                closeContextMenu(); // Close menu after deletion
              } else {
                console.error("No relative path found for deletion");
              }
            }}
          >
            Delete
          </Menu.Item>
          <Menu.Item onClick={() => console.log("Delete")}>qwer</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};

export default ContextMenu;
