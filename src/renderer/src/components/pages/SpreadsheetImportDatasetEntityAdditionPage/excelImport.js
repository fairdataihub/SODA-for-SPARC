import * as XLSX from "xlsx";
import { addSubject, addSampleToSubject } from "../../../stores/slices/datasetEntityStructureSlice";

/**
 * Read an Excel file and return the data as JSON
 * @param {File} file - The Excel file to read
 * @returns {Promise<Array>} The data from the first sheet as an array of objects
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Import subject data from an Excel file and create subject entities
 * @param {File} file - The Excel file containing subject data
 * @returns {Promise<{success: boolean, message: string, imported: number}>} Result of the import
 */
export const importSubjectsFromExcel = async (file) => {
  try {
    const subjects = await readExcelFile(file);
    console.log("Subjects data:", subjects); // Debugging line to check the data structure
    if (!subjects || subjects.length === 0) {
      return { success: false, message: "No subject data found in the file", imported: 0 };
    }

    // Validate required fields
    const missingIdSubjects = subjects.filter((subject) => !subject["subject id"]);
    if (missingIdSubjects.length > 0) {
      return {
        success: false,
        message: `${missingIdSubjects.length} subjects are missing IDs`,
        imported: 0,
      };
    }

    // Import subjects
    let importedCount = 0;
    let errors = [];

    for (const subject of subjects) {
      try {
        // Add prefix if missing
        let subjectId = subject["subject id"];
        if (!subjectId.startsWith("sub-")) {
          subjectId = `sub-${subjectId}`;
        }

        // Create a metadata object with all fields
        const metadata = { ...subject };
        metadata["subject id"] = subjectId;

        // Add subject
        addSubject(subjectId, metadata);
        importedCount++;
      } catch (error) {
        errors.push(`Failed to import subject ${subject["subject id"]}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error("Errors during subject import:", errors);
      return {
        success: importedCount > 0,
        message: `Imported ${importedCount} subjects with ${errors.length} errors`,
        imported: importedCount,
        errors,
      };
    }

    return {
      success: true,
      message: `Successfully imported ${importedCount} subjects`,
      imported: importedCount,
    };
  } catch (error) {
    console.error("Failed to import subjects:", error);
    return { success: false, message: `Failed to import subjects: ${error.message}`, imported: 0 };
  }
};

/**
 * Import sample data from an Excel file and create sample entities
 * @param {File} file - The Excel file containing sample data
 * @returns {Promise<{success: boolean, message: string, imported: number}>} Result of the import
 */
export const importSamplesFromExcel = async (file) => {
  try {
    const samples = await readExcelFile(file);
    if (!samples || samples.length === 0) {
      return { success: false, message: "No sample data found in the file", imported: 0 };
    }

    // Validate required fields
    const missingSamples = samples.filter(
      (sample) => !sample["sample id"] || !sample["subject id"]
    );
    if (missingSamples.length > 0) {
      return {
        success: false,
        message: `${missingSamples.length} samples are missing required fields (sample id or subject id)`,
        imported: 0,
      };
    }

    // Import samples
    let importedCount = 0;
    let errors = [];

    for (const sample of samples) {
      try {
        // Add prefix if missing to both sample and subject IDs
        let sampleId = sample["sample id"];
        if (!sampleId.startsWith("sam-")) {
          sampleId = `sam-${sampleId}`;
        }

        let subjectId = sample["subject id"];
        if (!subjectId.startsWith("sub-")) {
          subjectId = `sub-${subjectId}`;
        }

        // Create a metadata object with all fields
        const metadata = { ...sample };
        metadata["sample id"] = sampleId;

        // Add sample to subject
        addSampleToSubject(subjectId, sampleId, metadata);
        importedCount++;
      } catch (error) {
        errors.push(`Failed to import sample ${sample["sample id"]}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error("Errors during sample import:", errors);
      return {
        success: importedCount > 0,
        message: `Imported ${importedCount} samples with ${errors.length} errors`,
        imported: importedCount,
        errors,
      };
    }

    return {
      success: true,
      message: `Successfully imported ${importedCount} samples`,
      imported: importedCount,
    };
  } catch (error) {
    console.error("Failed to import samples:", error);
    return { success: false, message: `Failed to import samples: ${error.message}`, imported: 0 };
  }
};
