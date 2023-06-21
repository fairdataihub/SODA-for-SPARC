function generateRandomString() {
  let length = Math.floor(Math.random() * 30); // Generate a random length between 0 and 300
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < 5; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

let itemList = [];
for (let i = 0; i < 100; i++) {
  // create a string of random length from 0 to 200 characters
  let randomString = generateRandomString();
  itemList.push(randomString);
}

const sodaSwalConfirmList = async (
  icon,
  title,
  arrayToShowInUI,
  confirmButtonText,
  cancelButtonText
) => {
  const { value: swalConfirmed } = await Swal.fire({
    icon: icon,
    title: title,
    html: `
      <div class="container--swal-file-list">
        ${arrayToShowInUI
          .map((item) => {
            return `<div class="item--swal-file-list">${item}</div>`;
          })
          .join("\n")} 
      </div>

    `,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  console.log("userConfirmed: ", swalConfirmed);
  return swalConfirmed;
};

//wrap below function in async
const testSwal = async () => {
  // wait for 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await sodaSwalConfirmList("info", "Are you sure?", itemList, "Yes, delete it!", "No, cancel!");
};
