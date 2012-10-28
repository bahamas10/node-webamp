var path = require('path');
var filed = require('filed');
var site_path = path.normalize(path.join(__dirname, '..', 'site'));

module.exports = function(req, res, params) {
  if (req.method !== 'HEAD' && req.method !== 'GET') return res.error(501);

  var file_path = path.join(site_path, req.url_parsed.pathname);
  req.pipe(filed(file_path)).pipe(res);
};
