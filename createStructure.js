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
  `- Sample ${
    sampleType === "Heart"
      ? "extracted under sterile conditions"
      : "centrifuged at 3000 rpm for 10 minutes"
  }\n` +
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

const performanceLog = (subjectId, sampleType, date) =>
  `Performance Log\n` +
  `----------------\n` +
  `Subject ID: ${subjectId}\n` +
  `Sample Type: ${sampleType}\n` +
  `Date: ${date}\n` +
  `Researcher: Dr. A. Johnson\n\n` +
  `Protocol: ${
    sampleType === "Heart" ? "Cardiac Imaging Protocol v2.3" : "Blood Analysis Protocol v1.5"
  }\n` +
  `Performance ID: perf-${sampleType.toLowerCase()}-${subjectId.substring(4)}\n\n` +
  `Start Time: 09:30\n` +
  `End Time: 11:45\n\n` +
  `Notes:\n` +
  `- Standard protocol followed\n` +
  `- ${
    sampleType === "Heart" ? "ECG recording successful" : "CBC completed with standard markers"
  }\n` +
  `- Data quality verified\n`;

const projectReadme =
  `# Heart and Blood Sample Dataset\n\n` +
  `This directory contains research data for heart and blood samples collected from 2 subjects.\n\n` +
  `## Contents\n` +
  `- 2 subjects (sub-001, sub-002)\n` +
  `- Heart and blood samples for each subject\n` +
  `- Performance data for each sample type\n` +
  `- Lab notes and processing information\n\n` +
  `Contact lab manager (labmanager@example.org) for questions.\n\n` +
  `NOTE: This data requires processing before SPARC submission.`;

// Define heart site types - changing right-atrium to right-ventricle
const heartSites = ["left-ventricle", "right-ventricle"];

// New function for site-specific data
const siteMeasurementData = (subjectId, siteType) =>
  `Time,Position,Measurement,Value\n` +
  `1,${siteType},Thickness,${(Math.random() * 10 + 2).toFixed(2)} mm\n` +
  `2,${siteType},Flow Rate,${(Math.random() * 100 + 50).toFixed(2)} ml/min\n` +
  `3,${siteType},Pressure,${(Math.random() * 40 + 80).toFixed(2)} mmHg\n` +
  `4,${siteType},Temperature,${(Math.random() * 2 + 36.5).toFixed(2)} °C\n`;

// Site-specific notes - update descriptions for right ventricle
const siteNotes = (subjectId, siteType, date) =>
  `Site: ${siteType}\n` +
  `Subject: ${subjectId}\n` +
  `Date: ${date}\n` +
  `Researcher: Dr. M. Cardio\n\n` +
  `Site-specific Notes:\n` +
  `- ${
    siteType === "left-ventricle"
      ? "Left ventricular measurements taken at base and apex"
      : "Right ventricular measurements focused on free wall"
  }\n` +
  `- Tissue appears healthy with good perfusion\n` +
  `- ${
    siteType === "left-ventricle"
      ? "Wall thickness within normal range"
      : "Contractile function normal"
  }\n`;

// Site metadata file content - update for right ventricle
const siteMetadata = (subjectId, siteType, siteId) =>
  `Site ID: ${siteId}\n` +
  `Related Subject: ${subjectId}\n` +
  `Anatomical Location: ${siteType === "left-ventricle" ? "Left Ventricle" : "Right Ventricle"}\n` +
  `Coordinates: ${
    siteType === "left-ventricle"
      ? "X:25, Y:30, Z:15 (relative to apex)"
      : "X:30, Y:15, Z:10 (relative to pulmonary valve)"
  }\n`;

// Add MRI-specific performance log function
const mriPerformanceLog = (subjectId, siteType, date, sequenceType, performanceNumber) =>
  `MRI Performance Log #${performanceNumber}\n` +
  `----------------\n` +
  `Subject ID: ${subjectId}\n` +
  `Target: Heart - ${siteType}\n` +
  `Date: ${date}\n` +
  `Researcher: Dr. R. Imaging\n\n` +
  `Protocol: Cardiac MRI Protocol v3.1\n` +
  `Performance ID: perf-mri${performanceNumber}-${subjectId.substring(4)}\n\n` +
  `Sequence: ${sequenceType}\n` +
  `Start Time: ${8 + performanceNumber}:30\n` +
  `End Time: ${9 + performanceNumber}:45\n\n` +
  `Parameters:\n` +
  `- Tesla: 3T\n` +
  `- TR: ${Math.floor(Math.random() * 500) + 800} ms\n` +
  `- TE: ${Math.floor(Math.random() * 30) + 20} ms\n` +
  `- Slice Thickness: ${(Math.random() * 2 + 1).toFixed(1)} mm\n` +
  `- FOV: 256 x 256 mm\n\n` +
  `Notes:\n` +
  `- ${sequenceType} sequence completed successfully\n` +
  `- Motion artifacts minimal\n` +
  `- ${siteType} clearly visualized\n`;

