/**
 * add functions to the req object
 */

var path = require('path');
var url = require('url');

module.exports = decorate;

function decorate(req, res) {
  req.received_date = new Date();

  req.url_parsed = url.parse(req.url, true);
  req.url_parsed.pathname = path.normalize(req.url_parsed.pathname);

  // easily send a redirect
  res.redirect = function(url, headers, code) {
    headers = headers || {};
    headers.Location = url;

    res.writeHead(code || 302, headers);
    res.end();
  };

  // shoot a server error
  res.error = function(code) {
    res.statusCode = code || 500;
    res.end();
  };

  // 404 to the user
  res.notfound = function() {
    res.statusCode = 404;
    res.end();
  };
}
