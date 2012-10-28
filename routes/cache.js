var path = require('path');
var filed = require('filed');

module.exports = function(req, res, params, cache_dir) {
  if (req.method !== 'HEAD' && req.method !== 'GET') return res.error(501);

  var file_path = path.join(cache_dir,
      req.url_parsed.pathname.replace('/cache', '/media'));
  req.pipe(filed(file_path)).pipe(res);
};
