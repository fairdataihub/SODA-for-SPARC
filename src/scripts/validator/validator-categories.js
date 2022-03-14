/*
Purpose: The dataset validator categorizes its errors using the below categories. Keeping these as an enum 
         as they are referenced a lot in error parsing and translating code, 
         and limiting mistyping would be very beneficial. I doubt the category names themselves will change, 
         but if so our references will not. 
         plus ça change, plus c'est la même chose
*/

const VALIDATOR_CATEGORIES = {
  ANY_OF: "anyOf",
  PATTERN: "pattern",
  REQUIRED: "required",
  CONTAINS: "contains",
  TYPE: "type",
  MIN_ITEMS: "minItems",
  ADDITIONAL_PROPERTIES: "additionalProperties",
  ENUM: "enum",
};

exports.VALIDATOR_CATEGORIES = VALIDATOR_CATEGORIES;
