import { useState } from "react";
import ReactDOM from "react-dom";
import useTestStore from "../../stores/testStore";
import { TextInput, Textarea } from "@mantine/core";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";

const NameSubtitlePage = () => {
  const [versions] = useState(window.electron.process.versions);

  const testStore = useTestStore(); // Get the Zustand store instance

  const handleNameChange = (value) => {
    testStore.setName(value); // Update the name in the store
  };

  const handleSubtitleChange = (value) => {
    testStore.setSubtitle(value); // Update the subtitle in the store
  };
  return (
    <SodaComponentWrapper>
      <TextInput
        label="Name"
        placeholder="Enter name"
        value={testStore.name}
        onChange={(event) => handleNameChange(event.target.value)}
      />
      <Textarea
        label="Subtitle"
        placeholder="Enter subtitle"
        value={testStore.subtitle}
        onChange={(event) => handleSubtitleChange(event.target.value)}
      />
    </SodaComponentWrapper>
  );
};

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

ReactDOM.render(<NameSubtitlePage />, document.getElementById("guided-name-subtitle-tab"));
