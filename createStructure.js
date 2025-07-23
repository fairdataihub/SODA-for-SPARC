const fs = require("fs");
const path = require("path");

const rootDir = "SDS3-Dataset";

// Configuration variables - adjust these to scale the dataset
const numSubjects = 2; // Number of subjects to create
const samplesPerSubject = 6; // Number of tissue samples per subject
const regionsPerSample = 2; // Number of regions per sample

// Delete directory recursively if it exists
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive case: it's a folder
        deleteFolderRecursive(curPath);
      } else {
        // Base case: it's a file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
    console.log(`Deleted existing directory: ${folderPath}`);
  }
}

// Clean up existing dataset folder if it exists
if (fs.existsSync(rootDir)) {
  console.log(`Found existing ${rootDir} directory. Deleting...`);
  deleteFolderRecursive(rootDir);
}

// Sample realistic file contents for typical lab data
const sampleRawData = (id, type, runNum) => {
  const block =
    `# Raw ${type} data - Run ${runNum}\n` +
    `Sample ID: ${id}\n` +
    `Date: ${new Date().toLocaleDateString()}\n` +
    `Values: ${Array.from({ length: 100 }, () => (Math.random() * 50 + 10).toFixed(2)).join(
      ", "
    )}\n` +
    `Notes: Standard collection protocol followed\n`;
  const repeat = Math.ceil((0.25 * 1024 * 1024) / block.length);
  return block.repeat(repeat).slice(0, 0.25 * 1024 * 1024);
};

const sampleExcelData = (id, type) => {
  let header = `Subject,Measurement Type,Value 1,Value 2,Value 3\n`;
  let row = `${id},${type},${(Math.random() * 50 + 10).toFixed(2)},${(
    Math.random() * 50 +
    10
  ).toFixed(2)},${(Math.random() * 50 + 10).toFixed(2)}\n`;
  const repeat = Math.ceil((0.25 * 1024 * 1024) / row.length);
  let content = header + row.repeat(repeat);
  return content.slice(0, 0.25 * 1024 * 1024);
};

const labNotes = (id, sampleType, date) => {
  const block =
    `Lab Notes - ${sampleType} Sample\n` +
    `Subject: ${id}\n` +
    `Sample: ${sampleType}\n` +
    `Date: ${date}\n` +
    `Collected by: J. Smith\n\n` +
    `Processing Notes:\n` +
    `- Sample processed according to protocol\n` +
    `- Stored at -80°C (Freezer #2)\n` +
    `- Quality check: Passed\n\n` +
    `Observations: Sample appears normal with no visible contamination\n`;
  const repeat = Math.ceil((0.25 * 1024 * 1024) / block.length);
  return block.repeat(repeat).slice(0, 0.25 * 1024 * 1024);
};

// Site-specific notes
const siteNotes = (subjectId, sampleId, siteId, date) => {
  const block =
    `Site: ${siteId}\n` +
    `Subject: ${subjectId}\n` +
    `Sample: ${sampleId}\n` +
    `Date: ${date}\n` +
    `Researcher: Dr. M. Researcher\n\n` +
    `Site-specific Notes:\n` +
    `- Measurements taken according to SOP-${siteId.slice(-3)}\n` +
    `- Site appears healthy and normal\n` +
    `- Processing completed successfully\n`;
  const repeat = Math.ceil((0.25 * 1024 * 1024) / block.length);
  return block.repeat(repeat).slice(0, 0.25 * 1024 * 1024);
};

// Site metadata file content
const siteMetadata = (subjectId, sampleId, siteId) => {
  const block =
    `Site ID: ${siteId}\n` +
    `Related Subject: ${subjectId}\n` +
    `Related Sample: ${sampleId}\n` +
    `Collection Date: ${new Date().toLocaleDateString()}\n` +
    `Anatomical Location: ${siteId}\n` +
    `Coordinates: X:${Math.floor(Math.random() * 50)}, Y:${Math.floor(
      Math.random() * 50
    )}, Z:${Math.floor(Math.random() * 50)}\n`;
  const repeat = Math.ceil((0.25 * 1024 * 1024) / block.length);
  return block.repeat(repeat).slice(0, 0.25 * 1024 * 1024);
};

