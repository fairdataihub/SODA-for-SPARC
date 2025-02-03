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

// Generate subject-based data collection structure
for (let i = 1; i <= 3; i++) {
  const subjectID = `S00${i}`;
  const sessionDate = new Date(2025, 0, i + 1).toISOString().split("T")[0];

  // Subjects (all data stored per subject)
  createDir(`${rootDir}/Subjects/${subjectID}`);

  for (let j = 1; j <= 2; j++) {
    const performanceID = `Performance_${j}`;
    createDir(`${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/${performanceID}`);
    createFile(
      `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/${performanceID}/reaction_times.csv`,
      sampleCSV(subjectID)
    );
    createFile(
      `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/${performanceID}/eeg_data.txt`,
      `EEG data for ${subjectID}, performance ${j}`
    );
  }

  // Session-based subfolders
  createDir(`${rootDir}/Subjects/${subjectID}/Session_${sessionDate}`);
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/MRI_raw.txt`,
    `MRI raw data for subject ${subjectID}`
  );
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/EEG_raw.csv`,
    sampleCSV(subjectID)
  );
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/experiment_notes.log`,
    logEntry(subjectID)
  );

  // Samples collected during the session
  createDir(`${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples`);

  // Tissue Samples
  createDir(`${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples/Tissue`);
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples/Tissue/tissue_sample.json`,
    sampleJSON(subjectID, "Tissue")
  );
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples/Tissue/tissue_analysis.csv`,
    sampleCSV(subjectID)
  );

  // Blood Samples
  createDir(`${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples/Blood`);
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples/Blood/blood_sample.json`,
    sampleJSON(subjectID, "Blood")
  );
  createFile(
    `${rootDir}/Subjects/${subjectID}/Session_${sessionDate}/Samples/Blood/blood_analysis.csv`,
    sampleCSV(subjectID)
  );
}

// Raw Data (Unprocessed files researchers would collect)
createDir(`${rootDir}/Raw-Data`);
createFile(
  `${rootDir}/Raw-Data/brain-scan-${new Date().toISOString().split("T")[0]}.txt`,
  "Raw MRI scan data."
);
createFile(`${rootDir}/Raw-Data/eeg-unfiltered_${new Date().getTime()}.csv`, sampleCSV("EEG"));

// Protocols
createDir(`${rootDir}/Protocols`);
createFile(`${rootDir}/Protocols/MRI-procedure.txt`, protocolText);
createFile(`${rootDir}/Protocols/Blood-collection.txt`, protocolText);

// Experiment Logs
createDir(`${rootDir}/Logs`);
createFile(`${rootDir}/Logs/data-collection.log`, logEntry("General"));

console.log(
  "Realistic research dataset structure with Tissue and Blood samples created successfully!"
);
