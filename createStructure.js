const fs = require("fs");
const path = require("path");

// The folder where the structure exists
const baseFolder = path.join(__dirname, "SPARC structure template");

// Function to generate 1KB of random data
const generateRandomData = () => {
  const length = 1024; // 1KB = 1024 bytes
  let data = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    data += randomChar;
  }
  return data;
};

// Function to create data files in all folders
const createFilesInFolders = (folderPath) => {
  // Read all files and directories in the current folder
  const items = fs.readdirSync(folderPath);

  // Loop through each item
  items.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    const stats = fs.statSync(itemPath);

    // If it's a directory, process it recursively
    if (stats.isDirectory()) {
      createFilesInFolders(itemPath); // Recurse into subfolders

      // Create data1.txt and data2.txt inside the folder
      const data1Path = path.join(itemPath, "data1.txt");
      const data2Path = path.join(itemPath, "data2.txt");

      fs.writeFileSync(data1Path, generateRandomData());
      fs.writeFileSync(data2Path, generateRandomData());

      console.log(`Created files in folder: ${itemPath}`);
    }
  });
};

// Start the process from the base folder
if (fs.existsSync(baseFolder) && fs.statSync(baseFolder).isDirectory()) {
  createFilesInFolders(baseFolder);
  console.log("Finished creating files in all folders.");
} else {
  console.log('Base folder "SPARC structure template" does not exist.');
}
