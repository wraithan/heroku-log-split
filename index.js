#!/usr/bin/env node

var fs = require('fs')
var split = require('split')
var stream = require('stream')

var file = process.argv[2]

if (!fs.existsSync(file)) {
  console.log('pass in a file')
  process.exit(1)
}

var fileStream = fs.createReadStream(file)

var herokuStream = new stream.Transform({decodeStrings: false})

var files = {}

herokuStream._write = function (data, encoding, done) {
  var nameRegEx = /app\[([a-zA-Z\.\d]+)\]/
  if (data.length) {
    var possibleName = nameRegEx.exec(data)
    var offset = 0
    if (possibleName && possibleName[1]) {
      offset = possibleName.index + possibleName[1].length + 7
      possibleName = possibleName[1]
    } else {
      return done()
    }

    data = data.substring(offset, data.length)

    if (possibleName) {
      if (!files[possibleName]) {
        files[possibleName] = fs.createWriteStream('./' + possibleName + '-' + file)
      }
      files[possibleName].write(data + '\n')
    }
  }
  done()
}

herokuStream._flush = function (done) {
  var names = Object.keys(files)
  for (var i = 0; i < names.length; i++) {
    files[names[i]].end()
  }
  done()
}

fileStream.pipe(split()).pipe(herokuStream)