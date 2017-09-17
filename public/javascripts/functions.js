// From w3schools

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}

function toggle_image(that) {
  if (that.style.maxHeight) {
    that.style.maxHeight = 'none';
  }
  else {
    that.style.maxHeight = '150px';
  }
}

$(function () {
  $("#theme").change(function () {
    var stylesheet = '/stylesheets/' + $('#theme option:selected').text().toLowerCase() + '.css';
    document.getElementById('theme_css').href = stylesheet;
    setCookie('theme', stylesheet, 365);
  });
});