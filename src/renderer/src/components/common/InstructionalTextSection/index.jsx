import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Image, Group } from "@mantine/core";
import { IconPig, IconMickey } from "@tabler/icons-react";

// Content lookup object that maps keys to arrays of content sections.
const InstructionalTextSection = ({ textSectionKey }) => {
  const contentLookup = {
    "sub-": [
      {
        type: "text",
        data: "Every subject that data was extracted from must be given a unique ID that can be used to associate data with. SODA provides three options for specifying subject IDs based on the number of subjects and your preference:",
      },
      {
        type: "double-pictogram",
        leftData: {
          icon: <IconMickey />,
          textArray: ["sub-mouse-1", "sub-mouse-2", "sub-mouse-3"],
        },
        rightData: {
          icon: <IconPig />,
          textArray: ["sub-pig-1", "sub-pig-2", "sub-pig-3"],
        },
      },
      {
        type: "text",
        data: "Every subject that data was extracted from must be given a unique ID that can be used to associate data with. SODA provides three options for specifying subject IDs based on the number of subjects and your preference:",
      },
      {
        type: "text",
        data: "<b>1. Manual Entry (Recommended for fewer than 10 subjects):</b> Manually enter subject IDs directly into the interface below. This is ideal for small datasets or if you prefer not to use automated methods.",
      },
      {
        type: "text",
        data: "<b>2. Spreadsheet Entry (Recommended for more than 10 subjects):</b> Upload a spreadsheet file containing subject IDs. This method is suited for larger datasets or when you already have the subject IDs organized in a file.",
      },
      {
        type: "text",
        data: "<b>3. Extract from Folder Names (Recommended if you imported folders with names that subject IDs can be extracted from):</b> Automatically generate subject IDs by extracting them from folder names. Use this method if your data is already organized into folders named after the subjects.",
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
