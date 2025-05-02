#!/usr/bin/env python3
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
        print(f"\nResults for {subject}:")
        for sample, sites in samples.items():
            print(f"  {sample}:")
            for site, metrics in sites.items():
                print(f"    {site}: {metrics}")
