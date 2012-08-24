#!/usr/bin/env node
/**
 * Ampache Web
 *
 * Ampache web interface
 *
 * Author: Dave Eddy <dave@daveeddy.com>
 * License: MIT
 */

// Requires and such
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    server = require('../server'),
    version = require('../package.json').version,
    mkdirp = require('mkdirp'),
    args = process.argv.slice(2),
    webamp_dir = path.join(process.env['HOME'], '.webamp'),
    config_file = path.join(webamp_dir, 'config.json'),
    default_config = {
      'ampache': {
        'user': 'user',
        'pass': 'pass',
        'url': 'http://example.com:124/ampache/server/xml.server.php',
        'debug': false
      },
      'web': {
        'log': true,
        'host': 'localhost',
        'port': 8076
      },
      'cache': {
        'artwork': true
      }
    };

/**
 * Usage
 *
 * return the usage message
 */
function usage() {
  return util.format([
    'Usage: %s',
    '',
    'Fire up a nice web interface to ampache',
    '',
    'Options (must be given as the first argument; all options are mutually exclusive)',
    '  --init    | -i: Create a config file at %s',
    '  --clear   | -c: Clear the cache located at ~/.webamp/cache',
    '  --help    | -h: Print this help message and exit',
    '  --version | -v: Print the version number and exit',
    ''
  ].join('\n'), path.basename(process.argv[1]), config_file);
}

// Command line arguments
switch (args[0]) {
  case '-h': case '--help':
    console.log(usage());
    process.exit(0);
    break;
  case '-v': case '--version':
    console.log(version);
    process.exit(0);
    break;
  case '-c': case '--clear':
    var rimraf = require('rimraf');
    rimraf(path.join(webamp_dir, 'cache'), function(err) {
      if (err) throw err;
      console.log('Caches cleared');
    });
    return;
    break;
  case '-i': case '--init':
    var conf_stringified = JSON.stringify(default_config, null, 2);
    console.log('Writing config to %s', config_file);
    console.log('Make sure to edit this file with your information');
    console.log(conf_stringified);
    // Make the webamp_dir, and make it atomically
    try {
      fs.mkdirSync(webamp_dir, '0700');
    } catch (e) {} // silence is golden
    fs.writeFileSync(config_file, conf_stringified);
    process.exit(0);
    break;
}

try {
  var conf = require(config_file);
  conf.webamp_dir = webamp_dir;
} catch (e) {
  console.error('Error reading %s: invoke with --init to create this file with defaults',
      config_file);
  process.exit(1);
}

try {
  mkdirp(path.join(webamp_dir, 'cache', 'media', 'art'), '0755');
} catch (e) {}

// Everything should be good now, let's start the server
server(conf);
