import useGlobalStore from '../globalStore'; // Import the global state store
import { produce } from 'immer'; // produce makes working with nested state modifications easier

export const singleColumnTableSlice = (set) => ({
    tableRows: [], //Initial table state
})


export const addRows = (rows) => {
    useGlobalStore.setState(
        produce((state) => {
            state.tableRows = rows;
        })
    );
}

export const removeRows = () => {
    useGlobalStore.setState(
        produce((state) => {
            state.tableRows = [];
        })
    );
}