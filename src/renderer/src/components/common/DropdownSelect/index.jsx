import { Select } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { setDropdownState } from "../../../stores/slices/dropDownSlice";

const DropdownSelect = ({ id }) => {
  const { label, description, selectedValue, placeholder, options, required } =
    useGlobalStore((state) => state.dropDownState[id]) || {};

  /**
   * Transforms a flat options array into grouped format for Mantine Select.
   * Only runs grouping logic if section dividers exist in the options array (options that begin
   * with "*section-divider*").
   *
   * @param {string[]} options - Array of dropdown options
   * @returns {Array|Array<{group: string, items: string[]}>} - Flat array or grouped array
   */
  const transformOptionsToGroups = (options = []) => {
    // If no section dividers, return options as-is
    if (!options.some((option) => option.startsWith("*section-divider*"))) {
      return options;
    }

    const groups = []; // Array to hold groups
    let currentGroup = null; // Current group label
    let currentItems = []; // Items belonging to the current group

    options.forEach((option) => {
      if (option.startsWith("*section-divider*")) {
        // Save previous group if it exists
        if (currentGroup && currentItems.length) {
          groups.push({ group: currentGroup, items: currentItems });
        }
        // Start a new group
        currentGroup = option.replace("*section-divider*", "").trim();
        currentItems = [];
      } else {
        // Add option to current group
        currentItems.push(option);
      }
    });

    // Push the final group after iteration
    if (currentGroup && currentItems.length) {
      groups.push({ group: currentGroup, items: currentItems });
    }

    return groups;
  };

  const groupedOptions = transformOptionsToGroups(options);
  const onChange = (value) => {
    setDropdownState(id, value);
  };

  return (
    <Select
      label={label}
      placeholder={placeholder}
      description={description || ""}
      data={groupedOptions}
      value={selectedValue}
      onChange={onChange}
      required={required}
    />
  );
};

export default DropdownSelect;
