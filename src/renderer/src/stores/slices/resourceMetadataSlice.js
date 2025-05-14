import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Resource types for dropdown selection
export const resourceTypes = ["software", "antibody", "viral vector", "organism", "cell line"];

export const initialState = {
  // Form state
  isResourceFormVisible: false,
  isEditMode: false,
  originalResourceName: "", // Changed from originalResourceId to originalResourceName

  // Resource fields
  rrid: "",
  type: "",
  name: "",
  url: "",
  vendor: "",
  version: "",
  idInProtocol: "",

  // List of saved resources
  resourceList: [],
};

export const resourceMetadataSlice = (set) => ({
  ...initialState,
});

// Form visibility toggle
export const setResourceFormVisible = (visible) => {
  useGlobalStore.setState({
    isResourceFormVisible: visible,
  });
};

// Edit mode toggle
export const setIsEditMode = (isEdit) => {
  useGlobalStore.setState({
    isEditMode: isEdit,
  });
};

// Store original name for edit operations
export const setOriginalResourceName = (name) => {
  useGlobalStore.setState({
    originalResourceName: name,
  });
};

// Field setters
export const setRrid = (value) => {
  useGlobalStore.setState({
    rrid: value,
  });
};

export const setType = (value) => {
  useGlobalStore.setState({
    type: value,
  });
};

export const setName = (value) => {
  useGlobalStore.setState({
    name: value,
  });
};

export const setUrl = (value) => {
  useGlobalStore.setState({
    url: value,
  });
};

export const setVendor = (value) => {
  useGlobalStore.setState({
    vendor: value,
  });
};

export const setVersion = (value) => {
  useGlobalStore.setState({
    version: value,
  });
};

export const setIdInProtocol = (value) => {
  useGlobalStore.setState({
    idInProtocol: value,
  });
};

// Add resource to list
export const addResource = () => {
  useGlobalStore.setState(
    produce((state) => {
      state.resourceList.push({
        // No ID field - name will be used as identifier
        rrid: state.rrid,
        type: state.type,
        name: state.name,
        url: state.url,
        vendor: state.vendor,
        version: state.version,
        idInProtocol: state.idInProtocol,
      });

      // Reset form
      state.rrid = "";
      state.type = "";
      state.name = "";
      state.url = "";
      state.vendor = "";
      state.version = "";
      state.idInProtocol = "";
      state.isResourceFormVisible = false;
    })
  );
};

// Update existing resource
export const updateResource = () => {
  useGlobalStore.setState(
    produce((state) => {
      const resourceIndex = state.resourceList.findIndex(
        (resource) => resource.name === state.originalResourceName
      );

      if (resourceIndex !== -1) {
        state.resourceList[resourceIndex] = {
          // No ID field
          rrid: state.rrid,
          type: state.type,
          name: state.name, // New name might be different from original
          url: state.url,
          vendor: state.vendor,
          version: state.version,
          idInProtocol: state.idInProtocol,
        };
      }

      // Reset form
      state.rrid = "";
      state.type = "";
      state.name = "";
      state.url = "";
      state.vendor = "";
      state.version = "";
      state.idInProtocol = "";
      state.isResourceFormVisible = false;
      state.isEditMode = false;
      state.originalResourceName = "";
    })
  );
};

// Delete resource
export const deleteResource = (name) => {
  useGlobalStore.setState(
    produce((state) => {
      state.resourceList = state.resourceList.filter((resource) => resource.name !== name);
    })
  );
};
