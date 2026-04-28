import { ipcMain } from "electron";
import { spawn } from "node:child_process";

ipcMain.handle("pennsieve:upload-manifest", (event, manifestId) => {
  return new Promise((resolve, reject) => {
    let settleLock = false;
    const returnGuard = (fn, value) => {
      if (settleLock) return;
      settleLock = true;
      fn(value);
    };

    const proc = spawn("pennsieve", ["upload", "manifest", manifestId], {
      shell: true,
      env: process.env,
    });

    const checkForTextError = (data) => {
      const text = data.toString();
      event.sender.send("pennsieve:upload-progress", text);
      if (text.includes("rpc error: code = Unavailable")) {
        proc.kill();
        returnGuard(reject, new Error("The Pennsieve Agent cannot be reached."));
      }
    };

    proc.stdout.on("data", checkForTextError);
    proc.stderr.on("data", checkForTextError);

    proc.on("close", (code, signal) => {
      if (code === 0) {
        returnGuard(resolve, { success: true });
      } else if (signal) {
        returnGuard(
          reject,
          new Error(`Pennsieve agent was stopped externally (signal: ${signal})`)
        );
      } else {
        returnGuard(reject, new Error(`Pennsieve agent exited with code ${code}`));
      }
    });

    proc.on("error", (err) => returnGuard(reject, err));
  });
});
