import useGlobalStore from "../globalStore";
export const licenseSlice = (set) => ({
  availableLicenses: [],
  licenseText: "",
  licenseTextIsDirty: false,
  selectedLicense: null,
  includeLicenseFile: false,
});
export const fetchLicenseOptionsFromSPDX = async () => {
  try {
    console.log("[SPDX] Starting fetch for license options...");
    const response = await fetch("https://spdx.org/licenses/licenses.json");
    console.log("[SPDX] Fetch response status:", response.status);
    if (!response.ok) {
      console.error("[SPDX] Response not OK:", response.status, response.statusText);
      throw new Error("Failed to fetch license options");
    }
    const data = await response.json();
    console.log("[SPDX] Raw data received:", data);
    const licenses = data.licenses.map((license) => ({
      value: license.licenseId,
      label: license.name,
    }));
    // Add 'Other' option for custom licenses
    licenses.push({ value: "Other (custom license)", label: "Other (custom license)" });
    console.log("[SPDX] Parsed licenses:", licenses);
    useGlobalStore.setState({ availableLicenses: licenses });
    console.log("[SPDX] Licenses set in global store.");
  } catch (error) {
    console.error("Error fetching license options:", error);
    useGlobalStore.setState({ availableLicenses: [] });
    console.log("[SPDX] Licenses set to empty array due to error.");
  }
};

export const fetchLicenseTextForSelectedLicense = async (licenseId) => {
  try {
    console.log(`[SPDX] Fetching text for license ID: ${licenseId}`);
    const response = await fetch(`https://spdx.org/licenses/${licenseId}.json`);
    console.log("[SPDX] Response from license text fetch:", response);
    console.log("[SPDX] License text fetch response status:", response.status);
    if (!response.ok) {
      console.error("[SPDX] License text fetch not OK:", response.status, response.statusText);
      throw new Error("Failed to fetch license text");
    }
    const data = await response.json();
    console.log("[SPDX] License text received:", data);
    // Always use licenseText so the user can edit it directly
    const editableText = data.licenseText || "";
    useGlobalStore.setState({ licenseText: editableText });
    console.log("[SPDX] License text set in global store:", editableText);
    return editableText;
  } catch (error) {
    console.error("Error fetching license text:", error);
    useGlobalStore.setState({ licenseText: "" });
    throw error;
  }
};

export const setLicenseText = (licenseText) => {
  console.log("[SPDX] Setting license text:", licenseText);
  useGlobalStore.setState({ licenseText });
};

export const setLicenseTextIsDirty = (licenseTextIsDirty) => {
  console.log("[SPDX] Setting license text dirty state:", licenseTextIsDirty);
  useGlobalStore.setState({ licenseTextIsDirty });
};
