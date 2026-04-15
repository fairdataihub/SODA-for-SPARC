import axios from "axios";
// // get port number from the main process
window.log.info("Requesting the port");
window.port = await window.electron.ipcRenderer.invoke("get-port");
window.log.info("Port is: " + window.port);

let client = axios.create({
  baseURL: `http://127.0.0.1:${window.port}`,
  timeout: 300000,
});

export default client;
