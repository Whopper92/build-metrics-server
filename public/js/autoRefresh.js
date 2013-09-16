function autoRefresh() {
 // First, get the value of the refresh cookie to know if we should refresh
  var refStatus = getCookie('refresh')
  if(refStatus == 'true') {
    var timeout = []
    timeout.push( setTimeout(function(){ window.location.reload(1);}, 30000));
  } else {
    if(timeout) {
      for(i = 0; i < timeout.length; ++i) {
        clearTimeout(timeout[i])
      }
    }
  }
}

function setCookie(c_name,value,exdays) {
  document.cookie='refresh=' + value + '; expires=Thu, 2 Aug 2020 20:47:11 UTC; path=/'
}

function getCookie(c_name) {
  var c_value = document.cookie;
  var c_start = c_value.indexOf(" " + c_name + "=");
  if (c_start == -1) {
    c_start = c_value.indexOf(c_name + "=");
  }
  if (c_start == -1) {
    c_value = null;
  }
  else {
    c_start = c_value.indexOf("=", c_start) + 1;
    var c_end = c_value.indexOf(";", c_start);
    if (c_end == -1) {
      c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start,c_end));
  }
  return c_value;
}
