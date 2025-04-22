const GuidedRadioButton = () => {
  return (
    <button
      className="guided--radio-button tile-button"
      id="guided-button-start-new-curations"
      data-next-element="guided-section-start-new-curation"
    >
      <div class="tile-button-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="var(--color-light-green)"
          width="50px"
          height="50px"
          viewBox="0 0 32 32"
          version="1.1"
          stroke="var(--color-light-green)"
          stroke-width="0.1"
        >
          <g stroke-linecap="round" stroke-linejoin="round" />

          <g>
            <title>plus-frame</title>
            <path d="M0 26.016q0 2.496 1.76 4.224t4.256 1.76h20q2.464 0 4.224-1.76t1.76-4.224v-20q0-2.496-1.76-4.256t-4.224-1.76h-20q-2.496 0-4.256 1.76t-1.76 4.256v20zM4 26.016v-20q0-0.832 0.576-1.408t1.44-0.608h20q0.8 0 1.408 0.608t0.576 1.408v20q0 0.832-0.576 1.408t-1.408 0.576h-20q-0.832 0-1.44-0.576t-0.576-1.408zM8 16q0 0.832 0.576 1.44t1.44 0.576h4v4q0 0.832 0.576 1.408t1.408 0.576 1.408-0.576 0.608-1.408v-4h4q0.8 0 1.408-0.576t0.576-1.44-0.576-1.408-1.408-0.576h-4v-4q0-0.832-0.608-1.408t-1.408-0.608-1.408 0.608-0.576 1.408v4h-4q-0.832 0-1.44 0.576t-0.576 1.408z" />
          </g>
        </svg>
      </div>
      <div class="tile-button-text">
        <h2>Prepare and submit a new dataset</h2>
      </div>
    </button>
  );
};

export default GuidedRadioButton;
