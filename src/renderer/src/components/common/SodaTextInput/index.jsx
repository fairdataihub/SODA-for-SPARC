import useGlobalStore from "../../../stores/globalStore";
import { TextInput, Textarea } from "@mantine/core";
import {
  setSodaTextInputValue,
  getSodaTextInputValue,
} from "../../../stores/slices/sodaTextInputSlice";

/**
 * SodaTextInput - A controlled text input hooked to the global store by id.
 * @param {string} id - The unique key for this input in the store.
 * @param {string} label - The label for the input.
 * @param {string} [placeholder] - Optional placeholder text.
 */
const SodaTextInput = ({ id, label, description, placeholder, textArea, maxLength }) => {
  console.log("textArea", textArea);
  const value = useGlobalStore((state) => state.sodaTextInputs?.[id] || "");
  const handleChange = (event) => {
    setSodaTextInputValue(id, event.target.value);
  };

  if (textArea) {
    return (
      <Textarea
        label={label}
        description={description}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        style={{ width: "100%" }}
        minRows={5}
        autosize
        maxLength={typeof maxLength === "number" ? maxLength : undefined}
      />
    );
  }

  return (
    <TextInput
      label={label}
      description={description}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      style={{ width: "100%" }}
      maxLength={typeof maxLength === "number" ? maxLength : undefined}
    />
  );
};

export default SodaTextInput;