// Site measurements data
const siteMeasurementData = (siteId) => {
  let header = `Time,Position,Measurement,Value\n`;
  let row =
    `1,${siteId},Temperature,${(Math.random() * 5 + 35).toFixed(2)} °C\n` +
    `2,${siteId},pH,${(Math.random() * 1 + 7).toFixed(2)}\n` +
    `3,${siteId},Pressure,${(Math.random() * 40 + 80).toFixed(2)} mmHg\n` +
    `4,${siteId},Flow Rate,${(Math.random() * 100 + 50).toFixed(2)} ml/min\n`;
  const repeat = Math.ceil((0.25 * 1024 * 1024) / row.length);
  let content = header + row.repeat(repeat);
  return content.slice(0, 0.25 * 1024 * 1024);
};

// Generate the project readme dynamically based on configuration
const projectReadme =
  `# Sample Experimental Dataset\n\n` +
  `This directory contains research data organized as follows:\n\n` +
  `- ${numSubjects} subjects (Subject01${
    numSubjects > 1 ? ` through Subject${numSubjects.toString().padStart(2, "0")}` : ""
  })\n` +
  `- Each subject has ${samplesPerSubject} tissue samples\n` +
  `- Each sample has ${regionsPerSample} regions of interest (RegionA${
    regionsPerSample > 1 ? ", RegionB" : ""
  }${regionsPerSample > 2 ? ", etc." : ""})\n\n` +
  `This dataset is designed for testing folder/file annotation workflows in SODA for SPARC.`;

// Additional content generators for code and protocols folders
const pythonAnalysisScript = `#!/usr/bin/env python3
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def load_data(subject_id, sample_id, site_id):
    """Load data for a specific site"""
    filepath = f"../experiment/{subject_id}/{sample_id}/{site_id}/measurements.csv"
    return pd.read_csv(filepath)

def analyze_site_data(df):
    """Perform basic analysis on site data"""
    results = {
        'mean_temp': df[df['Measurement'] == 'Temperature']['Value'].mean(),
        'mean_pressure': df[df['Measurement'] == 'Pressure']['Value'].mean(),
        'mean_flow': df[df['Measurement'] == 'Flow Rate']['Value'].mean()
    }
    return results

if __name__ == "__main__":
    # Dynamic subject handling - adapts to however many subjects exist
    import os
    experiment_dir = "../experiment"
    subjects = [d for d in os.listdir(experiment_dir) if d.startswith("Subject")]
    results = {}
    
    for subject in sorted(subjects):
        results[subject] = {}
        subject_path = os.path.join(experiment_dir, subject)
        
        # Find all tissue samples for this subject
        samples = [d for d in os.listdir(subject_path) if d.startswith("Tissue")]
        
        for sample_id in sorted(samples):
            results[subject][sample_id] = {}
            sample_path = os.path.join(subject_path, sample_id)
            
            # Find all regions for this sample
            regions = [d for d in os.listdir(sample_path) if d.startswith("Region")]
            
            for site_id in sorted(regions):
                try:
                    df = load_data(subject, sample_id, site_id)
                    results[subject][sample_id][site_id] = analyze_site_data(df)
                    print(f"Analyzed {subject}/{sample_id}/{site_id}")
                except Exception as e:
                    print(f"Error processing {subject}/{sample_id}/{site_id}: {e}")
    
    # Display results
    for subject, samples in results.items():
        print(f"\\nResults for {subject}:")
        for sample, sites in samples.items():
            print(f"  {sample}:")
            for site, metrics in sites.items():
                print(f"    {site}: {metrics}")
`;

const rPlottingScript = `# R script for plotting dataset results
library(ggplot2)
library(dplyr)

# Function to read all measurement data
read_all_measurements <- function() {
  all_data <- data.frame()
  
  # Get all subjects from the experiment directory
  experiment_dir <- "../experiment"
  subjects <- list.dirs(experiment_dir, full.names = FALSE, recursive = FALSE)
  subjects <- subjects[grep("^Subject", subjects)]
  
  for (subject in subjects) {
    subject_path <- file.path(experiment_dir, subject)
    
    # Get all tissue samples for this subject
    samples <- list.dirs(subject_path, full.names = FALSE, recursive = FALSE)
    samples <- samples[grep("^Tissue", samples)]
    
    for (sample_id in samples) {
      sample_path <- file.path(subject_path, sample_id)
      
      # Get all regions for this sample
      regions <- list.dirs(sample_path, full.names = FALSE, recursive = FALSE)
      regions <- regions[grep("^Region", regions)]
      
      for (site_id in regions) {
        file_path <- file.path(sample_path, site_id, "measurements.csv")
        
        tryCatch({
          data <- read.csv(file_path)
          data$Subject <- subject
          data$Sample <- sample_id
          data$Site <- site_id
          all_data <- rbind(all_data, data)
        }, error = function(e) {
          message(paste0("Error reading ", file_path, ": ", e$message))
        })
      }
    }
  }
  
  return(all_data)
}

# Main analysis
main <- function() {
  data <- read_all_measurements()
  
  # Generate summary statistics
  summary_stats <- data %>%
    group_by(Subject, Sample, Site, Measurement) %>%
    summarize(
      Mean = mean(Value, na.rm = TRUE),
      SD = sd(Value, na.rm = TRUE),
      .groups = 'drop'
    )
  
  # Print summary
  print("Summary statistics by measurement:")
  print(summary_stats)
  
  # Create plot example
  temp_data <- data[data$Measurement == "Temperature", ]
  
  # This would create a plot if run in R
  plot <- ggplot(temp_data, aes(x = Site, y = Value, fill = Subject)) +
    geom_bar(stat = "identity", position = "dodge") +
    labs(title = "Temperature Measurements by Site",
         y = "Temperature (°C)",
         x = "Site") +
    theme_minimal()
  
  # Save plot - not actually saving in this example
  print("Plot would be saved as '../results/temperature_by_site.png'")
}

# Run main analysis
main()
`;

