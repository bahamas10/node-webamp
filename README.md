Ampache Web Interface
=====================

Ampache web interface to make browsing, and playing your music a simple task

**NOTE:** This is still a work-in-progress!!

Only tested on Chrome, uses HTML5 Audio, probably won't work on any other browser

http://bahamas10.github.com/node-webamp/

Installation
------------

First install [Node](http://nodejs.org), then install this program using [NPM](http://npmjs.org)

    npm install -g webamp

Usage
-----

Create the necessary config file by running

    webamp --init

This will create a json file at `~/.webamp/config.json` that will be used
to configure the local webserver settings, as well as store the ampache credentials.
Modify this file to reflect your setup, and then run `webamp` to start the service.

    $ webamp
    [2012-11-04T02:33:50.165Z] Server running at http://localhost:8076/
    [2012-11-04T02:33:50.193Z] You are running the latest version 0.0.22
    [2012-11-04T02:33:50.336Z] Successfully Authenticated!
    [2012-11-04T02:33:50.336Z] Populating cache
    [2012-11-04T02:33:50.340Z] Loaded artists from local cache
    [2012-11-04T02:33:50.362Z] Loaded albums from local cache
    [2012-11-04T02:33:50.381Z] Calculating albums by artist
    [2012-11-04T02:33:50.383Z] Finished albums by artist
    [2012-11-04T02:33:50.615Z] Loaded songs from local cache
    [2012-11-04T02:33:50.616Z] Calculating songs by album
    [2012-11-04T02:33:50.625Z] Finished songs by album
    [2012-11-04T02:33:50.625Z] All caches ready
    [2012-11-04T02:33:51.084Z] 127.0.0.1 GET 200 /api/artists (15ms)
    [2012-11-04T02:33:51.086Z] 127.0.0.1 GET 200 /api/conf (1ms)
    [2012-11-04T02:33:51.088Z] 127.0.0.1 GET 200 /api/albums_by_artist (2ms)

Configuration
-------------

After running `webamp --init` you can view the configuration file at `~/.webamp/config.json`

``` json
{
  "ampache": {
    "debug": false,
    "ping": 600000,
    "user": "user",
    "pass": "pass",
    "url": "http://example.com:1234/ampache/server/xml.server.php"
  },
  "web": {
    "log": true,
    "host": "localhost",
    "port": 8076
  },
  "cache": {
    "artwork": true
  }
}
```

### Options

Most of the options are self explanatory, but for those that aren't

- `ampache.debug`: (Optional) Enable debug messages for [Ampache](https://github.com/bahamas10/node-ampache/) module
- `ampache.ping`: (Optional) The time in milliseconds to between sending `ping` requests to Ampache (default: 10 minutes)
- `web.log`: (Optional) Log a line for every request to the local webserver
- `cache.artwork`: Cache album art locally (faster, but more bandwidth initially)

API
---

The design goal is that a request to `/` will return a nice looking web page, with all your music in
a nice, easy to navigate format.  All interactions on that page will use Ajax to hit the server
at `/api/...` to pull JSON with relevant information.

### Routes

#### /api/artists, /api/albums, /api/songs

Return an array of all of the artists/albums/songs in the cache (which is populated when the program starts)

#### /api/artists/:id, /api/albums/:id, /api/songs/:id

Return an object for the relevant song/album/artist by id in the cache

#### /api/artists/:id/new, /api/artists/:id/new, /api/artists/:id/new

Same as above, but force the info to come from Ampache and not the cache

#### /api/albums\_by\_artist, /api/songs\_by\_album

Return an object with an album or artist as the key, and a list of song or album ids (respectively)

#### /api/themes

An object representing the possible themes to use

Known Issues
------------

All issues are tracked in github

https://github.com/bahamas10/node-webamp/issues?state=open

FAQ
---

#### Audio doesn't work on Ubuntu with chromium

Webamp relies on HTML5 audio (for now), install the codecs with this

    sudo apt-get install chromium-codecs-ffmpeg-extra

#### I updated my Ampache catalog and now the cache is wrong, how can I clear it?

To wipe all caches (including artwork) invoke webamp like this

    webamp --clear

#### I botched my config file pretty bad, how can I regenerate it?

    webamp --init


Credit
------

* [Ampache](http://ampache.org) - Without this, you wouldn't be able to listen to your music!
* [Twitter Bootstrap](http://twitter.github.com/bootstrap/) - Layout made easy
* [Bootswatch](http://bootswatch.com/) - Themes made easy

License
-------

MIT License
