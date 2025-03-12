const fs = require("fs");
const path = require("path");

const rootDir = "Lab-Dataset";

// Sample realistic file contents for typical lab data
const sampleRawData = (id, type, runNum) =>
  `# Raw ${type} data - Run ${runNum}\n` +
  `Sample ID: ${id}\n` +
  `Date: ${new Date().toLocaleDateString()}\n` +
  `Values: ${Array.from({ length: 5 }, () => (Math.random() * 50 + 10).toFixed(2)).join(", ")}\n` +
  `Notes: Standard collection protocol followed`;

const sampleExcelData = (id, type) =>
  `Subject,Measurement Type,Value 1,Value 2,Value 3\n` +
  `${id},${type},${(Math.random() * 50 + 10).toFixed(2)},${(Math.random() * 50 + 10).toFixed(2)},${(
    Math.random() * 50 +
    10
  ).toFixed(2)}`;

const labNotes = (id, sampleType, date) =>
  `Lab Notes - ${sampleType} Sample\n` +
  `Subject: ${id}\n` +
  `Date: ${date}\n` +
  `Collected by: J. Smith\n\n` +
  `Processing Notes:\n` +
  `- Sample centrifuged at 3000 rpm for 10 minutes\n` +
  `- Stored at -80°C (Freezer #2)\n` +
  `- Quality check: Passed\n\n` +
  `Observations: Sample appears normal with no visible contamination`;

const quickProtocol = (type) =>
  `Quick Protocol - ${type} Collection\n\n` +
  `1. Prepare subject according to lab SOP\n` +
  `2. Collect ${type.toLowerCase()} sample using standard technique\n` +
  `3. Process within 30 minutes of collection\n` +
  `4. Label tubes with subject ID, date, and technician initials\n` +
  `5. Store according to sample type requirements`;

const createImageFile = (id, type) => {
  // This creates an empty file to represent an image
  return `[This would be a ${type} sample image for subject ${id}]`;
};

const sampleAnalysisScript =
  `#!/usr/bin/env python3\n\n` +
  `import pandas as pd\n` +
  `import matplotlib.pyplot as plt\n\n` +
  `# Load data\n` +
  `data = pd.read_csv('sample_data.csv')\n\n` +
  `# Basic analysis\n` +
  `mean_value = data['Value'].mean()\n` +
  `std_value = data['Value'].std()\n\n` +
  `print(f"Mean: {mean_value}, Std Dev: {std_value}")\n\n` +
  `# Create plot\n` +
  `plt.figure()\n` +
  `plt.scatter(data['Time'], data['Value'])\n` +
  `plt.xlabel('Time')\n` +
  `plt.ylabel('Value')\n` +
  `plt.title('Sample Analysis')\n` +
  `plt.savefig('analysis_plot.png')\n`;

const projectReadme =
  `# Lab Project Dataset\n\n` +
  `This directory contains raw research data collected between January-March 2023.\n\n` +
  `## Contents\n` +
  `- 3 subjects (001, 002, 003)\n` +
  `- Blood and tissue samples for each subject\n` +
  `- Lab notes and processing information\n\n` +
  `Contact lab manager (labmanager@example.org) for questions.\n\n` +
  `NOTE: This data requires processing before SPARC submission.`;

// Function to create directories
function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to create a file with content
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

// Create lab dataset structure
createDir(rootDir);

// Project-level files
createFile(`${rootDir}/README.md`, projectReadme);
createFile(
  `${rootDir}/lab_inventory.xlsx`,
  "Subject ID,Sample Types,Collection Date,Location\n001,Blood/Tissue,2023-01-15,Freezer 2\n002,Blood/Tissue,2023-02-03,Freezer 2\n003,Blood/Tissue,2023-03-10,Freezer 2"
);
createDir(`${rootDir}/analysis_scripts`);
createFile(`${rootDir}/analysis_scripts/analyze_samples.py`, sampleAnalysisScript);
createFile(
  `${rootDir}/analysis_scripts/plot_data.R`,
  "# R script for plotting\nlibrary(ggplot2)\n\ndata <- read.csv('../subjects/subject_001/blood/blood_data.csv')\nggplot(data, aes(x=time, y=value)) + geom_point() + theme_minimal()"
);

// Create a protocols folder with some basic protocols
createDir(`${rootDir}/lab_protocols`);
createFile(`${rootDir}/lab_protocols/blood_collection.txt`, quickProtocol("Blood"));
createFile(`${rootDir}/lab_protocols/tissue_collection.txt`, quickProtocol("Tissue"));
createFile(
  `${rootDir}/lab_protocols/sample_processing.docx`,
  "This is a placeholder for a Word document with sample processing protocols."
);

// Create a subjects folder to hold all subject data
createDir(`${rootDir}/subjects`);

// Generate data structure for 3 subjects
const collectionDates = ["2023-01-15", "2023-02-03", "2023-03-10"];

for (let i = 1; i <= 3; i++) {
  const subjectID = `subject_${i.toString().padStart(3, "0")}`;
  const collectionDate = collectionDates[i - 1];

  // Create subject directory inside subjects folder
  createDir(`${rootDir}/subjects/${subjectID}`);

  // Subject overview file
  createFile(
    `${rootDir}/subjects/${subjectID}/subject_info.txt`,
    `Subject ID: ${subjectID}\nCollection Date: ${collectionDate}\nExperimenter: J. Smith\nProject: EXAMPLE-2023-A`
  );

  // Blood samples directory with files
  createDir(`${rootDir}/subjects/${subjectID}/blood`);
  createFile(
    `${rootDir}/subjects/${subjectID}/blood/blood_data.csv`,
    sampleExcelData(subjectID, "Blood")
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/blood/lab_notes.txt`,
    labNotes(subjectID, "Blood", collectionDate)
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/blood/run_1.txt`,
    sampleRawData(subjectID, "Blood", 1)
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/blood/run_2.txt`,
    sampleRawData(subjectID, "Blood", 2)
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/blood/blood_sample.jpg`,
    createImageFile(subjectID, "Blood")
  );

  // Tissue samples directory with files
  createDir(`${rootDir}/subjects/${subjectID}/tissue`);
  createFile(
    `${rootDir}/subjects/${subjectID}/tissue/tissue_data.csv`,
    sampleExcelData(subjectID, "Tissue")
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/tissue/lab_notes.txt`,
    labNotes(subjectID, "Tissue", collectionDate)
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/tissue/microscopy_notes.txt`,
    `Microscopy Session: ${new Date().toLocaleDateString()}\nSample: ${subjectID}-Tissue\nMagnification: 40x\nStaining: H&E\nFindings: Normal tissue architecture observed`
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/tissue/tissue_sample.jpg`,
    createImageFile(subjectID, "Tissue")
  );
  createFile(
    `${rootDir}/subjects/${subjectID}/tissue/tissue_sample_processed.jpg`,
    createImageFile(subjectID, "Processed Tissue")
  );

  // Raw instrument output files (typically disorganized in real labs)
  if (i === 1) {
    createDir(`${rootDir}/subjects/${subjectID}/instrument_output`);
    createFile(
      `${rootDir}/subjects/${subjectID}/instrument_output/raw_data_01152023.dat`,
      `[Binary instrument data would be here for ${subjectID}]`
    );
    createFile(
      `${rootDir}/subjects/${subjectID}/instrument_output/session_log.txt`,
      `Session started: 9:15 AM\nSession ended: 10:32 AM\nInstrument: Acme Analyzer 3000\nOperator: J. Smith`
    );
  }
}

console.log(
  "Lab dataset structure created successfully with 3 subjects and their blood and tissue samples in a pre-SPARC format!"
);
