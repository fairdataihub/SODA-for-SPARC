import checkDiskSpace  from 'check-disk-space';
import { ipcMain } from "electron";




ipcMain.handle('getDiskSpace', async (event, location) => {
  let freeMemory = await new Promise( (resolve, reject) => {
    checkDiskSpace(location).then(async (diskSpace) => {
      window.log.info(`Checking available disk space for ${location}`);
      let freeMemory = diskSpace.free; //returns in bytes
      resolve(freeMemory)
     })
  })

  return freeMemory
})