// MRI acquisition data
const mriAcquisitionData = (sequenceType) =>
  `Time,Sequence,Parameter,Value\n` +
  `1,${sequenceType},Signal Intensity,${(Math.random() * 1000 + 500).toFixed(2)}\n` +
  `2,${sequenceType},Contrast Ratio,${(Math.random() * 5 + 1).toFixed(2)}\n` +
  `3,${sequenceType},Noise Level,${(Math.random() * 10 + 1).toFixed(2)}\n` +
  `4,${sequenceType},Resolution,${(Math.random() * 0.5 + 0.5).toFixed(2)} mm\n`;

// Add alternative content functions to replace performance data
const createAnalysisResults = (sampleType, siteType = null) =>
  `Analysis Results\n` +
  `----------------\n` +
  `Sample Type: ${sampleType}\n` +
  `${siteType ? `Site: ${siteType}\n` : ""}` +
  `Date: ${new Date().toLocaleDateString()}\n\n` +
  `Summary Statistics:\n` +
  `- Mean value: ${(Math.random() * 15 + 70).toFixed(2)}\n` +
  `- Standard deviation: ${(Math.random() * 5 + 2).toFixed(2)}\n` +
  `- Range: ${(Math.random() * 10 + 30).toFixed(2)} - ${(Math.random() * 10 + 110).toFixed(
    2
  )}\n\n` +
  `Notes:\n` +
  `- Analysis completed using standard protocol\n` +
  `- Quality check passed\n` +
  `- Results validated by senior researcher\n`;

const createMetaboliteData = (sampleType) =>
  `Metabolite,Concentration (mM),Detection Method\n` +
  `Glucose,${(Math.random() * 3 + 4).toFixed(2)},Spectroscopy\n` +
  `Lactate,${(Math.random() * 1 + 0.5).toFixed(2)},Enzymatic assay\n` +
  `ATP,${(Math.random() * 0.5 + 2).toFixed(2)},Luminescence\n` +
  `Creatine,${(Math.random() * 1 + 5).toFixed(2)},Mass spectrometry\n` +
  `Glutamate,${(Math.random() * 2 + 1).toFixed(2)},HPLC\n`;

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
  "Subject ID,Sample Types,Collection Date,Location\nsub-001,Heart/Blood,2023-06-15,Freezer 2\nsub-002,Heart/Blood,2023-07-10,Freezer 2"
);

// Create analysis scripts directory
createDir(`${rootDir}/analysis_scripts`);
createFile(
  `${rootDir}/analysis_scripts/analyze_heart_samples.py`,
  sampleAnalysisScript.replace("sample_data.csv", "../subjects/sub-001/heart/heart_data.csv")
);
createFile(
  `${rootDir}/analysis_scripts/analyze_blood_samples.py`,
  sampleAnalysisScript.replace("sample_data.csv", "../subjects/sub-001/blood/blood_data.csv")
);

// Create a protocols folder with some basic protocols
createDir(`${rootDir}/lab_protocols`);
createFile(`${rootDir}/lab_protocols/blood_collection.txt`, quickProtocol("Blood"));
createFile(`${rootDir}/lab_protocols/heart_collection.txt`, quickProtocol("Heart"));
createFile(
  `${rootDir}/lab_protocols/cardiac_imaging_protocol.pdf`,
  "This is a placeholder for a PDF document with cardiac imaging protocol."
);

// Create a subjects folder to hold all subject data
createDir(`${rootDir}/subjects`);

// Generate data structure for 2 subjects
const collectionDates = ["2023-06-15", "2023-07-10"];
const sampleTypes = ["blood", "heart"];

