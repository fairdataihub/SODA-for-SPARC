# R script for plotting dataset results
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
