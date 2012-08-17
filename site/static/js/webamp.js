var cache = {
      'artists': null,
      'albums': null,
      'songs': null,
      'songs_by_album': null,
      'albums_by_artist': null
    },
    current_artist = null,
    playlist = [],
    playlist_pos = 0,
    options = {
      'repeat': false,
    },
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
    'img': $('#nowplaying img.album-art'),
    'artist': $('#nowplaying li.artist'),
    'album': $('#nowplaying li.album'),
    'song': $('#nowplaying li.song')
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
    s += '</ul>';
    $divs[key].append(s);

    populate_list($divs[key], key, Object.keys(cache[key]));
  });


  // Artist click
  $('#artists ul li').live('click', function() {
    var $this = $(this),
        id = $this.attr('data-id'),
        ids = (id === 'all')
            ? Object.keys(cache.albums)
            : cache.albums_by_artist[id];

    current_artist = +id || null;

    // Populate the albums
    $divs.albums.find('ul').html('<li data-id="all">All Albums</li>');
    populate_list($divs.albums, 'albums', ids);

    // Populate the songs
    $divs.songs.find('ul').html('');
    ids.forEach(function(album_id) {
      populate_list($divs.songs, 'songs', cache.songs_by_album[album_id]);
    });
  });

  // Album click
  $('#albums ul li').live('click', function() {
    var $this = $(this),
        id = $this.attr('data-id'),
        ids = cache.songs_by_album[id];

    // Populate the songs
    $divs.songs.find('ul').html('');
    if (ids) {
      populate_list($divs.songs, 'songs', ids);
    } else if (current_artist) {
      // All albums by the artist
      cache.albums_by_artist[current_artist].forEach(function(album_id) {
        populate_list($divs.songs, 'songs', cache.songs_by_album[album_id]);
      });
    } else {
      // all the songs
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

    playlist = [];
    $divs.songs.find('ul li').each(function() {
      playlist.push($(this).attr('data-id'));
    });
    playlist_pos = playlist.indexOf(song_id);
    console.log('Playlist pos ' + playlist_pos + ': ' + playlist);

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

      // WTF API
      var img_src = data.art || cache.songs[song_id].art;
      if (img_src.match(/[^&]object_type/)) img_src = img_src.replace('object_type', '&object_type');

      $nowplaying.img.attr('src', img_src).removeClass('noborder');

      $audio[0].pause();
      $audio[0].play();
    }
  });

  $audio.on('ended', function() {
    console.log('song ended');
    next();
  });

  // Keyboard shortcuts
  Mousetrap.bind(['j', 'down'], function() {
    console.log('down');
    return false;
  });
  Mousetrap.bind(['k', 'up'], function() {
    console.log('up');
    return false;
  });
  Mousetrap.bind('space', toggle_play);
  Mousetrap.bind('left', prev);
  Mousetrap.bind('right', next);
}

function populate_list($item, target, ids) {
  var s = '';
  ids.forEach(function(id) {
    var a = cache[target][id],
        title = (a.name || a.title) + ((a.year) ? ' (' + a.year + ')' : '');
    s += '<li data-id="' + id + '">' + title + '</li>';
  });
  $divs[target].find('ul').append(s);
}

function next() {
  playlist_pos++;
  _play();
}

function prev() {
  playlist_pos--;
  _play();
}

function _play() {
  if (options.repeat) playlist_pos = (playlist_pos + playlist.length) % playlist.length;

  var song_id = playlist[playlist_pos];
  if (!song_id) {
    $nowplaying.song.text('');
    $nowplaying.album.text('');
    $nowplaying.artist.text('');
    $nowplaying.img.attr('src', '/static/img/black.png').addClass('noborder');
    playlist = [];
    playlist_pos = 0;
    $audio[0].pause();
    return;
  }

  $divs.songs.find('ul li[data-id=' + song_id + ']').trigger('click');
}

function toggle_play() {
  var audio = $audio[0];
  if (audio.paused) audio.play();
  else audio.pause();
  console.log('Music is now ' + ((audio.paused) ? 'paused' : 'playing'));
}
