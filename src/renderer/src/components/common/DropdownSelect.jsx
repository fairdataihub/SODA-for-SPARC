import { Select } from "@mantine/core";

function DropdownSelect({ label, placeholder, options, setSelection }) {
  return (
    <Select
      label="Your favorite library"
      placeholder="Pick value"
      data={["React", "Angular", "Vue", "Svelte"]}
    />
  );
}

export default DropdownSelect;
