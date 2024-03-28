import axios from "axios";
import Swal from "sweetalert2";
import lottie from "lottie-web";
import { announcement_laptop } from "../../assets/lotties/announcement-laptop";

// To change what branch the announcements.json is fetched from, enter branch name between "SODA-for-SPARC/" and "/scripts" in the url below
// state will be either "update" or "announcements"
const checkForAnnouncements = async (state) => {
  const url = `https://raw.githubusercontent.com/fairdataihub/SODA-for-SPARC/staging/src/renderer/src/scripts/meta/announcements.json?timestamp=${new Date().getTime()}`;

  const axiosInstance = axios.create({
    baseURL: url,
    timeout: 0,
  });

  try {
    // Retrieve the platform, app version, and request the announcement
    let platform = String(window.os.platform());
    let appVersion = await window.electron.ipcRenderer.invoke("app-version");
    appVersion = String(appVersion);
    let result = await axiosInstance.get();
    let res = result.data;

    // Prepare the platform name for the announcement
    if (platform === "darwin") {
      platform = "Mac";
    } else if (platform === "win32") {
      platform = "Windows";
    } else {
      platform = "Linux";
    }

    if (appVersion in res && state === "announcements") {
      let features = res[appVersion]["announcements"]["features"];
      let bugFixes = res[appVersion]["announcements"]["bug-fixes"];

      let htmlMessageFeatures = ``;

      if (features && features.length > 0) {
        htmlMessageFeatures = `
              <label style="font-weight: 700; font-size: 17px;">Feature Additions:<br></label><ul>
              ${features
                .map((feature) => {
                  return `<li style="margin: .5rem 0 .5rem 0;">${feature}</li>`;
                })
                .join("")}
                </ul>`;
      }

      let htmlMessageBugFixes = ``;

      if (bugFixes && bugFixes.length > 0) {
        htmlMessageBugFixes = `
              <label style="font-weight: 700; font-size: 17px;">Bug Fixes:<br></label><ul>
              ${bugFixes
                .map((bugfix) => {
                  return `<li style="margin: .5rem 0 .5rem 0;">${bugfix}</li>`;
                })
                .join("")}
                </ul>`;
      }
      let htmlMessage = `
          <div style="text-align: justify; overflow-y: auto; max-height: 350px;">
            <div style="margin-bottom: 1rem;">
              ${htmlMessageFeatures}
              ${htmlMessageBugFixes}
            </div>
          </div>
          `;

      await Swal.fire({
        title: `What's new in SODA V${appVersion}`,
        html: htmlMessage,
        icon: "info",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Get Started",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          let swal_alert = document.getElementsByClassName("swal2-popup")[0];
          swal_alert.style.width = "60rem";

          let html_container = document.getElementById("swal2-html-container");
          let html_child = html_container.children[0];
          html_child.style.border = "2px solid #13716d";
          html_child.style.padding = "1rem";
          html_container.style.marginTop = "0";
          // Create lottie animation for the title
          let swal_icon = document.getElementsByClassName("swal2-icon")[0];
          swal_icon.innerHTML = "";
          swal_icon.style.border = "none";
          swal_icon.style.width = "10rem";
          swal_icon.style.height = "9rem";
          swal_icon.style.marginTop = "0";
          swal_icon.style.marginBottom = "0";

          lottie.loadAnimation({
            rendererSettings: {
              preserveAspectRatio: "xMidYMid meet",
            },
            width: 400,
            height: 400,
            container: swal_icon,
            animationData: announcement_laptop,
            renderer: "svg",
            loop: true,
            autoplay: true,
          });
        },
      });
    } else if (state === "update") {
      await Swal.fire({
        title: `SODA for SPARC ${appVersion} is out of date`,
        html: `<p>Please update to the latest version of SODA for SPARC for the best experience.</p>`,
        icon: "info",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Okay",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          let swal_alert = document.getElementsByClassName("swal2-popup")[0];
          swal_alert.style.width = "40rem";
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export default checkForAnnouncements;
