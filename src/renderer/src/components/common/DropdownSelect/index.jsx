import { Select } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { setDropdownState } from "../../../stores/slices/dropDownSlice";

const DropdownSelect = ({ id }) => {
  const { label, description, selectedValue, placeholder, options, required } = useGlobalStore(
    (state) => state.dropDownState[id]
  );

  const onChange = (value) => {
    setDropdownState(id, value);
  };

  return (
    <Select
      label={label}
      placeholder={placeholder}
      description={description || ""}
      data={options}
      value={selectedValue}
      onChange={onChange}
      required={required}
    />
  );
};

export default DropdownSelect;
