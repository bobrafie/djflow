'use strict'

const fs = require('fs')
const glob = require('glob')
const ffmpeg = require('fluent-ffmpeg')

const srcFolder = 'L:\\Music'

const getMetadata = (src) => {
  return new Promise((resolve, reject) => {
    ffmpeg(src)
      .ffprobe(function (err, metadata) {
        if (err) {
          reject(err)
        } else {
          resolve(metadata)
        }
      })
  })
}

const convertFile = (src, dest, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const { BPM, CUEPOINTS, INITIALKEY, TRAKTOR4 } = metadata.format.tags

    ffmpeg(src)
      .withNoVideo()
      .toFormat('mp3')
      .withAudioBitrate(320)
      .outputOptions('-map_metadata', 0)
      .outputOptions('-metadata', `TBPM=${BPM}`)
      .outputOptions('-metadata', `TKEY=${INITIALKEY}`)
    // .outputOptions('-metadata', `id3v2_priv.TRAKTOR4="${TRAKTOR4}"`)
    // .outputOptions('-metadata', `CUEPOINTS="${CUEPOINTS}"`)
      .on('end', function () {
        // console.log('done!')
        resolve(src)
      })
      .on('error', function (err) {
        console.log('an error happened: ' + err.message)
        reject(err)
      })
      .save(dest)
  })
}

const deleteFile = (src) => {
  const tempFile = fs.openSync(src, 'r')
  fs.closeSync(tempFile)
  fs.unlinkSync(src)
}

const fullFlowFile = (src) => {
  let dest = src.split('.')

  if (dest[dest.length - 1] === 'flac') {
    dest[dest.length - 1] = 'mp3'
    dest = dest.join('.')

    getMetadata(src).then((metadata) => {
      // console.log(metadata.format.tags)
      convertFile(src, dest, metadata).then(deleteFile)
    })
  } else {
    console.log('ERROR: not a flac file')
  }
}

const findAllByExtension = (src, extension) => {
  return new Promise((resolve, reject) => {
    glob(src + '/**/*.' + extension, {}, (err, files) => {
      if (err) {
        console.log('findAllByExtension ERROR', err)
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

findAllByExtension(srcFolder, 'flac').then((files) => {
  files.forEach(fullFlowFile)
  // files.forEach((file) => {
  // getMetadata(file).then((metadata) => {
  //   console.log(file, metadata.format.tags.INITIALKEY)
  // })
  // })
})
