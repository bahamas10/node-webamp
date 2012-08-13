// Includes and constants
var http = require('http'),
    path = require('path'),
    AmpacheSession = require('ampache'),
    url = require('url'),
    conf = {},
    conn,
    cache = {'artists': null, 'albums': null, 'songs': null, 'songs_by_album': null, 'albums_by_artist': null},
    router = new require('routes').Router();

// make the routes
router.addRoute('/', index);
router.addRoute('/api/:type?/:filter?/:new?', api);

// Export the function to create the server
module.exports = function(config) {
  conf = config;
  // Create the Ampache Object
  conn = new AmpacheSession(conf.ampache.user, conf.ampache.pass, conf.ampache.url, {debug: conf.ampache.debug || false});

  // Authenticate Ampache
  conn.authenticate(function(err, body) {
    if (err) throw err;
    console.log('Successfully Authenticated!');

    // Populate the cache
    populate_cache();

    // Keep-Alive
    setInterval(function() {
      console.log('Keep Alive');
      conn.ping(function(err, body) {
        if (err) conn.authenticate(function (err, body) {
          if (err) throw err;
        });
      });
    }, +conf.ampache.ping || 10 * 60 * 1000);
  });

  // Create the server
  return http.createServer(on_request).listen(conf.web.port, conf.web.host, server_started);
};

// Http server started
function server_started() {
  console.log('Server running at http://%s:%d/', conf.web.host, conf.web.port);
}

// Request received
function on_request(req, res) {
  // Log it
  console.log('[%s] [%s] request received from %s for %s ',
      Date(), req.method, req.connection.remoteAddress, req.url);

  // Extract the URL
  var uri = url.parse(req.url),
      normalized_path = path.normalize(uri.pathname),
      route = router.match(normalized_path);

  // Route not found
  if (!route) {
    res.statusCode = 404;
    return res.end();
  }

  // Route it
  return route.fn(req, res, route.params);
}

// Index route hit
function index(req, res, params) {
  res.end('hello!');
}

// API Route hit
function api(req, res, params) {
  var type = params.type,
      filter = params.filter;

  if (params.new === 'new') {
    // User is requesting new information
    var func = (type === 'artists') ? AmpacheSession.prototype.get_artist
             : (type === 'albums')  ? AmpacheSession.prototype.get_album
             : (type === 'songs')   ? AmpacheSession.prototype.get_song
             : function() { res.end('[]'); };

    func.call(conn, filter, function(err, body) {
      if (err) throw err;
      res.end(JSON.stringify(body));
    });
  } else {
    // User wants it from the cache
    var data;
    if (!type) {
      data = ['artists', 'albums', 'songs'];
    } else if (!cache[type]) {
      data = [];
    } else if (filter) {
      data = cache[type][filter];
    } else {
      data = cache[type];
    }

    res.end(JSON.stringify(data));
  }
}

// Populate the caches with data
function populate_cache() {
  console.log('Populating cache');
  var albums_by_artist = 0,
      songs_by_album = 0;
  conn.get_artists(function(err, body) {
    if (err) throw err;
    cache.artists = body;
    console.log('Artists cache loaded');
    if (++albums_by_artist >= 2) cache_albums_by_artist();
  });
  conn.get_albums(function(err, body) {
    if (err) throw err;
    cache.albums = body;
    console.log('Albums cache loaded');
    if (++albums_by_artist >= 2) cache_albums_by_artist();
    if (++songs_by_album >= 2) cache_songs_by_album();
  });
  conn.get_songs(function(err, body) {
    if (err) throw err;
    cache.songs = body;
    console.log('Songs cache loaded');
    if (++songs_by_album >= 2) cache_songs_by_album();
  });
}

// Clean these next 2 functions up.. so much copy and paste
function cache_albums_by_artist() {
  console.log('Calculating albums by artists');
  cache.albums_by_artist = {};
  Object.keys(cache.albums).forEach(function(id) {
    var artist_id = cache.albums[id].artist['@'].id;
    cache.albums_by_artist[artist_id] = cache.albums_by_artist[artist_id] || [];
    cache.albums_by_artist[artist_id].push(id);
  });
  console.log('Finished albums by artists');
}

function cache_songs_by_album() {
  console.log('Calculating songs by albums');
  cache.songs_by_album = {};
  Object.keys(cache.songs).forEach(function(id) {
    var album_id = cache.songs[id].album['@'].id;
    cache.songs_by_album[album_id] = cache.songs_by_album[album_id] || [];
    cache.songs_by_album[album_id].push(id);
  });
  console.log('Finished albums by artists');
}