const pythonDataPreprocessing = `#!/usr/bin/env python3
# Data preprocessing utilities for dataset

import pandas as pd
import numpy as np
import os

def normalize_measurements(df):
    """Normalize measurements to z-scores within each measurement type"""
    result = df.copy()
    for measurement_type in df['Measurement'].unique():
        mask = df['Measurement'] == measurement_type
        values = df.loc[mask, 'Value']
        result.loc[mask, 'Value_normalized'] = (values - values.mean()) / values.std()
    return result

def detect_outliers(df, threshold=2.5):
    """Flag outliers based on z-score threshold"""
    if 'Value_normalized' not in df.columns:
        df = normalize_measurements(df)
    
    df['is_outlier'] = abs(df['Value_normalized']) > threshold
    return df

def preprocess_all_sites():
    """Preprocess data for all sites in the dataset"""
    data_dir = "../experiment"
    # Dynamically process all subjects that exist
    for subject_dir in os.listdir(data_dir):
        if not subject_dir.startswith("Subject"):
            continue
        
        subject_path = os.path.join(data_dir, subject_dir)
        # Process all tissue samples
        for sample_dir in os.listdir(subject_path):
            if not sample_dir.startswith("Tissue"):
                continue
                
            sample_path = os.path.join(subject_path, sample_dir)
            # Process all regions
            for site_dir in os.listdir(sample_path):
                if not site_dir.startswith("Region"):
                    continue
                
                site_path = os.path.join(sample_path, site_dir)
                measurements_file = os.path.join(site_path, "measurements.csv")
                
                if os.path.exists(measurements_file):
                    try:
                        print(f"Processing {measurements_file}")
                        df = pd.read_csv(measurements_file)
                        processed = detect_outliers(normalize_measurements(df))
                        
                        # Save to a new file in the results directory
                        results_dir = os.path.join(site_path, "results")
                        os.makedirs(results_dir, exist_ok=True)
                        processed.to_csv(os.path.join(results_dir, "preprocessed_data.csv"), index=False)
                    except Exception as e:
                        print(f"Error processing {measurements_file}: {e}")

if __name__ == "__main__":
    print("Running data preprocessing...")
    preprocess_all_sites()
    print("Preprocessing complete!")
`;

const sampleCollectionProtocol = `# Sample Collection Protocol

## Overview
This protocol describes the standard procedure for collecting samples from subjects in the SDS3 test dataset.

## Materials
- Sterile collection containers
- Personal protective equipment (PPE)
- Labels and markers
- Data collection forms
- Storage containers

## Procedure
1. Ensure subject has provided informed consent
2. Prepare all materials and label containers with subject ID
3. Follow sample-specific collection procedures:
   - For sample type A: [specific instructions]
   - For sample type B: [specific instructions]
4. Document collection time, conditions, and any deviations from protocol
5. Transfer samples to appropriate storage within 30 minutes of collection

## Quality Control
- Verify all samples are correctly labeled
- Ensure all required documentation is complete
- Store samples at -80°C unless otherwise specified

## References
1. Standard Operating Procedure #SOP-2023-001
2. Quality Assurance Manual v2.5
`;

