var cache = {
      'artists': null,
      'albums': null,
      'songs': null,
      'songs_by_album': null,
      'albums_by_artist': null
    },
    current_artist = null,
    $data, $audio, $divs, $nowplaying;

$(document).ready(function() {
  var i = 0;
  Object.keys(cache).forEach(function(key) {
    $.getJSON('/api/'+key, function(data) {
      console.log('Got ' + key);
      cache[key] = data;
      if (++i >= Object.keys(cache).length)
        start();
    });
  });
});

function start() {
  $data = $('#data');
  $audio = $('audio');
  $divs = {
    'artists': null,
    'albums': null,
    'songs': null
  };
  $nowplaying = {
    'artist': $('#nowplaying .artist'),
    'album': $('#nowplaying .album'),
    'song': $('#nowplaying .song')
  };

  $data.html('');

  // Loop artists albums and songs
  Object.keys($divs).forEach(function(key) {
    $data.append('<div id="' + key + '" class="span4"><h2>' + key + '</h2></div>');
    $divs[key] = $('#' + key);

    // Populate the column
    var s = '';
    s += '<ul>';
    s += (key === 'artists')
       ? '<li data-id="all">All Artists</li>'
       : (key === 'albums')
       ? '<li data-id="all">All Albums</li>'
       : '';
    Object.keys(cache[key]).forEach(function(id) {
      var a = cache[key][id];
      s += '<li data-id="' + id + '">' + (a.name || a.title) + '</li>';
    });
    s += '</ul>';
    $divs[key].append(s);
  });


  $('#artists ul li').live('click', function() {
    var $this = $(this),
        id = $this.attr('data-id'),
        ids = (id === 'all')
            ? Object.keys(cache.albums)
            : cache.albums_by_artist[id];

    current_artist = +id || null;

    // Populate the albusm
    $divs.albums.find('ul').html('<li data-id="all">All Albums</li>');
    populate_list($divs.albums, 'albums', ids);

    // Populate the songs
    $divs.songs.find('ul').html('');
    ids.forEach(function(album_id) {
      populate_list($divs.songs, 'songs', cache.songs_by_album[album_id]);
    });
  });

  $('#albums ul li').live('click', function() {
    var $this = $(this),
        id = $this.attr('data-id'),
        ids = cache.songs_by_album[id];

    // Populate the songs
    $divs.songs.find('ul').html('');
    if (ids) {
      populate_list($divs.songs, 'songs', ids);
    } else if (current_artist) {
      cache.albums_by_artist[current_artist].forEach(function(album_id) {
        populate_list($divs.songs, 'songs', cache.songs_by_album[album_id]);
      });
    } else {
      populate_list($divs.songs, 'songs', Object.keys(cache.songs));
    }
  });

  // Event listeners on songs
  $('#songs ul li').live('click', function() {
    var $this = $(this),
        song_id = $this.attr('data-id'),
        artist = cache.songs[song_id].artist['#'],
        album = cache.songs[song_id].album['#'],
        song = cache.songs[song_id].title;

    console.log('Clicked: ' + song);

    // Get the newest song url
    $.ajax({
      'url': '/api/songs/' + song_id + '/new',
      'dataType': 'json',
      'success': cb,
      'error': cb
    });

    function cb(data) {
      console.log(data);
      $audio.attr('src', data.url || cache.songs[song_id].url);

      console.log(data.url || cache.songs[song_id].url);

      $nowplaying.artist.text(artist);
      $nowplaying.album.text(album);
      $nowplaying.song.text(song);

      $audio[0].pause();
      $audio[0].play();
    }
  });

  // Keyboard shortcuts
  Mousetrap.bind('space', function() {
    var audio = $audio[0];
    if (audio.paused) audio.play();
    else audio.pause();
    console.log('Music is now ' + ((audio.paused) ? 'paused' : 'playing'));
    return false;
  });
  Mousetrap.bind(['j', 'down'], function() {
    console.log('down');
    return false;
  });
  Mousetrap.bind(['k', 'up'], function() {
    console.log('up');
    return false;
  });
}

function populate_list($item, target, ids) {
  var s = '';
  ids.forEach(function(id) {
    var a = cache[target][id];
    s += '<li data-id="' + id + '">' + (a.name || a.title) + '</li>';
  });
  $divs[target].find('ul').append(s);
}
