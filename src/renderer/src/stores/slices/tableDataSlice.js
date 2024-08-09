import useGlobalStore from "../globalStore"; // Import the global state store
import { produce } from "immer"; // produce makes working with nested state modifications easier

export const singleColumnTableSlice = (set) => ({
  tableData: {}, //Initial table state
  processStatusTableData: {}, //Initial process status table state
});

export const addRows = (id, rows) => {
  useGlobalStore.setState(
    produce((state) => {
      state.tableData[id] = rows;
    })
  );
};

export const removeRows = (id) => {
  useGlobalStore.setState(
    produce((state) => {
      state.tableData[id] = [];
    })
  );
};

export const addOrUpdateProcessStatusRow = (id, rowId, status, progress) => {
  useGlobalStore.setState(
    produce((state) => {
      // Initialize the array if it does not exist
      if (!Array.isArray(state.processStatusTableData[id])) {
        state.processStatusTableData[id] = [];
      }

      // Find the row by rowId
      const row = state.processStatusTableData[id].find((r) => r.rowId === rowId);

      // Update or add the row
      if (row) {
        row.status = status;
        row.progress = progress;
      } else {
        state.processStatusTableData[id].push({ rowId, status, progress });
      }
    })
  );
};

export const removeProcessStatusRows = (id) => {
  useGlobalStore.setState(
    produce((state) => {
      state.processStatusTableData[id] = [];
    })
  );
};
