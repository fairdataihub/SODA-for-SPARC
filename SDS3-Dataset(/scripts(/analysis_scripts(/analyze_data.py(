#!/usr/bin/env python3
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
        print(f"\nResults for {subject}:")
        for sample, sites in samples.items():
            print(f"  {sample}:")
            for site, metrics in sites.items():
                print(f"    {site}: {metrics}")
