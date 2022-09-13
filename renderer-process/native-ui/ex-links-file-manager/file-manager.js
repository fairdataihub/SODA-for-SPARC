const { shell } = require("electron");
const os = require("os");

const fileManagerBtn = document.getElementById("open-file-manager");

fileManagerBtn.addEventListener("click", (event) => {
  console.log("Here?")
  shell.showItemInFolder(os.homedir());
});
