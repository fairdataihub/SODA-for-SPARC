

// const Jimp = require("jimp");
// const { Notyf } = require("notyf");


import './assets/imports'
import './assets/demo-btns'
import './assets/nav'
import './scripts/guided-mode/guided-curate-dataset'
// import './scripts/others/renderer'


// Application Lotties
import './assets/lotties/activate-lotties'

// Application CSS 
import './assets/css/animations.css'
import './assets/css/buttons.css'
import './assets/css/containers.css'
import './assets/css/demo.css'
import './assets/css/doc_contact_pages.css'
import './assets/css/file_views.css'
import './assets/css/folder_files.css'
import './assets/css/fontawesome.css'
import './assets/css/fontStyling.css'
import './assets/css/global.css'
import './assets/css/guided.css'
import './assets/css/helperClasses.css'
import './assets/css/individualtab.css'
import './assets/css/main_tabs.css'
import './assets/css/main.css'
import './assets/css/nativize.css'
import './assets/css/nav.css'
import './assets/css/overview_page.css'
import './assets/css/section.css'
import './assets/css/splashScreen.css'
import './assets/css/spreadSheetTools.css'
import './assets/css/spur.css'
import './assets/css/tablepath.css'
import './assets/css/variables.css'

import axios from "axios"


let port = 4242;
let client = axios.create({
    baseURL: `http://127.0.0.1:${port}`,
    timeout: 300000,
});



// wait for 3 seconds
setTimeout(() => {
    console.log("Waiting for 3 seconds");

    client.get("/startup/echo?arg=server ready").then((response) => {
        console.log(response.data);
    })
        .catch((error) => {
            console.log(error);
        });

}, 3000);







