export const isValidRRID = async (rrid) => {
  const rridPattern = /^RRID:\w+_\w+$/;

  if (!rridPattern.test(rrid)) {
    throw new Error("Invalid RRID format");
  }

  try {
    // fetch from `https://scicrunch.org/resolver/${rrid}.json` to see if it exists
    const response = await fetch(`https://scicrunch.org/resolver/${rrid}.json`);
    if (!response.ok) {
      throw new Error("RRID not found");
    }

    return true;
  } catch (error) {
    if (error.message === "RRID not found") {
      throw error;
    }
    throw new Error(`Failed to validate RRID: ${error.message}`);
  }
};

export const analyzeRRID = async (rrid) => {
  // Use the new isValidRRID function that throws errors
  try {
    await isValidRRID(rrid);

    const result = {
      isValid: true,
      data: null,
      error: null,
      strainInfo: null,
    };

    return result;
  } catch (error) {
    const result = {
      isValid: false,
      data: null,
      error: error.message,
      strainInfo: null,
    };

    return result;
  }
};
