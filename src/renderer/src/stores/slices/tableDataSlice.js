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

export const addOrUpdateProcessStatusRow = (id, rowName, rowStatus) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.processStatusTableData[id]) {
        state.processStatusTableData[id] = [];
      }
      const row = state.processStatusTableData[id].find((r) => r.rowName === rowName);
      if (row) {
        row.rowStatus = rowStatus;
      } else {
        state.processStatusTableData[id].push({ rowName: rowName, rowStatus: rowStatus });
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
