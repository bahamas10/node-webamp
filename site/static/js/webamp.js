var cache = {
  'artists': null,
  'albums': null,
  'songs': null,
  'songs_by_album': null,
  'albums_by_artist': null
};

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
  var $data = $('#data'),
      $audio = $('audio'),
      $divs = {
        'artists': null,
        'albums': null,
        'songs': null
      },
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
    Object.keys(cache[key]).forEach(function(id) {
      var a = cache[key][id];
      s += '<li data-id="' + id + '">' + (a.name || a.title) + '</li>';
    });
    s += '</ul>';
    $divs[key].append(s);
  });

  // Event listeners on songs
  $('#songs ul li').click(function() {
    var $this = $(this),
        song_id = $this.attr('data-id'),
        artist = cache.songs[song_id].artist['#'],
        album = cache.songs[song_id].album['#'],
        song = cache.songs[song_id].title;

    console.log('Clicked: ' + song_id);
    $audio.attr('src', cache.songs[song_id].url);

    $nowplaying.artist.text(artist);
    $nowplaying.album.text(album);
    $nowplaying.song.text(song);

    $audio[0].pause();
    $audio[0].play();
  });

  // Keyboard shortcuts
  console.log(Mousetrap);
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
