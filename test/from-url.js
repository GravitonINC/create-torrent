const fixtures = require('webtorrent-fixtures')
const parseTorrent = require('parse-torrent')
const path = require('path')
const sha1 = require('simple-sha1')
const test = require('tape')
const createTorrent = require('..')
const url = "https://universeapp-assets-dev.s3.amazonaws.com/e01e5df8a353e7cf96d9c9663be0290e34dc7d75c6770cb3.jpg" // File to download
const filename = "e01e5df8a353e7cf96d9c9663be0290e34dc7d75c6770cb3.jpg"
const dest = "./" + filename // Download destination
const announce = ["wss://bttracker.graviton.xyz/announce", "wss://tracker.openwebtorrent.com"] // Custom Torrent Tracker
const creator = "0x86cd27Eba61Df73b433711e76B5d2E1E5ec58a67" // ETH wallet that created the NFT
const comment = "My Comment..."
const torrentfile = filename.split(".")[0] + ".torrent"

const opts = {
  name: filename,                       // name of the torrent (default = basename of `path`, or 1st file's name)
  comment: comment,                     // free-form textual comments of the author
  createdBy: creator,                   // name and version of program used to create torrent
  creationDate: Date.now(),             // creation time in UNIX epoch format (default = now)
  // filterJunkFiles: Boolean,          // remove hidden and other junk files? (default = true)
  // private: Boolean,                  // is this a private .torrent? (default = false)
  // pieceLength: Number,               // force a custom piece length (number of bytes)
  announceList: [announce],             // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
  urlList: [url],                       // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
  // info: Object,                      // add non-standard info dict entries, e.g. info.source, a convention for cross-seeding
  // onProgress: Function               // called with the number of bytes hashed and estimated total size after every piece
}

const https = require('https'); // or 'http' for http:// URLs
const fs = require('fs');

const file = fs.createWriteStream(dest);
https.get(url, async function (response) {
  await response.pipe(file);
  response.on("error", (err) => {
    console.log("Error downloading file: " + url);
    throw err;
  });
  response.on("end", () => {
    console.log("Download successful: " + url);
    console.log("Filepath: " + file.path)
  });

});

test('create single file torrent from download', t => {
  t.plan(4)

  const startTime = Date.now()
  createTorrent(file.path, opts, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, filename)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(opts.announceList))

    fs.writeFile(torrentfile, torrent, function (err, result) {
      if (err) console.log('Error writing .torrent file: ', err);
    });

    console.log("Parsed Torrent:")
    console.log(JSON.stringify(parsedTorrent, null, 2))
    console.log(".torrent file content: ")
    fs.readFile(torrentfile, (error, data) => {
      if (error) {
        throw error;
      }
      console.log(data.toString());
    });

  })
})