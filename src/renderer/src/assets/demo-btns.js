while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const demoBtns = document.querySelectorAll(".js-container-target");

// Listen for demo button clicks and toggle the "is-open" class on the parent container
Array.prototype.forEach.call(demoBtns, (btn) => {
  btn.addEventListener("click", (event) => {
    const parent = event.target.parentElement;
    parent.classList.toggle("is-open");
  });
});
