const fs = require("fs");
const path = require("path");

const rootDir = "Research-Project";

// Sample realistic file contents
const sampleCSV = (id) =>
  `ID,Measurement\n${id}A,${(Math.random() * 50 + 10).toFixed(2)}\n${id}B,${(
    Math.random() * 50 +
    10
  ).toFixed(2)}`;
const sampleJSON = (subject, sampleType) =>
  JSON.stringify(
    {
      subject,
      sampleType,
      timestamp: new Date().toISOString(),
      note: "Initial raw data collection.",
    },
    null,
    2
  );
const logEntry = (subject) =>
  `[${new Date().toISOString()}] Subject ${subject} - Data collected, minor noise detected.`;
const protocolText =
  "Step 1: Prepare sample\nStep 2: Apply method\nStep 3: Record results\nStep 4: Store securely.";

// Function to create directories
function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to create a text file with content
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

// Experimental Data folder
createDir(`${rootDir}/Experimental-Data/Participants`);

// Generate sample-based data collection structure
for (let i = 1; i <= 3; i++) {
  const sampleID = `mouse-${i}`;

  // Participant directory
  createDir(`${rootDir}/Experimental-Data/Participants/${sampleID}`);

  // Blood Samples
  for (let j = 1; j <= 2; j++) {
    createDir(`${rootDir}/Experimental-Data/Participants/${sampleID}/Blood_${j}`);
    createFile(
      `${rootDir}/Experimental-Data/Participants/${sampleID}/Blood_${j}/blood_sample.json`,
      sampleJSON(sampleID, "Blood")
    );
    createFile(
      `${rootDir}/Experimental-Data/Participants/${sampleID}/Blood_${j}/blood_analysis.csv`,
      sampleCSV(sampleID)
    );
  }

  // Tissue Samples
  for (let j = 1; j <= 2; j++) {
    createDir(`${rootDir}/Experimental-Data/Participants/${sampleID}/Tissue_${j}`);
    createFile(
      `${rootDir}/Experimental-Data/Participants/${sampleID}/Tissue_${j}/tissue_sample.json`,
      sampleJSON(sampleID, "Tissue")
    );
    createFile(
      `${rootDir}/Experimental-Data/Participants/${sampleID}/Tissue_${j}/tissue_analysis.csv`,
      sampleCSV(sampleID)
    );
  }
}

// Protocols
createDir(`${rootDir}/Protocols`);
createFile(`${rootDir}/Protocols/MRI-procedure.txt`, protocolText);
createFile(`${rootDir}/Protocols/Blood-collection.txt`, protocolText);

// Experiment Logs
createDir(`${rootDir}/Logs`);
createFile(`${rootDir}/Logs/data-collection.log`, logEntry("General"));

// Scripts folder with dummy files
createDir(`${rootDir}/Scripts`);
createFile(
  `${rootDir}/Scripts/analysis.py`,
  "# Dummy Python script\nprint('Data analysis started')"
);
createFile(
  `${rootDir}/Scripts/index.html`,
  "<!DOCTYPE html>\n<html>\n<head><title>Research Project</title></head>\n<body><h1>Welcome to the Research Project</h1></body>\n</html>"
);

console.log(
  "Dataset structure with mouse samples (Blood and Tissue) in Experimental Data created successfully!"
);
