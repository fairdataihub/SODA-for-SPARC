import { Menu, Group, Text, Divider } from "@mantine/core";
import { useEffect, useCallback } from "react";
import useGlobalStore from "../../../stores/globalStore";
import { closeContextMenu, setFolderMoveMode } from "../../../stores/slices/datasetTreeViewSlice";
import {
  deleteFilesByRelativePath,
  deleteFoldersByRelativePath,
} from "../../../stores/utils/folderAndFileActions";
import { IconFolder, IconFolderOpen } from "@tabler/icons-react";

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 16,
  fileSize: 14,
};

const ContextMenu = () => {
  const {
    contextMenuIsOpened,
    contextMenuPosition,
    contextMenuItemName,
    contextMenuItemType,
    contextMenuItemData,
  } = useGlobalStore((state) => ({
    contextMenuIsOpened: state.contextMenuIsOpened,
    contextMenuPosition: state.contextMenuPosition,
    contextMenuItemName: state.contextMenuItemName,
    contextMenuItemType: state.contextMenuItemType,
    contextMenuItemData: state.contextMenuItemData,
  }));

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

  return (
    <div id="context-menu" style={menuStyles}>
      <Menu opened position="top" offset={5} styles={{ dropdown: menuStyles }}>
        <Menu.Dropdown>
          <Group position="start">
            {contextMenuItemType === "folder" ? (
              <IconFolder size={ICON_SETTINGS.folderSize} color={ICON_SETTINGS.folderColor} />
            ) : (
              <IconFolderOpen size={ICON_SETTINGS.folderSize} color={ICON_SETTINGS.folderColor} />
            )}
            <Text fw={300} size="md">
              {contextMenuItemName}
            </Text>
          </Group>
          <Divider my={3} />
          <Menu.Item
            onClick={() => {
              setFolderMoveMode(true);
              closeContextMenu();
            }}
          >
            Move {contextMenuItemType}
          </Menu.Item>
          <Menu.Item
            onClick={() => {
              if (contextMenuItemType === "file") {
                deleteFilesByRelativePath([contextMenuItemData.relativePath]);
              }
              if (contextMenuItemType === "folder") {
                deleteFoldersByRelativePath([contextMenuItemData.relativePath]);
              }
              closeContextMenu();
            }}
          >
            Delete {contextMenuItemType}
          </Menu.Item>
          {contextMenuItemType === "folder" && (
            <Menu.Item
              onClick={(e) => {
                e.preventDefault();
                window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog", {
                  importRelativePath: contextMenuItemData.relativePath,
                });
              }}
            >
              Import data into {contextMenuItemName}
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};

export default ContextMenu;
