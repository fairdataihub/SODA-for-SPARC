// require("./header.css")

const SodaHeader = ({headerText, needHelpLink }) => {
    const header = document.createElement("header");
    header.className = "section-header"

    const headerContent = `
                        <div class="wrapper">
                            <div class="sub-wrapper">
                                <div class="need-help-div">
                                    <h2>${headerText}</h2>
                                    <a
                                    target="_blank"
                                    href=${needHelpLink}
                                    >Need help?</a
                                    >
                                </div>
                            </div>
                        </div>
                `;

    header.insertAdjacentHTML("beforeend", headerContent);

    return header;
};


module.exports = { SodaHeader };
