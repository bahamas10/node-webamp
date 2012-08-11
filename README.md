Ampache Web Interface
=====================

Ampache web interface to make browsing, and playing your music a simple task

**NOTE:** This is still a work-in-progress!!

Installation
------------

This is meant to be installed as a command-line utility

    npm install -g webamp

Usage
-----

Create the necessary config file by running

    ~$ webamp --init

This will create a json file at `~/.webamp/config.json` that will be used
to configure the local webserver settings, as well as store the ampache credentials.

    ~$ webamp
    Server running at http://localhost:8076/
    Successfully Authenticated!
    Populating cache
    Artists cache loaded
    Albums cache loaded
    Songs cache loaded
    [Sat Aug 11 2012 00:15:52 GMT-0700 (PDT)] [GET] request received from 127.0.0.1 for /api/artists/7/new

Configuration
-------------

After running `webamp --init` you can view the configuration file at `~/.webamp/config.json`

``` json
{
  "ampache": {
    "debug": false, /* Optional - default: false */
    "ping": 600000, /* Optional - default: 10 * 60 * 1000 */
    "user": "user",
    "pass": "pass",
    "url": "http://example.com:1234/ampache/server/xml.server.php"
  },
  "web": {
    "host": "localhost",
    "port": "8076"
  }
}
```

### Options

Most of the options are self explanatory

`ampache.debug`: Enable debug messages for [Ampache](https://github.com/bahamas10/node-ampache/) module
`ampache.ping`: The time in milliseconds to between sending `ping` requests to Ampache (default: 10 minutes)

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


License
-------

MIT License
