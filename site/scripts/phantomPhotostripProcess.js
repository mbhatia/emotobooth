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

page.open('http://localhost:8080/photostrips/?inPath='+escape(args[1])+'&images='+escape(args[3]), function(status) {
  if(status === "success") {
    // setTimeout(function() {
    //   page.render(args[2], {format: 'jpeg', quality: '100'});
    //   phantom.exit();
    // }, 3000);
  } else {
    console.log(status);
    phantom.exit();
  }
});
