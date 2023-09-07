// To change what branch the announcements.json is fetched from, enter branch name between "SODA-for-SPARC/" and "/scripts" in the url below
// state will be either "update" or "announcements"
const checkForAnnouncements = async (state) => {
  const url = `https://raw.githubusercontent.com/fairdataihub/SODA-for-SPARC/staging/scripts/meta/announcements.json?timestamp=${new Date().getTime()}`;

  const axiosInstance = axios.create({
    baseURL: url,
    timeout: 0,
  });

  try {
    // Retrieve the platform, app version, and request the announcement
    let platform = String(os.platform);
    let appVersion = String(app.getVersion());
    let result = await axiosInstance.get();
    let res = result.data;
    console.log("Announcements result: ", res);

    // Prepare the platform name for the announcement
    if (platform === "darwin") {
      platform = "Mac";
    } else if (platform === "win32") {
      platform = "Windows";
    } else {
      platform = "Linux";
    }

    if (appVersion in res && state === "announcements") {
      console.log(res[appVersion]);
      console.log("version match");
      let features = res[appVersion]["announcements"]["features"];
      let bugFixes = res[appVersion]["announcements"]["bug-fixes"];
      let htmlMessage = `
          <div style="text-align: justify; overflow-y: auto; max-height: 350px;">
            <div style="margin-bottom: 1rem;">
              <label style="font-weight: 700; font-size: 17px;">Feature Additions:<br></label>
              ${features
                .map((feature) => {
                  console.log(feature);
                  return `<li style="margin: .5rem 0 .5rem 0;">${feature}</li>`;
                })
                .join("")}

              <label style="font-weight: 700; font-size: 17px;">Bug Fixes:<br></label>
              ${bugFixes
                .map((bugfix) => {
                  return `<li style="margin: .5rem 0 .5rem 0;">${bugfix}</li>`;
                })
                .join("")}
            </div>
          </div>
          `;

      await Swal.fire({
        title: `Welcome to SODA for SPARC ${appVersion} for ${platform}`,
        html: htmlMessage,
        icon: "info",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Okay",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          let swal_alert = document.getElementsByClassName("swal2-popup")[0];
          swal_alert.style.width = "60rem";
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

    // for (var key of Object.keys(res)) {
    //   //app version should latest version to receive announcement
    //   if (appVersion === key) {
    //     if (Object.keys(res[key]).includes(platform)) {
    //       //check for platform
    //       if (res[key][platform]["show"] === true) {
    //         //if platform found then use that object to create announcement
    //         if (state === "announcements") {
    //           await Swal.fire({
    //             title: res[key][platform]["title"],
    //             html: `<p>${res[key][platform]["message"]}</p>`,
    //             icon: res[key][platform]["type"],
    //             heightAuto: false,
    //             backdrop: "rgba(0,0,0, 0.4)",
    //             confirmButtonText: "Okay",
    //             allowOutsideClick: false,
    //             allowEscapeKey: false,
    //             didOpen: () => {
    //               let swal_alert = document.getElementsByClassName("swal2-popup")[0];
    //               swal_alert.style.width = "40rem";
    //             },
    //           });
    //         }
    //       }
    //     } else {
    //       if (Object.keys(res[key]).includes("all")) {
    //         //check if all is in json structure
    //         //announcements for all OS's
    //         Swal.fire({
    //           title: res[key]["all"]["title"],
    //           html: `<p>${res[key]["all"]["message"]}</p>`,
    //           icon: res[key]["all"]["type"],
    //           heightAuto: false,
    //           backdrop: "rgba(0,0,0, 0.4)",
    //           confirmButtonText: "Okay",
    //           allowOutsideClick: false,
    //           allowEscapeKey: false,
    //           didOpen: () => {
    //             let swal_alert = document.getElementsByClassName("swal2-popup")[0];
    //             swal_alert.style.width = "40rem";
    //           },
    //         });
    //       }
    //     }
    //   } else {
    //     //app version is not up to date
    //     if (state === "update") {
    //       Swal.fire({
    //         title: res["older"]["all"]["title"],
    //         html: `<p>${res[key]["all"]["message"]}</p>`,
    //         icon: res[key]["all"]["type"],
    //         heightAuto: false,
    //         backdrop: "rgba(0,0,0, 0.4)",
    //         confirmButtonText: "Okay",
    //         allowOutsideClick: false,
    //         allowEscapeKey: false,
    //         didOpen: () => {
    //           let swal_alert = document.getElementsByClassName("swal2-popup")[0];
    //           swal_alert.style.width = "40rem";
    //         },
    //       });
    //     }
    //   }
    // }
  } catch (error) {
    console.error(error);
  }
};
