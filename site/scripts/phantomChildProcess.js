'use strict';

var page = require('webpage').create();
var args = require('system').args;
var ws = new WebSocket('ws://localhost:8088')
ws.onmessage = function(message) {
  if (message.data === 'renderComplete') {
    page.render(args[2], {format: 'jpeg', quality: '100'});
    phantom.exit();
  }
};

page.onConsoleMessage = function(msg) {
  console.log('console: ' + msg);
};
page.open('http://localhost:8080/single?timing=' + args[3] + '&', function(status) {
  if(status === "success") {
    if (page.injectJs(args[1])) {
      
    } else {
      console.log(page.injectJs(args[1]));
      //page.close();
      phantom.exit();
    }
  } else {
    console.log(status);
    //page.close();
    phantom.exit();
  }
});
