import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Image } from "@mantine/core";

// Content lookup object that maps keys to arrays of content sections.
// Each section specifies its type (e.g., text, image) and associated data.
const contentLookup = {
  "sub-": [
    { type: "text", data: "This is the first section for key1." },
    { type: "image", data: "https://via.placeholder.com/150" }, // Example image URL
    { type: "text", data: "Here is another section for key1." },
  ],
  "sam-": [
    { type: "text", data: "This is the first section for key2." },
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
            return <Text key={index}>{section.data}</Text>;
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
