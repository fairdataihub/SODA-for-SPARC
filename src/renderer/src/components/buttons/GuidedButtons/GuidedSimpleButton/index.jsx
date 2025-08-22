/**
 * GuidedSimpleButton component for simple UI buttons (Yes/No)
 *
 * @param {Object} props Component props
 * @param {string} props.id Button ID
 * @param {string} props.nextElementId ID of the element to show next
 * @param {string} props.buttonText Button text content
 * @param {string} props.configValue Configuration value
 * @param {string} props.configValueState State value (e.g., "yes", "no")
 * @param {string} props.buttonType Button type/style (e.g., "positive", "negative", default is "")
 */

const GuidedSimpleButton = ({
  id,
  nextElementId,
  buttonText,
  configValue,
  configValueState,
  buttonType = "",
}) => {
  const buttonClass = `ui ${buttonType} basic button guided--radio-button`;

  return (
    <button
      className={buttonClass}
      id={id}
      data-next-element={nextElementId}
      data-button-config-value={configValue}
      data-button-config-value-state={configValueState}
    >
      {buttonText}
    </button>
  );
};

export default GuidedSimpleButton;
