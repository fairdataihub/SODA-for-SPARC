# R script for plotting SDS3 dataset results
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
