import useGlobalStore from '../globalStore'; // Import the global state store
import { produce } from 'immer'; // produce makes working with nested state modifications easier

const singleColumnTableSlice = set () => {
    singleColumnTableState: {
        // Define the initial state of the single column table
        tableRows: [
        {
            id: 0,
            value: '',
        },
        ],
    },
}