const siteAnalysisProtocol = `# Site Measurement Protocol

## Purpose
This document describes the standardized procedures for taking measurements at specific anatomical sites.

## Equipment Required
- Calibrated measurement tools
- Recording software v3.2
- Site localization guides

## Site Measurement Procedure
1. Identify the anatomical site using reference landmarks
2. Position measurement equipment according to the site-specific guide
3. Take three consecutive measurements with a 30-second interval
4. Record all values and calculate the average
5. Document any difficulties or deviations from protocol

## Data Recording
- All measurements must be recorded in the standard format
- Include site ID, subject ID, and measurement conditions
- Save raw data files using the naming convention: [site-ID]_[measurement-type]_[date]

## Quality Assurance
- Equipment must be calibrated at the beginning of each session
- Standard reference measurements should be taken daily
- Any measurement deviating more than 10% from expected values should be repeated
`;

// Function to create directories
function createDir(dirPath) {
  // Add '(' to every folder name segment if not present
  const newDirPath = dirPath
    .split(/[\\/]/)
    .map((part) => (part.includes("(") ? part : part + "("))
    .join(path.sep);
  if (!fs.existsSync(newDirPath)) {
    fs.mkdirSync(newDirPath, { recursive: true });
  }
}

// Function to create a file with content
function createFile(filePath, content) {
  // Add '(' to every file and folder segment if not present
  const parts = filePath.split(/[\\/]/);
  const newParts = parts.map((part) => (part.includes("(") ? part : part + "("));
  const newFilePath = path.join(...newParts);
  // If the file is .txt, .csv, .md, or .xlsx, and content is not already large, pad it to ~5MB
  const ext = path.extname(filePath).toLowerCase();
  let paddedContent = content;
  if (
    [".txt", ".csv", ".md", ".xlsx"].includes(ext) &&
    Buffer.byteLength(content, "utf8") < 0.25 * 1024 * 1024
  ) {
    // Pad with newlines to reach 5MB
    const padSize = 0.25 * 1024 * 1024 - Buffer.byteLength(content, "utf8");
    paddedContent = content + "\n".repeat(Math.ceil(padSize / 2));
  }
  fs.writeFileSync(newFilePath, paddedContent);
}

console.log(`Creating new ${rootDir} directory...`);

// Create SDS3 dataset structure
createDir(rootDir);

// Project-level files
createFile(`${rootDir}/README.md`, projectReadme);

// Generate more collection dates if needed based on the number of subjects
const collectionDates = [];
const baseDate = new Date("2023-06-01");
for (let i = 0; i < numSubjects; i++) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + i * 15); // add 15 days for each subject
  collectionDates.push(date.toISOString().split("T")[0]); // format as YYYY-MM-DD
}

// Generate dataset description content
let datasetDescriptionContent = "Subject ID,Sample ID,Region,Collection Date\n";

// Generate data structure for each subject
for (let i = 1; i <= numSubjects; i++) {
  const subjectID = `Subject${i.toString().padStart(2, "0")}`;
  const collectionDate = collectionDates[i - 1];

  // Create subject directory directly in rootDir
  createDir(`${rootDir}/${subjectID}`);

  // Subject overview file
  createFile(
    `${rootDir}/${subjectID}/subject_info.txt`,
    `Subject ID: ${subjectID}\nCollection Date: ${collectionDate}\nExperimenter: J. Smith\nProject: Experiment-2023`
  );

  // Create tissue samples for each subject
  for (let j = 1; j <= samplesPerSubject; j++) {
    // Calculate sample number for sequential tissue numbering across subjects
    const sampleNum = (i - 1) * samplesPerSubject + j;
    const sampleID = `Tissue${sampleNum.toString().padStart(2, "0")}`;
    const sampleDir = `${rootDir}/${subjectID}/${sampleID}`;

    // Create sample directory
    createDir(sampleDir);

    // Create sample files
    createFile(`${sampleDir}/${sampleID}_data.csv`, sampleExcelData(subjectID, sampleID));
    createFile(`${sampleDir}/lab_notes.txt`, labNotes(subjectID, sampleID, collectionDate));
    createFile(`${sampleDir}/run_1.txt`, sampleRawData(subjectID, sampleID, 1));
    createFile(`${sampleDir}/run_2.txt`, sampleRawData(subjectID, sampleID, 2));

    // Create regions for each sample
    for (let k = 0; k < regionsPerSample; k++) {
      const region = String.fromCharCode(65 + k); // A, B, C, etc.
      const siteID = `Region${region}`;
      const siteDir = `${sampleDir}/${siteID}`;

      // Add to dataset description
      datasetDescriptionContent += `${subjectID},${sampleID},${siteID},${collectionDate}\n`;

      // Create site directory
      createDir(siteDir);

      // Create site-specific files
      createFile(`${siteDir}/metadata.txt`, siteMetadata(subjectID, sampleID, siteID));
      createFile(
        `${siteDir}/site_notes.txt`,
        siteNotes(subjectID, sampleID, siteID, collectionDate)
      );
      createFile(`${siteDir}/measurements.csv`, siteMeasurementData(siteID));
      createFile(`${siteDir}/run_1.txt`, sampleRawData(subjectID, siteID, 1));

      // Create some additional data files for testing
      createFile(`${siteDir}/image_data.jpg`, `[This would be an image file for ${siteID}]`);

      // Create a results directory with some files
      createDir(`${siteDir}/results`);
      createFile(
        `${siteDir}/results/analysis_output.csv`,
        `Parameter,Value,Unit\n` +
          `Temperature,${(Math.random() * 5 + 35).toFixed(2)},°C\n` +
          `pH,${(Math.random() * 1 + 7).toFixed(2)},pH\n` +
          `Volume,${(Math.random() * 5 + 1).toFixed(2)},mL\n`
      );
      createFile(
        `${siteDir}/results/notes.txt`,
        `Analysis performed: ${new Date().toLocaleDateString()}\n` +
          `Analyst: J. Researcher\n` +
          `Results: Normal parameters detected\n` +
          `Quality check: Passed`
      );
    }
  }
}

