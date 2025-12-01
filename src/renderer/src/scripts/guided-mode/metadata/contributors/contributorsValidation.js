// Purpose: Field validation for contributors. Includes regex pattern from sparcur 3.0.0 schemas.py
// Expanded to include additional family name prefixes from Wikipedia family name affixes
// https://en.wikipedia.org/wiki/List_of_family_name_affixes

// Comprehensive family name prefixes
const FAMILY_PREFIXES = [
  // Dutch/Flemish
  "[Vv]an",
  "[Vv]an [Dd]e[rn]?",
  "[Vv]an [Tt]",
  "[Vv]ander",
  "[Vv]on",
  // German/Austrian
  "[Vv]on",
  "[Vv]on [Dd]e[rn]?",
  "[Zz]u",
  "[Zz]ur",
  "[Vv]om",
  // French
  "[Dd]e",
  "[Dd]es",
  "[Dd]u",
  "[Dd]e [Ll]a",
  "[Dd]e [Ll]es",
  "[Dd]e [Ll]os",
  "[Ll]e",
  "[Ll]a",
  "[Ll]es",
  // Spanish/Portuguese
  "[Dd]el",
  "[Dd]e [Ll]os",
  "[Dd]e [Ll]a",
  "[Dd]e [Ll]as",
  "[Dd]a",
  "[Dd]o",
  // Italian
  "[Dd]i",
  "[Dd]ell[ao]",
  "[Dd]ell[ei]",
  "[Dd]ai",
  "[Dd]al",
  "[Dd]alle",
  // Irish/Scottish
  "[Oo]'",
  "[Mm]c",
  "[Mm]ac",
  // Arabic
  "[Aa]l",
  "[Ee]l",
  "[Aa]bd [Aa]l",
  "[Aa]bu",
  "[Ii]bn",
  // Other European
  "[Ff]itz",
  "[Aa]p",
  "[Bb]en",
  "[Bb]ar",
  "[Bb]at",
];

const FAMILY_PREFIX_PATTERN = `((${FAMILY_PREFIXES.join("|")}) )?`;

export const CONTRIBUTORS_REGEX = new RegExp(`^${FAMILY_PREFIX_PATTERN}[^, ]+, [^,]+$`);

// Last name Portion regex
export const CONTRIBUTORS_LAST_NAME_REGEX = new RegExp(`^${FAMILY_PREFIX_PATTERN}[^, ]+$`);

// First name Portion regex
export const CONTRIBUTORS_FIRST_NAME_REGEX = /^[^,]+$/;

// Export the pattern for debugging/testing
export const FAMILY_PREFIX_PATTERN_STRING = FAMILY_PREFIX_PATTERN;

export const affiliationRorIsValid = (ror) => {
  const rorRegex = /^https:\/\/ror\.org\/0[0-9a-z]{6}[0-9]{2}$/;
  return rorRegex.test(ror);
};

export const orcidIsValid = (orcid) => {
  const orcidRegex = /^(?:https:\/\/orcid\.org\/)?000[09]-00[01][0-9]-[0-9]{4}-[0-9]{3}([0-9]|X)$/;
  return orcidRegex.test(orcid);
};
