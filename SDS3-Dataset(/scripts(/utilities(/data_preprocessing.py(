#!/usr/bin/env python3
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
