export const generateAlertElement = (alertType, warningMessageText) => {
  return `
        <div class="alert alert-${alertType} guided--alert mr-2" role="alert">
          ${warningMessageText}
        </div>
      `;
};
