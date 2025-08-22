import { IconTableImport, IconKeyboard } from "@tabler/icons-react";

const Icon = ({ iconType }) => {
  const iconTypeMapping = {
    "spreadsheet-import": <IconTableImport size={50} />,
    keyboard: <IconKeyboard size={50} />,
    icon3: "Icon3",
  };
  if (!iconTypeMapping[iconType]) {
    return null; // or a default icon
  }

  return iconTypeMapping[iconType];
};

export default Icon;
