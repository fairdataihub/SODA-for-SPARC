const fs = require("fs");
const path = require("path");

const rootDir = "SDS3-Dataset";

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
  `Sample: ${sampleType}\n` +
  `Date: ${date}\n` +
  `Collected by: J. Smith\n\n` +
  `Processing Notes:\n` +
  `- Sample processed according to protocol\n` +
  `- Stored at -80°C (Freezer #2)\n` +
  `- Quality check: Passed\n\n` +
  `Observations: Sample appears normal with no visible contamination`;

// Site-specific notes
const siteNotes = (subjectId, sampleId, siteId, date) =>
  `Site: ${siteId}\n` +
  `Subject: ${subjectId}\n` +
  `Sample: ${sampleId}\n` +
  `Date: ${date}\n` +
  `Researcher: Dr. M. Researcher\n\n` +
  `Site-specific Notes:\n` +
  `- Measurements taken according to SOP-${siteId.slice(-3)}\n` +
  `- Site appears healthy and normal\n` +
  `- Processing completed successfully\n`;

// Site metadata file content
const siteMetadata = (subjectId, sampleId, siteId) =>
  `Site ID: ${siteId}\n` +
  `Related Subject: ${subjectId}\n` +
  `Related Sample: ${sampleId}\n` +
  `Collection Date: ${new Date().toLocaleDateString()}\n` +
  `Anatomical Location: ${siteId}\n` +
  `Coordinates: X:${Math.floor(Math.random() * 50)}, Y:${Math.floor(
    Math.random() * 50
  )}, Z:${Math.floor(Math.random() * 50)}\n`;

// Site measurements data
const siteMeasurementData = (siteId) =>
  `Time,Position,Measurement,Value\n` +
  `1,${siteId},Temperature,${(Math.random() * 5 + 35).toFixed(2)} °C\n` +
  `2,${siteId},pH,${(Math.random() * 1 + 7).toFixed(2)}\n` +
  `3,${siteId},Pressure,${(Math.random() * 40 + 80).toFixed(2)} mmHg\n` +
  `4,${siteId},Flow Rate,${(Math.random() * 100 + 50).toFixed(2)} ml/min\n`;

const projectReadme =
  `# SDS3 Sample Dataset\n\n` +
  `This directory contains research data following SDS3 structure with:\n\n` +
  `- 2 subjects (sub-001, sub-002)\n` +
  `- Each subject has 2 samples (sam-001, sam-002 for sub-001; sam-003, sam-004 for sub-002)\n` +
  `- Each sample has 2 sites (total of 8 sites)\n\n` +
  `This dataset is designed for testing folder/file annotation workflows in SODA for SPARC.`;

// Additional content generators for code and protocols folders
const pythonAnalysisScript = `#!/usr/bin/env python3
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def load_data(subject_id, sample_id, site_id):
    """Load data for a specific site"""
    filepath = f"../data/{subject_id}/{sample_id}/{site_id}/measurements.csv"
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
    # Example usage
    subjects = ['sub-001', 'sub-002']
    results = {}
    
    for subject in subjects:
        results[subject] = {}
        for sample_num in range(1, 3):
            sample_id = f"sam-{(2*(int(subject[-3:]) - 1) + sample_num):03d}"
            results[subject][sample_id] = {}
            
            for site_num in range(1, 3):
                site_id = f"site-{(2*(int(sample_id[-3:]) - 1) + site_num):03d}"
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

const rPlottingScript = `# R script for plotting SDS3 dataset results
library(ggplot2)
library(dplyr)

