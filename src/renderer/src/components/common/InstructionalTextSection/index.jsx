import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Image, Group } from "@mantine/core";
import { IconPig, IconMickey } from "@tabler/icons-react";

// Content lookup object that maps keys to arrays of content sections.
const InstructionalTextSection = ({ textSectionKey }) => {
  const contentLookup = {
    "sub-": [
      {
        type: "text",
        data: "Every subject that data was extracted from must be given a unique ID that can be used to associate data with. Subject IDs can be added via the three following methods:",
      },

      {
        type: "text",
        data: "<b>1. Manual Entry:</b> Enter subject IDs manually in the interface below.",
      },
      {
        type: "text",
        data: "<b>2. Spreadsheet Entry (Recommended for more than 10 subjects):</b> Generate a spreadsheet template to input subject IDs in bulk. Use auto-fill to save time if the IDs follow a pattern.",
      },
      {
        type: "text",
        data: "<b>3. Extract from Folder Names (Recommended for more than 10 subjects):</b> Automatically create subject IDs by extracting them from folder names. This method is useful if your data is organized in a way that the folder names contain the subject IDs.",
      },
    ],
    "sam-": [
      {
        type: "text",
        data: "If any measurements were taken from samples collected from subjects (e.g. tissue samples), you can specify the samples in the interface below.",
      },
      { type: "image", data: "https://via.placeholder.com/300" },
      { type: "text", data: "And yet another section for key2." },
    ],
    "sites-": [
      { type: "text", data: "This is the first section for key2." },
      { type: "image", data: "https://via.placeholder.com/300" },
      { type: "text", data: "And yet another section for key2." },
    ],
  };
  const contentSections = contentLookup[textSectionKey];

  if (!contentSections) {
    return null;
  }

  return (
    <GuidedModeSection>
      {/* Render each section based on its type */}
      {contentSections.map((section, index) => {
        switch (section.type) {
          case "text":
            return <Text key={index} dangerouslySetInnerHTML={{ __html: section.data }} />;
          case "image":
            return <Image key={index} src={section.data} alt={`Section image ${index}`} />;
          case "double-pictogram":
            return (
              <Group key={index} w="100%" style={{ marginTop: 20 }}>
                <div>
                  {section.leftData.icon}
                  {section.leftData.textArray.map((text, idx) => (
                    <Text key={idx}>{text}</Text>
                  ))}
                </div>
                <div>
                  {section.rightData.icon}
                  {section.rightData.textArray.map((text, idx) => (
                    <Text key={idx}>{text}</Text>
                  ))}
                </div>
              </Group>
            );
          default:
            return null;
        }
      })}
    </GuidedModeSection>
  );
};

export default InstructionalTextSection;
