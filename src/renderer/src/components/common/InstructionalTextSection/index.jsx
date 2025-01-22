import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Image } from "@mantine/core";

// Content lookup object that maps keys to arrays of content sections.
// Each section specifies its type (e.g., text, image) and associated data.
const contentLookup = {
  "sub-": [
    {
      type: "text",
      data: "Each subject must be uniquely identified with a subject ID. SODA provides three options for specifying subject IDs based on the number of subjects and your preference:",
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

const InstructionalTextSection = ({ textSectionKey }) => {
  // Retrieve content sections for the given key. If the key is not found,
  // provide a fallback with a "Content not found" message.
  const contentSections = contentLookup[textSectionKey] || [
    { type: "text", data: "Content not found." },
  ];

  return (
    <GuidedModeSection>
      {/* Render each section based on its type */}
      {contentSections.map((section, index) => {
        switch (section.type) {
          case "text":
            // Render a text section
            // Use the dangerouslySetInnerHTML prop to render HTML content because the text
            // may contain HTML tags (e.g., <b>Manual</b>)
            return <Text key={index} dangerouslySetInnerHTML={{ __html: section.data }} />;
          case "image":
            // Render an image section
            return <Image key={index} src={section.data} alt={`Section image ${index}`} />;
          default:
            // Handle unknown or unsupported section types
            return null;
        }
      })}
    </GuidedModeSection>
  );
};

export default InstructionalTextSection;
