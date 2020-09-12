/*!
 * spur-template - An admin template based on Bootstrap 4
 * Version v1.1.0
 * Copyright 2016 - 2019 Alexander Rechsteiner
 * https://hackerthemes.com
 */

const mobileBreakpoint = window.matchMedia("(max-width: 991px )");

// $(".dash-nav-dropdown-toggle").click(function(){
//   if ($(this).closest(".dash-nav-dropdown").hasClass("show")) {
//     $(this).closest(".dash-nav-dropdown").toggleClass("show")
//   } else {
//     $(this).closest(".dash-nav-dropdown").addClass("show")
//   }
// });


var dropdown = document.getElementsByClassName("dash-nav-dropdown-toggle");
var i;

for (i = 0; i < dropdown.length; i++) {
  dropdown[i].addEventListener("click", function() {
    this.classList.toggle("show");
    var dropdownContent = this.nextSibling.nextSibling;
    if (dropdownContent.style.display === "block") {
      dropdownContent.style.display = "none";
    } else {
      dropdownContent.style.display = "block";
    }
  });
}


$(document).ready(function(){

    $(".menu-toggle").click(function(){
        if (mobileBreakpoint.matches) {
            $(".dash-nav").toggleClass("mobile-show");
        } else {
            $(".dash").toggleClass("dash-compact");
        }
    });

    // $(".searchbox-toggle").click(function(){
    //     $(".searchbox").toggleClass("show");
    // });

    // Dev utilities
    // $("header.dash-toolbar .menu-toggle").click();
    // $(".searchbox-toggle").click();
});
