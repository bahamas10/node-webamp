var fs = require('fs');
var path = require('path');
var AmpacheSession = require('ampache');

var theme_url = path.join('/static/third-party/bootstrap/css');
// get the list of themes
var theme_names = fs.readdirSync(
  path.join(__dirname, '..', 'site', theme_url)
).filter(function(d) { return d.indexOf('bootstrap') === -1; });

module.exports = function(req, res, params, o) {
  var type = params.type;
  var filter = params.filter;

  var conn = o.conn;
  var cache = o.cache;
  var conf = o.conf;

  if (params.new === 'new') {
    // User is requesting new information
    var func = (type === 'artists') ? AmpacheSession.prototype.get_artist
             : (type === 'albums')  ? AmpacheSession.prototype.get_album
             : (type === 'songs')   ? AmpacheSession.prototype.get_song
             : function() { res.end('[]'); };

    func.call(conn, filter, function(err, body) {
      if (err) throw err;
      if (body && body.error) {
        // Try once to reauth
        console.warn(body.error);
        console.warn('Session expired - reauthenticating');
        conn.authenticate(function(err, body) {
          if (err) throw err;
          func.call(conn, filter, function(err, body) {
            if (err) throw err;
            res.end(JSON.stringify(body));
          });
        });
      } else {
        res.end(JSON.stringify(body));
      }
    });
  } else {
    // User wants it from the cache
    var data;
    if (!type) {
      data = Object.keys(cache);
    } else if (!cache[type]) {
      data = [];
      if (type === 'themes') {
        data = {};
        theme_names.forEach(function(theme) {
          data[theme.split('.')[0]] = path.join(theme_url, theme);
        });
      } else if (type === 'conf') {
        data = {
          cache: conf.cache
        };
      }
    } else if (filter) {
      data = cache[type][filter];
    } else {
      data = cache[type];
    }

    res.end(JSON.stringify(data));
  }
};
