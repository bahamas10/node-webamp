var cache = {
  'artists': null,
  'albums': null,
  'songs': null,
  'songs_by_album': null,
  'albums_by_artist': null
};

$(document).ready(function() {
  Object.keys(cache).forEach(function(key) {
    $.getJSON('/api/'+key, function(data) {
      console.log('Got ' + key);
      cache[key] = data;
    });
  });
});
