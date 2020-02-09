// const replaceInFile = require('replace-in-file')
const csvWriter = require('csv-write-stream')
const JSONStream = require('JSONStream')
const es = require('event-stream')
const fs = require('fs')
const path = require('path')

const filePaths = process.argv.slice(2)

function getJSONStream(jsonPath) {
  const firstChar = head(jsonPath, 1, 1)
  const stream = fs.createReadStream(jsonPath, {
    encoding: 'utf8'
  })
  const parser = JSONStream.parse(firstChar === '[' ? '..data' : 'data')
  return stream.pipe(parser)
}

function fixJSON(jsonPath) {
  return Promise.resolve()
  // TODO: fix JSON
  // return replaceInFile({
  //   files: jsonPath,
  //   from: /(\['{"|"?}'\]|'{"?|}',)/g,
  //   to: match => {
  //     return match.replace("'", '')
  //   },
  //   countMatches: true
  // })
}

for (const filePath of filePaths) {
  const jsonPath = path.resolve(__dirname, filePath)
  const exists = fs.existsSync(jsonPath)
  if (!exists) {
    console.error(`File ${jsonPath} doesn't exist`)
    return
  }

  fixJSON(jsonPath).then(() => {
    const csvFilePath = path.resolve(__dirname, `${path.basename(jsonPath, path.extname(jsonPath))}.csv`)
    const writer = csvWriter({
      sendHeaders: !fs.existsSync(csvFilePath),
      headers: [
        'longitude',
        'latitude',
        'direccion',
        'rol',
        'nombrecomuna',
        'codigo_sii'
      ]
    })
    writer.pipe(
      fs.createWriteStream(csvFilePath, {
        flags: 'a'
      })
    )
    getJSONStream(jsonPath)
      .on('data', data => {
        if (!data) {
          return
        }
        writer.write({
          longitude: data.ubicacionY,
          latitude: data.ubicacionX,
          direccion: data.direccion,
          rol: data.rol,
          nombrecomuna: data.nombreComuna,
          codigo_sii: data.comuna
        })
      })
      .on('end', err => {
        writer.end()
      })
      .on('error', err => {
        console.error(err)
      })
  })
}

// unix head command
function head(file, lines, maxBuffer) {
  lines = lines || 10
  maxBuffer = maxBuffer || lines * 1000
  var stats = fs.statSync(file)
  var upToMax = Math.min(maxBuffer, stats.size)
  var fileDescriptor = fs.openSync(file, 'r')
  var buffer = Buffer.alloc(upToMax)
  fs.readSync(fileDescriptor, buffer, 0, upToMax, 0)
  var lineA = buffer.toString('utf8').split(/\r?\n/)
  lineA = lineA.slice(0, Math.min(lines, lineA.length))
  return lineA.join('\n')
}
