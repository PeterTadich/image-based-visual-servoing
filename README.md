# image-based-visual-servoing
image based visual servoing

## Dependencies

There are 4 dependencies 'central-camera', 'FischerTechnik', 'controller-interface' and 'matrix-computations'.

```bash
https://github.com/PeterTadich/central-camera
https://github.com/PeterTadich/FischerTechnik
https://github.com/PeterTadich/controller-interface
https://github.com/PeterTadich/matrix-computations
```

## Installation

### Node.js

```bash
npm install https://github.com/PeterTadich/image-based-visual-servoing
```

### Google Chrome Web browser

No installation required for the Google Chrome Web browser.

## How to use

### Node.js

```js
import * as ibvs from 'image-based-visual-servoing';
```

### Google Chrome Web browser

```js
import * as ibvs from './ibvs.mjs';
```

## Examples

### Node.js (server side)

Copy the following code to mini-server.js

```js
//ref: https://www.w3schools.com/nodejs/nodejs_url.asp
var http = require('http');
var url = require('url');
var fs = require('fs');

http.createServer(function (req, res) {
  var q = url.parse(req.url, true);
  var filename = "." + q.pathname;
  fs.readFile(filename, function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");
    } 
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    return res.end();
  });
}).listen(8080); 
```

Copy the following code to IR3.html

```html
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset=utf-8>
        <title>IR3</title>
        <script type="module" src="IR3.mjs"></script>
    </head>
    <body>
        <video controls="true" autoplay="true" id="videoElement"></video>
        <canvas></canvas>
        <script type="text/javascript">
            //REF: https://www.kirupa.com/html5/accessing_your_webcam_in_html5.htm
            var video = document.querySelector("#videoElement");
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
            if(navigator.getUserMedia) {
                navigator.getUserMedia({video: true}, handleVideo, videoError);
            }
            function handleVideo(stream) {
                //video.src = window.URL.createObjectURL(stream); //FireFox
                video.srcObject=stream; //Chrome
            }
            function videoError(e) {
                // do something
            }
        </script>
        <script type="text/javascript">
            // ref: https://html5multimedia.com/code/ch9/video-canvas-screenshot.html
            // Get handles on the video and canvas elements
            var video = document.querySelector('video');
            var canvas = document.querySelector('canvas');
            // Get a handle on the 2d context of the canvas element
            var context = canvas.getContext('2d');
            // Define some vars required later
            var w, h, ratio;
            // Add a listener to wait for the 'loadedmetadata' state so the video's dimensions can be read
            video.addEventListener('loadedmetadata', function() {
                // Calculate the ratio of the video's width to height
                ratio = video.videoWidth / video.videoHeight;
                // Define the required width as 100 pixels smaller than the actual video's width
                w = video.videoWidth - 0;
                // Calculate the height based on the video's width and the ratio
                h = parseInt(w / ratio, 10);
                // Set the canvas width and height to the values just calculated
                canvas.width = w;
                canvas.height = h;
            }, false); 
        </script>
    </body>
</html>
```

Copy the following code to IR3.mjs

```js
import * as rcim from './node_modules/controller-interface/rcim.mjs';
import * as IBVS from './node_modules/image-based-visual-servoing/IBVS.mjs';

rcim.II30402();
IBVS.IBVS();
```

Then run:

```bash
npm init -y
npm install https://github.com/PeterTadich/image-based-visual-servoing
```

Added the following code to the package.json file

```js
  "main": "mini-server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node --experimental-modules mini-server.js"
  },
  "type": "module",
```

Full package.json file example

```js
{
  "name": "ibvs_rev01",
  "version": "1.0.0",
  "description": "IBVS example",
  "main": "mini-server.js",
    "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node --experimental-modules mini-server.js"
  },
  "type": "module",
  "author": "Peter Tadich",
  "license": "MIT",
  "dependencies": {
    "image-based-visual-servoing": "git+https://github.com/PeterTadich/image-based-visual-servoing.git"
  }
}
```

Modify the path to all modules (with-in the 'node_modules' directory). For example, give the path to the 'matrix-computations' file:

```js
//from:
import * as hlao from 'matrix-computations';
//to:
import * as hlao from '../matrix-computations/hlao.mjs';
```

Now try:

```bash
npm start
```

Start your local server and goto port 8080.

## License

[MIT](LICENSE)