/*!
 * gachou-crawler <https://github.com/gachou/gachou-crawler>
 *
 * Copyright (c) 2016 Nils Knappmeier.
 * Released under the MIT license.
 */

'use strict'

var dirTreeStream = require('directory-tree-stream')
var async = require('async')
var Q = require('q')
var request = require('request')
var path = require('path')
var fs = require('fs')

module.exports = gachouCrawler
/**
 * Describe your module here
 * @public
 */
function gachouCrawler(rootDir) {
  var deferred = Q.defer()

  var queue = async.queue(postFile, 1)
  queue.buffer = 1
  var count = 0;
  console.log(queue.buffer)
  var stream = dirTreeStream(rootDir)
    .on('error', (err) => deferred.reject(err))
    .on('end', () => {
      // No more files, wait for the queue to finish and then resolve the promise
      queue.drain = () => deferred.resolve()
    })

  // Adjust flow of the filename-stream to the speed in which the worker can work
  queue.saturated = () => stream.pause()
  queue.unsaturated = () => stream.resume()



  // This (probably) starts the crawl
  // https://nodejs.org/dist/latest-v4.x/docs/api/stream.html#stream_event_data
  stream.on('data', (file) => {
    queue.push(file)
    console.log("Queue", queue.length())
  })

  function postFile(file, done) {
    var filePath = path.join(rootDir, file.path);
    var req = request.post('http://localhost:3000/upload', function (err, resp, body) {
      if (err) {
        return done(err)
      }
      console.log("done", count++, filePath, body)
      done()
    })
    var form = req.form()
    form.append('file', fs.createReadStream(filePath));
  }

  return deferred.promise
}

gachouCrawler('../data').done()
