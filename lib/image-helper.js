const request = require('request');
const fs = require('fs');
const svg2png = require("svg2png");
const zlib = require('zlib');

function convertSvgImage(svgImageFilename, svgRecolor, onComplete) {
  let outputFilenameWithoutExtension = svgImageFilename.substring(0, svgImageFilename.lastIndexOf('.'));

  // if we generated it before, just return it
  if (fs.existsSync(`${outputFilenameWithoutExtension}.png`)) {
    onComplete(null, `${outputFilenameWithoutExtension}.png`);
    return;
  }

  readAndConvertSvgToPng(outputFilenameWithoutExtension, 'png', svgRecolor, onComplete);
}

function readAndConvertSvgToPng(filenameWithoutExtension, extension, svgRecolor, onComplete) {
  var imageBuffer = fs.readFileSync(`${filenameWithoutExtension}.svg`);

  // some svg are compressed
  try {
    imageBuffer = zlib.gunzipSync(imageBuffer);
  } catch (e) { }

  if (svgRecolor) {
    let imageBufferAsString = imageBuffer.toString();
    imageBufferAsString = imageBufferAsString.replace('<path', `<path fill="${svgRecolor}"`);
    imageBuffer = Buffer.from(imageBufferAsString);
  }
  svg2png(imageBuffer, { width: 64, height: 64 })
    .then(buffer => fs.writeFile(`${filenameWithoutExtension}.png`, buffer, (convertError) => {
      if (convertError) {
        console.log(convertError);
        onComplete(convertError);
      } else {
        onComplete(null, `${filenameWithoutExtension}.${extension}`);
      }
    }))
    .catch(e => onComplete(e));
}

function downloadImage(imageUrl, outputFilenameWithoutExtension, svgRecolor, onComplete) {
  console.log('Downloading', imageUrl);
  request({
    url: imageUrl,
    encoding: null
  }, (err, res, body) => {
    if (err) {
      onComplete(err);
    } else {
      let extension;
      if (imageUrl.indexOf('.svg') > 0) {
        extension = 'svg';
      } else {
        extension = 'png';
      }
      fs.writeFile(`${outputFilenameWithoutExtension}.${extension}`, body, (saveErr) => {
        if (saveErr) {
          onComplete(saveErr);
        } else {
          if (extension === 'svg') {
            readAndConvertSvgToPng(outputFilenameWithoutExtension, extension, svgRecolor, onComplete);
          } else {
            onComplete(null, `${outputFilenameWithoutExtension}.${extension}`);
          }
        }
      });
    }
  });
}

module.exports = {
  convertSvgImage,
  downloadImage,
};