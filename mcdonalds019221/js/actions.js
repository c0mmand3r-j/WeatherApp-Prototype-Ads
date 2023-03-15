$(document).ready(function() {
    $('.client_name').load("info/client_name.html"),
    $('.product_name').load("info/product_name.html");


    var text1 = document.querySelectorAll('.text1');
    var text2 = document.querySelectorAll('.endframetext');

    anime({
      targets: text1,
      opacity: 0,
      duration: 5000,
      delay: 3000
    });

    anime({
      targets: text2,
      opacity: 1,
      duration: 5000,
      delay: 4000
    });


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
