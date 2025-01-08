import { Menu } from "@mantine/core";
import { useEffect, useCallback } from "react";
import useGlobalStore from "../../../stores/globalStore";
import {
  closeContextMenu,
  deleteFilesByRelativePath,
  setFolderMoveMode,
} from "../../../stores/slices/datasetTreeViewSlice";

const ContextMenu = () => {
  const { contextMenuIsOpened, contextMenuPosition, contextMenuItemData } = useGlobalStore();

  const handleClickOutside = useCallback((event) => {
    const menuElement = document.getElementById("context-menu");
    const portalMenuElement = document.querySelector(".mantine-Menu-dropdown");

    if (!menuElement && !portalMenuElement) {
      console.warn("🚨 Neither menu element nor portal menu found in the DOM!");
      return;
    }

    if (event.target.closest("#context-menu") || event.target.closest(".mantine-Menu-dropdown")) {
      console.log("✅ Click was inside the context menu or portal. Ignoring...");
    } else {
      console.log("❌ Click was outside the context menu. Closing menu...");
      closeContextMenu();
    }
  }, []);

  useEffect(() => {
    if (!contextMenuIsOpened) {
      console.log("🛑 Context menu is not open. Skipping listener setup.");
      return;
    }

    console.log("✅ Adding click outside listener.");
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      console.log("🔄 Cleaning up click outside listener.");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuIsOpened, handleClickOutside]);

  if (!contextMenuIsOpened) return null;

  const menuStyles = {
    position: "absolute",
    top: (contextMenuPosition?.y || 0) + 5,
    left: (contextMenuPosition?.x || 0) + 5,
    zIndex: 99999,
  };

  const handleDelete = () => {
    if (contextMenuItemData?.relativePath) {
      deleteFilesByRelativePath([contextMenuItemData.relativePath]);
      closeContextMenu();
    } else {
      console.error("No relative path found for deletion");
    }
  };

  return (
    <div id="context-menu" style={menuStyles}>
      <Menu opened position="top" offset={5} styles={{ dropdown: menuStyles }}>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => {
              console.log("data" + JSON.stringify(contextMenuItemData, null, 2));
              setFolderMoveMode(true);
              closeContextMenu();
            }}
          >
            Move
          </Menu.Item>
          <Menu.Item
            onClick={() => {
              console.log("foo");
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
