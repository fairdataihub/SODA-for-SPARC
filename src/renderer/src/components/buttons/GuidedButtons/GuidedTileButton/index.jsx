import { IconMoodAngry } from "@tabler/icons-react";

/**
 * GuidedTileButton component for tile-style buttons with icon and heading
 *
 * @param {Object} props Component props
 * @param {string} props.id Button ID
 * @param {string} props.nextElementId ID of the element to show next
 * @param {string} props.buttonText Heading text to display
 * @param {React.ReactNode} props.icon Icon component or SVG to display
 */

const GuidedTileButton = ({ id, nextElementId, buttonText, icon }) => {
  // Default icon if none provided
  const defaultIcon = <IconMoodAngry size={50} color="var(--color-soda-green)" />;

  return (
    <button className="guided--radio-button tile-button" id={id} data-next-element={nextElementId}>
      <div className="tile-button-icon">{icon || defaultIcon}</div>
      <div className="tile-button-text">
        <h2>{buttonText}</h2>
      </div>
    </button>
  );
};

export default GuidedTileButton;
