const {contextBridge} = require("electron");

defaultBfAccount; 
defaultBfDataset = "Select dataset"
defaultBfDatasetId = undefined

contextBridge.exposeInMainWorld('globals', {
    defaultBfAccount: defaultBfAccount,
    defaultBfDataset: defaultBfDataset,
    defaultBfDatasetId: defaultBfDatasetId
})