// Update the dataset description with all entries
createFile(`${rootDir}/dataset_description.xlsx`, datasetDescriptionContent);

// Create scripts directory with analysis scripts and utilities
createDir(`${rootDir}/scripts/analysis_scripts`);
createFile(`${rootDir}/scripts/analysis_scripts/analyze_data.py`, pythonAnalysisScript);
createFile(`${rootDir}/scripts/analysis_scripts/plot_results.R`, rPlottingScript);

createDir(`${rootDir}/scripts/utilities`);
createFile(`${rootDir}/scripts/utilities/data_preprocessing.py`, pythonDataPreprocessing);
createFile(
  `${rootDir}/scripts/utilities/README.md`,
  `# Data Processing Utilities\n\n` +
    `This directory contains utility scripts for processing and analyzing the SDS3 dataset.\n\n` +
    `## Contents\n` +
    `- data_preprocessing.py: Functions for normalizing and preprocessing measurement data\n` +
    `- Add more utilities as needed`
);

// Create protocols directory with documentation
createDir(`${rootDir}/protocols/data_collection`);
createFile(`${rootDir}/protocols/data_collection/sample_collection.md`, sampleCollectionProtocol);
createFile(`${rootDir}/protocols/data_collection/site_measurement.md`, siteAnalysisProtocol);

createDir(`${rootDir}/protocols/data_analysis`);
createFile(
  `${rootDir}/protocols/data_analysis/analysis_workflow.md`,
  `# Data Analysis Workflow\n\n` +
    `This document outlines the standard workflow for analyzing data from the SDS3 dataset.\n\n` +
    `## Prerequisites\n` +
    `- Python 3.7+ with pandas, numpy, and matplotlib\n` +
    `- R 4.0+ with tidyverse packages\n\n` +
    `## Analysis Steps\n` +
    `1. Data preprocessing (see utilities/data_preprocessing.py)\n` +
    `2. Quality control checks\n` +
    `3. Statistical analysis (see analysis_scripts/analyze_data.py)\n` +
    `4. Visualization (see analysis_scripts/plot_results.R)\n` +
    `5. Results interpretation\n\n` +
    `## Output Files\n` +
    `All analysis results should be stored in the corresponding site's results directory.`
);
createFile(
  `${rootDir}/protocols/data_analysis/quality_control.md`,
  `# Quality Control Procedures\n\n` +
    `This document describes the quality control procedures for the SDS3 dataset.\n\n` +
    `## Data Validation\n` +
    `- Check for missing values\n` +
    `- Identify outliers (>2.5 SD from mean)\n` +
    `- Verify consistency across measurement types\n\n` +
    `## Common Issues and Solutions\n` +
    `- Sensor drift: Apply calibration correction\n` +
    `- Environmental noise: Use filtering algorithms\n` +
    `- Sampling errors: Document and exclude from analysis\n\n` +
    `## Documentation\n` +
    `All quality control measures should be documented in the results/notes.txt file.`
);

console.log(
  `Experimental dataset structure created successfully with:\n` +
    `- ${numSubjects} subjects\n` +
    `- ${samplesPerSubject} tissue samples per subject (total: ${
      numSubjects * samplesPerSubject
    } tissue samples)\n` +
    `- ${regionsPerSample} regions per sample (total: ${
      numSubjects * samplesPerSubject * regionsPerSample
    } regions)\n` +
    `- Scripts directory with analysis scripts and utilities\n` +
    `- Protocols directory with documentation for data collection and analysis`
);
