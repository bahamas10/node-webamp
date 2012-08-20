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
    orig_title = '',
    orig_favicon = '',
    article_re = /^the |^a /,
    $data, $audio, $divs, $nowplaying, $favicon;

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
  $favicon = $('.favicon');
  orig_favicon = $favicon.attr('href');
  orig_title = document.title;

  $data.html('');

  // Loop artists albums and songs
  Object.keys($divs).forEach(function(key) {
    $data.append('<div id="' + key + '" class="span4 music-list"><h2>' + key + '</h2></div>');
    $divs[key] = $('#' + key);

    // Populate the column
    var s = '';
    s += '<ul class="nav nav-list">';
    s += (key === 'artists')
       ? '<li data-id="all"><a href="#">All Artists</a></li>'
       : (key === 'albums')
       ? '<li data-id="all"><a href="#">All Albums</a></li>'
       : '';
    s += '</ul>';
    $divs[key].append(s);

    populate_list($divs[key], key, Object.keys(cache[key]));
  });


  // Artist click
  $('#artists ul li a').live('click', function() {
    var $this = $(this),
        id = $this.parent().attr('data-id'),
        ids = (id === 'all')
            ? Object.keys(cache.albums)
            : cache.albums_by_artist[id];

    current_artist = +id || null;

    clear_active($divs.artists);
    $this.parent().addClass('active');

    // Populate the albums
    $divs.albums.find('ul').html('<li data-id="all"><a href="#">All Albums</a></li>');
    populate_list($divs.albums, 'albums', ids);

    // Populate the songs
    $divs.songs.find('ul').html('');
    var r = [];
    ids.forEach(function(album_id) {
      r = r.concat(cache.songs_by_album[album_id]);
    });
    populate_list($divs.songs, 'songs', r);
    highlight_current_song();

    return false;
  });

  // Album click
  $('#albums ul li a').live('click', function() {
    var $this = $(this),
        id = $this.parent().attr('data-id'),
        ids = cache.songs_by_album[id];

    clear_active($divs.albums);
    $this.parent().addClass('active');

    // Populate the songs
    $divs.songs.find('ul').html('');
    var r = [];
    if (ids) {
      r = ids;
    } else if (current_artist) {
      // All albums by the artist
      cache.albums_by_artist[current_artist].forEach(function(album_id) {
        r = r.concat(cache.songs_by_album[album_id]);
      });
    } else {
      // all the songs
      r = Object.keys(cache.songs);
    }
    populate_list($divs.songs, 'songs', r);
    highlight_current_song();

    return false;
  });

  // Event listeners on songs
  $('#songs ul li a').live('click', function() {
    var $this = $(this),
        song_id = $this.parent().attr('data-id');

    console.log('Clicked: ' + song_id);

    playlist = [];
    $divs.songs.find('ul li').each(function() {
      var $_this = $(this);
      playlist.push($_this.attr('data-id'));
      $_this.removeClass('active');
    });
    playlist_pos = playlist.indexOf(song_id);
    console.log('Playlist pos ' + playlist_pos + ': ' + playlist);

    _play();

    return false;
  });

  // next song
  $audio.on('ended', function() {
    console.log('song ended');
    next();
  });

  // Enlarge album art
  $('img.album-art').hover(function() {
    var $this = $(this);
    if ($this.hasClass('noborder')) return;
    $this.parent().parent().css("z-index", 1);
    $this.animate({
      'height': '256',
      'width': '256',
      'top': '-=200'
    }, 'fast');
  }, function() {
    var $this = $(this);
    if ($this.hasClass('noborder')) return;
    $this.parent().parent().css("z-index", 0);
    $this.animate({
      'height': '56',
      'width': '56',
      'top': '+=200'
    }, 'fast');
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
  sort(ids, target).forEach(function(id) {
    var a = cache[target][id],
        title = (a.name || a.title) + ((a.year) ? ' (' + a.year + ')' : '');
    s += '<li data-id="' + id + '"><a href="#">' + ((a.track && a.track != 0) ? a.track + '. ' : '') + title + '</a></li>';
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
    // clear EVERYTHING
    $nowplaying.song.text('');
    $nowplaying.album.text('');
    $nowplaying.artist.text('');
    $nowplaying.img.attr('src', '/static/img/black.png').addClass('noborder');
    $divs.songs.find('ul li a i').remove();
    $divs.songs.find('ul li').removeClass('active');
    document.title = orig_title;
    $favicon.attr('href', orig_favicon);
    playlist = [];
    playlist_pos = 0;
    $audio[0].pause();
    return;
  }

  var artist = cache.songs[song_id].artist['#'],
      album = cache.songs[song_id].album['#'],
      song = cache.songs[song_id].title;

  highlight_current_song(song_id);

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

    // Favicon magic
    var $old_favicon = $('.favicon');
    var $fav = $old_favicon.clone();
    $old_favicon.remove();
    $fav.attr('href', img_src);
    $('body').append($fav);

    document.title = artist + ' - ' + song;

    $audio[0].pause();
    $audio[0].play();
  }
}

function toggle_play() {
  var audio = $audio[0];
  if (audio.paused) audio.play();
  else audio.pause();
  console.log('Music is now ' + ((audio.paused) ? 'paused' : 'playing'));
}

function clear_active($div) {
  $div.find('ul li').removeClass('active');
}

function highlight_current_song(song_id) {
  song_id = song_id || playlist[playlist_pos];

  var $song_obj = $divs.songs.find('ul li[data-id=' + song_id + '] a');

  // if the song_obj is found, highlight it
  clear_active($divs.songs);
  $song_obj.parent().addClass('active');
  // Add the icon
  $divs.songs.find('ul li a i').remove();
  $song_obj.prepend('<i class="icon-music icon-white"></i>');
}

function sort(ids, type) {
  var arr = [];
  ids.forEach(function(id) {
    arr.push(cache[type][id]);
  });

  arr.sort(function(a, b) {
    // Artist name
    var artist_name1 = ((type === 'artists') ? a.name : a.artist['#']).toLowerCase().replace(article_re, '');
        artist_name2 = ((type === 'artists') ? b.name : b.artist['#']).toLowerCase().replace(article_re, '');

    if (artist_name1 > artist_name2) return 1;
    else if (artist_name1 < artist_name2) return -1;

    // Album Year
    if (+a.year > +b.year) return 1;
    else if (+a.year < +b.year) return -1;

    // Album name
    var album_name1 = ((type === 'albums') ? a.name : a.album['#']).toLowerCase().replace(article_re, '');
        album_name2 = ((type === 'albums') ? b.name : b.album['#']).toLowerCase().replace(article_re, '');

    if (album_name1 > album_name2) return 1;
    else if (album_name1 < album_name2) return -1;

    // Track number
    if (+a.track > +b.track) return 1;
    else if (+a.track < +b.track) return -1;

    // Bruteforce name sort
    var name1 = (a.name || a.title || '').toLowerCase().replace(article_re, ''),
        name2 = (b.name || b.title || '').toLowerCase().replace(article_re, '');

    return (name1 > name2) ? 1 : -1;
  });

  return arr.map(function(a) { return a['@'].id; });
}
