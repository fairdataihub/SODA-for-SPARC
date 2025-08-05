const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}
export const getProgressFileData = async (progressFile) => {
  let progressFilePath = window.path.join(guidedProgressFilePath, progressFile + ".json");
  return readFileAsync(progressFilePath);
};

export const getAllProgressFileData = async (progressFiles) => {
  return Promise.all(
    progressFiles.map((progressFile) => {
      let progressFilePath = window.path.join(guidedProgressFilePath, progressFile);
      return readFileAsync(progressFilePath);
    })
  );
};

const readFileAsync = async (path) => {
  let result = await window.fs.readFile(path, "utf-8");
  return result;
};
