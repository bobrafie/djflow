'use strict'

const fs = require('fs')
const glob = require('glob')
const ffmpeg = require('fluent-ffmpeg')
const Batch = require('batch')

const srcFolder = 'L:\\Music'
const srcExtension = 'flac'

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
  return new Promise((resolve) => {
    const tempFile = fs.openSync(src, 'r')
    fs.closeSync(tempFile)
    fs.unlinkSync(src)
    resolve
  })
}

const fullFlowFile = (src) => {
  return new Promise((resolve, reject) => {
    let dest = src.split('.')

    if (dest[dest.length - 1] === srcExtension) {
      dest[dest.length - 1] = 'mp3'
      dest = dest.join('.')

      getMetadata(src).then((metadata) => {
        // console.log(metadata.format.tags)
        convertFile(src, dest, metadata).then(deleteFile).then(resolve)
      })
    } else {
      console.log('ERROR: not a flac file')
      reject('not a flac file')
    }
  })
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

findAllByExtension(srcFolder, srcExtension).then((files) => {
  const batch = new Batch

  batch.concurrency(5)

  files.forEach((file) => {
    batch.push(function(done){
      // console.log(file)
      // setTimeout(done, 2000)
      fullFlowFile(file).then(done)
    })
  })

  batch.on('progress', function(e){
    process.stdout.write(`${e.percent}%\r`)
  });
  
  batch.end(function(err){
    process.stdout.write('done!\r\n')
  });
  

  // files.forEach((file) => {
  // getMetadata(file).then((metadata) => {
  //   console.log(file, metadata.format.tags.INITIALKEY)
  // })
  // })
})
