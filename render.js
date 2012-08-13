var util = require('util'),
    path = require('path'),
    amulet = require('amulet'),
    root = path.join(__dirname, 'templates');

module.exports = function(res, data) {
  return amulet.render(res,
      [path.join(root, 'layout.html'), path.join(root, 'default.html')],
      data);
}