for (let i = 1; i <= 2; i++) {
  const subjectID = `sub-${i.toString().padStart(3, "0")}`;
  const collectionDate = collectionDates[i - 1];

  // Create subject directory inside subjects folder
  createDir(`${rootDir}/subjects/${subjectID}`);

  // Subject overview file
  createFile(
    `${rootDir}/subjects/${subjectID}/subject_info.txt`,
    `Subject ID: ${subjectID}\nCollection Date: ${collectionDate}\nExperimenter: J. Smith\nProject: HEART-BLOOD-2023`
  );

  // Create directories and files for each sample type
  sampleTypes.forEach((sampleType) => {
    const sampleDir = `${rootDir}/subjects/${subjectID}/${sampleType}`;
    createDir(sampleDir);

    // Create basic sample data files (common to all sample types)
    createFile(`${sampleDir}/${sampleType}_data.csv`, sampleExcelData(subjectID, sampleType));
    createFile(
      `${sampleDir}/lab_notes.txt`,
      labNotes(subjectID, sampleType.charAt(0).toUpperCase() + sampleType.slice(1), collectionDate)
    );
    createFile(`${sampleDir}/${sampleType}_sample.jpg`, createImageFile(subjectID, sampleType));

    // For heart samples, create site-specific subdirectories and data
    if (sampleType === "heart") {
      // Create run files only for heart data
      createFile(`${sampleDir}/run_1.txt`, sampleRawData(subjectID, sampleType, 1));
      createFile(`${sampleDir}/run_2.txt`, sampleRawData(subjectID, sampleType, 2));

      // Create a common data directory for files that apply to whole heart
      createDir(`${sampleDir}/common`);

      // Move some general files to common directory
      createFile(`${sampleDir}/common/whole_heart_data.csv`, sampleExcelData(subjectID, "heart"));
      createFile(`${sampleDir}/common/heart_sample.jpg`, createImageFile(subjectID, "heart"));

      // Create site-specific directories and data for each heart site
      heartSites.forEach((site, siteIndex) => {
        const siteId = `site-${site}-${i}`;
        const siteDir = `${sampleDir}/${site}`;
        createDir(siteDir);

        // Site-specific files
        createFile(`${siteDir}/metadata.txt`, siteMetadata(subjectID, site, siteId));
        createFile(`${siteDir}/site_notes.txt`, siteNotes(subjectID, site, collectionDate));
        createFile(`${siteDir}/measurements.csv`, siteMeasurementData(subjectID, site));
        createFile(`${siteDir}/${site}_image.jpg`, createImageFile(subjectID, `Heart-${site}`));

        // Site-specific run data
        createFile(
          `${siteDir}/run_1.txt`,
          sampleRawData(subjectID, `Heart-${site}`, 1) +
            `\nSite: ${site}\nMeasurement focus: ${
              site === "left-ventricle" ? "Wall thickness" : "Electrical activity"
            }`
        );

        // REPLACE performance directory with analysis results
        createDir(`${siteDir}/analysis_results`);
        createFile(
          `${siteDir}/analysis_results/statistical_summary.txt`,
          createAnalysisResults("Heart", site)
        );
        createFile(`${siteDir}/analysis_results/metabolites.csv`, createMetaboliteData("Heart"));
        createFile(
          `${siteDir}/analysis_results/processing_notes.txt`,
          `Processing completed on ${collectionDate}\nSite-specific analysis focused on ${site}\nAdditional testing required: No`
        );

        // Create site-specific instrument output
        createDir(`${siteDir}/instrument_output`);
        createFile(
          `${siteDir}/instrument_output/site_recording_${siteIndex + 1}.dat`,
          `[Binary instrument data for ${subjectID} ${site} site]`
        );
        createFile(
          `${siteDir}/instrument_output/site_settings.json`,
          `{\n  "site": "${site}",\n  "gain": ${Math.floor(Math.random() * 5) + 1},\n  "filter": "${
            site === "left-ventricle" ? "high-pass" : "band-pass"
          }"\n}`
        );
      });

      // Add MRI performance directories and files for the heart sample
      const mriPerformanceDir = `${sampleDir}/mri_performances`;
      createDir(mriPerformanceDir);

      // Create two distinct MRI performances
      const mriSequences = ["T1-weighted", "T2-weighted"];

      for (let perfNum = 1; perfNum <= 2; perfNum++) {
        const sequenceType = mriSequences[perfNum - 1];
        const perfDir = `${mriPerformanceDir}/performance_${perfNum}`;
        createDir(perfDir);

        // Performance log with MRI-specific details
        createFile(
          `${perfDir}/performance_log.txt`,
          mriPerformanceLog(subjectID, "whole heart", collectionDate, sequenceType, perfNum)
        );

        // MRI data files
        createFile(`${perfDir}/acquisition_data.csv`, mriAcquisitionData(sequenceType));
        createFile(
          `${perfDir}/mri_parameters.json`,
          `{\n  "sequence": "${sequenceType}",\n  "tesla": 3,\n  "repetitionTime": ${
            Math.floor(Math.random() * 500) + 800
          },\n  "echoTime": ${Math.floor(Math.random() * 30) + 20},\n  "flipAngle": ${
            Math.floor(Math.random() * 30) + 60
          },\n  "numberOfSlices": ${Math.floor(Math.random() * 20) + 20}\n}`
        );

        // Simulated DICOM directory with sample files
        createDir(`${perfDir}/dicom`);
        for (let i = 1; i <= 5; i++) {
          createFile(
            `${perfDir}/dicom/slice_${i.toString().padStart(3, "0")}.dcm`,
            `[DICOM data for ${sequenceType} slice ${i}]`
          );
        }

        // Create a reconstructed image file
        createFile(
          `${perfDir}/${sequenceType.toLowerCase().replace("-", "_")}_reconstruction.nii`,
          `[NIFTI format MRI reconstruction data]`
        );
      }
    }

    // REPLACE performance data in blood samples with other types of data
    if (sampleType === "blood") {
      // Create biochemistry results directory instead of performance
      createDir(`${sampleDir}/biochemistry_results`);
      createFile(
        `${sampleDir}/biochemistry_results/complete_blood_count.csv`,
        `Parameter,Value,Unit,Reference Range\n` +
          `WBC,${(Math.random() * 5 + 5).toFixed(2)},10^9/L,4.5-11.0\n` +
          `RBC,${(Math.random() * 2 + 4).toFixed(2)},10^12/L,4.5-6.5\n` +
          `Hemoglobin,${(Math.random() * 2 + 13).toFixed(1)},g/dL,13.0-17.0\n` +
          `Hematocrit,${(Math.random() * 5 + 40).toFixed(1)},%,40.0-52.0\n` +
          `Platelets,${Math.floor(Math.random() * 100 + 150)},10^9/L,150-450\n`
      );

      createFile(
        `${sampleDir}/biochemistry_results/chemistry_panel.csv`,
        `Parameter,Value,Unit,Reference Range\n` +
          `Glucose,${(Math.random() * 30 + 70).toFixed(1)},mg/dL,70-99\n` +
          `Sodium,${Math.floor(Math.random() * 8 + 135)},mmol/L,135-145\n` +
          `Potassium,${(Math.random() * 1.5 + 3.5).toFixed(1)},mmol/L,3.5-5.0\n` +
          `Chloride,${Math.floor(Math.random() * 10 + 98)},mmol/L,98-107\n` +
          `Creatinine,${(Math.random() * 0.5 + 0.7).toFixed(2)},mg/dL,0.6-1.2\n`
      );

      createFile(
        `${sampleDir}/biochemistry_results/analysis_notes.txt`,
        `Analysis performed by: Lab Technician J. Doe\nDate: ${collectionDate}\nSample quality: Excellent\nHemolysis: None\nLipemia: None\nAdditional notes: All values within normal reference ranges.`
      );

      // Add instrument output data
      createDir(`${sampleDir}/instrument_output`);
      createFile(
        `${sampleDir}/instrument_output/raw_data_${collectionDate.replace(/-/g, "")}.dat`,
        `[Binary instrument data would be here for ${subjectID} ${sampleType}]`
      );
      createFile(
        `${sampleDir}/instrument_output/session_log.txt`,
        `Session started: 9:15 AM\nSession ended: 10:32 AM\nInstrument: ${
          sampleType === "heart" ? "CardioAnalyzer 5000" : "BloodLab Pro 3000"
        }\nOperator: J. Smith`
      );
    }
  });
}

console.log(
  "Lab dataset structure created successfully with 2 subjects, each with blood samples and heart samples with two anatomical sites (left ventricle and right ventricle)!"
);
