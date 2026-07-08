/**
 * Page Configuration
 * Centralized configuration for page types and their behaviors
 */

// Page configurations with their types and metadata
export const PAGE_CONFIG = {
  // Review Pages - Use standardized dataset structure
  "review-pages": new Set([
    "guided-dataset-structure-and-manifest-review-tab",
    "guided-generate-dataset-locally",
    "guided-dataset-generation-confirmation-tab",
    "guided-dataset-structure-review-tab",
  ]),

  // Categorization Pages - Use raw structure with data filtering
  "data-categorization": new Set([
    "data-categorization-page",
    "data-categories-questionnaire-page",
  ]),

  // Unstructured Import Pages
  "unstructured-import": new Set(["guided-unstructured-data-import-tab"]),

  // FFM Unstructured Import - Use raw structure with root path
  "ffm-import": new Set(["ffm-unstructured-data-import-tab"]),
};
