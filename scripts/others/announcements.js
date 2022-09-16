//state will be either "update" or "announcements"
//when "update" is passed it will know there user needs to update
const checkForAnnouncements = async (state) => {
  const url = `https://raw.githubusercontent.com/fairdataihub/SODA-for-SPARC/staging/scripts/meta/announcements.json?timestamp=${new Date().getTime()}`;

  const axiosInstance = axios.create({
    baseURL: url,
    timeout: 0,
  });

  try {
    //retrieve the announcements from the SODA repo (announcements.json)
    let result = await axiosInstance.get();
    let res = result.data;

    let platform = String(os.platform);

    for (var key of Object.keys(res)) {
      //app version should latest version to receive announcement
      if (appVersion === key) {
        if (Object.keys(res[key]).includes(platform)) {
          //check for platform
          if (res[key][platform]["show"] === true) {
            //if platform found then use that object to create announcement
            if (state === "announcements") {
              await Swal.fire({
                title: res[key][platform]["title"],
                html: `<p>${res[key][platform]["message"]}</p>`,
                icon: res[key][platform]["type"],
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
                confirmButtonText: "Okay",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                  let swal_alert =
                    document.getElementsByClassName("swal2-popup")[0];
                  swal_alert.style.width = "40rem";
                },
              });
            }
          }
        } else {
          if (Object.keys(res[key]).includes("all")) {
            //check if all is in json structure
            //announcements for all OS's
            Swal.fire({
              title: res[key]["all"]["title"],
              html: `<p>${res[key]["all"]["message"]}</p>`,
              icon: res[key]["all"]["type"],
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              confirmButtonText: "Okay",
              allowOutsideClick: false,
              allowEscapeKey: false,
              didOpen: () => {
                let swal_alert =
                  document.getElementsByClassName("swal2-popup")[0];
                swal_alert.style.width = "40rem";
              },
            });
          }
        }
      } else {
        //app version is not up to date
        if (state === "update") {
          Swal.fire({
            title: res["older"]["all"]["title"],
            html: `<p>${res[key]["all"]["message"]}</p>`,
            icon: res[key]["all"]["type"],
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: "Okay",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              let swal_alert =
                document.getElementsByClassName("swal2-popup")[0];
              swal_alert.style.width = "40rem";
            },
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};
