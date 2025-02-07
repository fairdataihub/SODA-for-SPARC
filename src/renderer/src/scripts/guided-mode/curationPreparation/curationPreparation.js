

// Funding information (SDS3)
// controller 
// Set the funding consortium dropdown to the saved value (deafult is empty string before a user selects a value)
const loadFundingConsortiumPage = () => { 
    const savedFundingConsortium =
    window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"];
    setDropdownState("guided-select-sparc-funding-consortium", savedFundingConsortium);
}