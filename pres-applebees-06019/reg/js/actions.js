$(document).ready(function() {
    $('.client_name').load("info/client_name.html"),
    $('.product_name').load("info/product_name.html");
});

document.addEventListener("keyup",function(e){
   var key = e.which||e.keyCode;
   switch(key){
      //left arrow
      case 37:
         document.getElementById("left-arrow").click();
      break;
      //right arrow
      case 39:
         document.getElementById("right-arrow").click();
      break;
   }
});
