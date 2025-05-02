#!/usr/bin/env python3

import pandas as pd
import matplotlib.pyplot as plt

# Load data
data = pd.read_csv('../subjects/sub-001/blood/blood_data.csv')

# Basic analysis
mean_value = data['Value'].mean()
std_value = data['Value'].std()

print(f"Mean: {mean_value}, Std Dev: {std_value}")

# Create plot
plt.figure()
plt.scatter(data['Time'], data['Value'])
plt.xlabel('Time')
plt.ylabel('Value')
plt.title('Sample Analysis')
plt.savefig('analysis_plot.png')
