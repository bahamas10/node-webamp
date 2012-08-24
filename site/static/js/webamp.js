var cache = {
      'artists': null,
      'albums': null,
      'songs': null,
      'songs_by_album': null,
      'albums_by_artist': null,
      'conf': null,
      'themes': null
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
    $data, $audio, $divs, $nowplaying, $favicon, $dropdown, $themes;

$(document).ready(function() {
  var i = 0;
  Object.keys(cache).forEach(function(key) {
    $.getJSON('/api/' + key, function(data) {
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
  $dropdown = $('select');
  $themes = $('#themes');
  orig_favicon = $favicon.attr('href');
  orig_title = document.title;

  $data.html('');

  // Loop artists albums and songs
  Object.keys($divs).forEach(function(key) {
    $data.append('<div id="' + key + '" class="span4 music-list"></div>');
    $divs[key] = $('#' + key);

    // Populate the column
    var s = '';
    s += '<input class="input-' + key + '" placeholder="' + key + '" data-key="' + key + '" /><br />';
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
      var $_this = $(this),
          data_id = $_this.attr('data-id');
      if (+data_id) playlist.push(data_id);
      $_this.removeClass('active');
    });
    playlist_pos = playlist.indexOf(song_id);
    console.log('Playlist pos ' + playlist_pos + ': ' + playlist);

    _play();

    return false;
  });

  // next song
  $audio.on('ended', next);
  $audio.on('error', function(e) {
    console.log(e);
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

  // Themes
  Object.keys(cache.themes).forEach(function(theme) {
    if (theme !== 'img') $themes.find('ul').append('<li><a href="#">' + theme + '</a></li>');
  });
  $themes.find('ul li a').live('click', function() {
    var $this = $(this);
    clear_active($themes);
    $this.parent().addClass('active');

    var val = $this.text();
    console.log(val);
    $.cookie('theme', val, { expires: 7 });
    set_theme(val);
  });
  $themes.find('ul li a').each(function() {
    var val = $(this).text();
    if (val === $.cookie('theme')) $(this).trigger('click');
  });
  $themes.find('ul').hide();
  $themes.hover(function() {
    $themes.find('ul').show('fast');
  }, function() {
    $themes.find('ul').hide('fast');
  });

  // Filter
  $('input').keyup(function() {
    var $this = $(this),
        key = $this.attr('data-key'),
        val = $this.val();

    if (val === '') return $divs[key].find('ul li a').show();
    $divs[key].find('ul li a').each(function() {
      var $this = $(this);
      if ($this.text().toLowerCase().indexOf(val) === -1) {
        $this.hide();
      } else {
        $this.show();
      }
    });
  });
}

function populate_list($item, target, ids) {
  var s = '',
      add_albums = target === 'songs',
      old_album;
  sort(ids, target).forEach(function(id) {
    var a = cache[target][id],
        title = (a.name || a.title) + ((a.year) ? ' (' + a.year + ')' : ''),
        album = (a.album) ? a.album['#'] : '';

    if (add_albums && old_album !== album) s += '<li data-id="null" class="nav-header">' + album + ' (' + cache.albums[a.album['@'].id].year + ')</li>';
    s += '<li data-id="' + id + '"><a href="#">';
    if (target === 'albums') s += '<img src="' + get_artwork_url(id) + '" width="20" height="20" />';
    s += ((a.track && a.track != 0) ? a.track + '. ' : '') + title;
    s += '</a></li>';
    old_album = album;
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
    var img_src = get_artwork_url(data.album['@'].id);

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
    var year1 = (type === 'songs') ? cache.albums[cache.songs[a['@'].id].album['@'].id].year : a.year;
    var year2 = (type === 'songs') ? cache.albums[cache.songs[b['@'].id].album['@'].id].year : b.year;
    if ((+year1 || 0) > (+year2 || 0)) return 1;
    else if ((+year1 || 0) < (+year2 ||0)) return -1;

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

function set_theme(theme) {
  $('#theme-css').attr('href', cache.themes[theme] || '');
  $themes.find('.current-theme').text(theme);
}

function get_artwork_url(id) {
  if (cache.conf.cache.artwork) {
    var img_src = '/cache/art/' + id + '.jpg';
  } else {
    var img_src = cache.albums[id].art;
    if (img_src.match(/[^&]object_type/)) img_src = img_src.replace('object_type', '&object_type');
  }
  return img_src;
}
