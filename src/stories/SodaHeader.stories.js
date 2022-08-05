const {SodaHeader} = require("./SodaHeader")

export default {
    headerText: "Soda Header",
    parameters: {
        // More on Story layout: https://storybook.js.org/docs/html/configure/story-layout
        layout: "fullscreen",

    }
};

const Template = (args) => SodaHeader(args);

export const story = Template.bind({})

let argumentObject = {
    headerText: "Manage Datasets - Add/edit subtitle",
    needHelpLink: "https://docs.sodaforsparc.io/docs/manage-dataset/add-edit-subtitle"
}

story.args = argumentObject