# Function to read all measurement data
read_all_measurements <- function() {
  all_data <- data.frame()
  
  for (i in 1:2) { # 2 subjects
    subject_id <- sprintf("sub-%03d", i)
    
    for (j in 1:2) { # 2 samples per subject
      sample_num <- 2*(i-1) + j
      sample_id <- sprintf("sam-%03d", sample_num)
      
      for (k in 1:2) { # 2 sites per sample
        site_num <- 2*(sample_num-1) + k
        site_id <- sprintf("site-%03d", site_num)
        
        file_path <- paste0("../data/", subject_id, "/", sample_id, "/", 
                           site_id, "/measurements.csv")
        
        tryCatch({
          data <- read.csv(file_path)
          data$Subject <- subject_id
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
# Data preprocessing utilities for SDS3 dataset

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
    data_dir = "../data"
    for subject_dir in os.listdir(data_dir):
        if not subject_dir.startswith("sub-"):
            continue
        
        subject_path = os.path.join(data_dir, subject_dir)
        for sample_dir in os.listdir(subject_path):
            if not sample_dir.startswith("sam-"):
                continue
                
            sample_path = os.path.join(subject_path, sample_dir)
            for site_dir in os.listdir(sample_path):
                if not site_dir.startswith("site-"):
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
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to create a file with content
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

console.log(`Creating new ${rootDir} directory...`);

// Create SDS3 dataset structure
createDir(rootDir);

// Project-level files
createFile(`${rootDir}/README.md`, projectReadme);
createFile(
  `${rootDir}/dataset_description.xlsx`,
  "Subject ID,Sample ID,Site ID,Collection Date\n" +
    "sub-001,sam-001,site-001,2023-06-15\n" +
    "sub-001,sam-001,site-002,2023-06-15\n" +
    "sub-001,sam-002,site-003,2023-06-15\n" +
    "sub-001,sam-002,site-004,2023-06-15\n" +
    "sub-002,sam-003,site-005,2023-07-10\n" +
    "sub-002,sam-003,site-006,2023-07-10\n" +
    "sub-002,sam-004,site-007,2023-07-10\n" +
    "sub-002,sam-004,site-008,2023-07-10"
);

// Create top-level directories
createDir(`${rootDir}/data`);
createDir(`${rootDir}/code`);
createDir(`${rootDir}/protocols`);

// Collection dates
const collectionDates = ["2023-06-15", "2023-07-10"];

// Generate data for 2 subjects - now in the data folder
for (let i = 1; i <= 2; i++) {
  const subjectID = `sub-${i.toString().padStart(3, "0")}`;
  const collectionDate = collectionDates[i - 1];

  // Create subject directory inside data folder
  createDir(`${rootDir}/data/${subjectID}`);

  // Subject overview file
  createFile(
    `${rootDir}/data/${subjectID}/subject_info.txt`,
    `Subject ID: ${subjectID}\nCollection Date: ${collectionDate}\nExperimenter: J. Smith\nProject: SDS3-TEST-2023`
  );

  // Create 2 samples per subject
  for (let j = 1; j <= 2; j++) {
    // Calculate sample number (1-2 for sub-001, 3-4 for sub-002)
    const sampleNum = (i - 1) * 2 + j;
    const sampleID = `sam-${sampleNum.toString().padStart(3, "0")}`;
    const sampleDir = `${rootDir}/data/${subjectID}/${sampleID}`;

    // Create sample directory
    createDir(sampleDir);

    // Create sample files
    createFile(`${sampleDir}/${sampleID}_data.csv`, sampleExcelData(subjectID, sampleID));
    createFile(`${sampleDir}/lab_notes.txt`, labNotes(subjectID, sampleID, collectionDate));
    createFile(`${sampleDir}/run_1.txt`, sampleRawData(subjectID, sampleID, 1));
    createFile(`${sampleDir}/run_2.txt`, sampleRawData(subjectID, sampleID, 2));

    // Create 2 sites per sample
    for (let k = 1; k <= 2; k++) {
      // Calculate site number (2 sites per sample)
      const siteNum = (sampleNum - 1) * 2 + k;
      const siteID = `site-${siteNum.toString().padStart(3, "0")}`;
      const siteDir = `${sampleDir}/${siteID}`;

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

// Create code directory with analysis scripts and utilities
createDir(`${rootDir}/code/analysis_scripts`);
createFile(`${rootDir}/code/analysis_scripts/analyze_data.py`, pythonAnalysisScript);
createFile(`${rootDir}/code/analysis_scripts/plot_results.R`, rPlottingScript);

createDir(`${rootDir}/code/utilities`);
createFile(`${rootDir}/code/utilities/data_preprocessing.py`, pythonDataPreprocessing);
createFile(
  `${rootDir}/code/utilities/README.md`,
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
  "SDS3 dataset structure created successfully with:\n" +
    "- 2 subjects, each with 2 samples, and each sample with 2 sites (8 sites total)\n" +
    "- Code directory with analysis scripts and utilities\n" +
    "- Protocols directory with documentation for data collection and analysis"
);
