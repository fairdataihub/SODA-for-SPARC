import useGlobalStore from '../globalStore'; // Import the global state store
import { produce } from 'immer'; // produce makes working with nested state modifications easier

export const singleColumnTableSlice = (set) => ({
    tableData: {}, //Initial table state
})


export const addRows = (id, rows) => {
    useGlobalStore.setState(
        produce((state) => {
            state.tableData[id] = rows;
        })
    );
}

export const removeRows = (id) => {
    useGlobalStore.setState(
        produce((state) => {
            state.tableData[id] = [];
        })
    );
}