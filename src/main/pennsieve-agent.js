import { ipcMain } from "electron";
import { spawn } from "node:child_process";

ipcMain.handle("pennsieve:upload-manifest", (event, manifestId) => {
  return new Promise((resolve, reject) => {
    const proc = spawn("pennsieve", ["upload", "manifest", manifestId], {
      shell: true,
      env: process.env,
    });

    proc.stdout.on("data", (data) => {
      event.sender.send("pennsieve:upload-progress", data.toString());
    });

    proc.stderr.on("data", (data) => {
      event.sender.send("pennsieve:upload-progress", data.toString());
    });

    proc.on("close", (code) => {
      if (code === 0) resolve({ success: true });
      else reject(new Error(`pennsieve agent exited with code ${code}`));
    });

    proc.on("error", (err) => reject(err));
  });
});
