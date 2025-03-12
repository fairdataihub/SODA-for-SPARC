# R script for plotting
library(ggplot2)

data <- read.csv('../subjects/subject_001/blood/blood_data.csv')
ggplot(data, aes(x=time, y=value)) + geom_point() + theme_minimal()