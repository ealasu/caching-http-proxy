let http = require('http');
let https = require('https');
let fs = require('fs');
let url = require('url');
let path = require('path');
let httpProxy = require('http-proxy');
let request = require('request');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let config = JSON.parse(fs.readFileSync('/etc/docker-proxy/config.json', 'utf8'));

let cacheDir = '/var/docker-proxy-cache';

let proxy = httpProxy.createProxyServer({
  target: config.target,
  secure: false
});

function handleRequest(req, res) {
  console.log('url: '+req.url);
  let uri = url.parse(req.url);
  let filename = path.join(cacheDir, uri.path.replace(new RegExp(/[:\/]/, 'g'), '__'));
  console.log('filename: '+filename);
  let stat = fs.existsSync(filename) && fs.statSync(filename);

  if (stat && stat.isFile()) {
    console.log('hit');
    fs.utimesSync(filename, NaN, NaN); // update file modification time to now
    res.writeHead(200, {
        'Content-Length': stat.size
    });
    let r = fs.createReadStream(filename);
    r.pipe(res);
  } else {
    console.log('miss');
    let url = config.target + uri.path;
    console.log('req url: '+url);
    let s = request({
      url: url,
      headers: req.headers
    });
    s.pipe(res);
    if (!uri.path.endsWith('/')) {
      console.log('writing');
      s.pipe(fs.createWriteStream(filename));
    }
  }
}

http.createServer(handleRequest).listen(80);
console.log("http listening on port 80")

https.createServer({
  key: fs.readFileSync('/etc/docker-proxy/app.key'),
  cert: fs.readFileSync('/etc/docker-proxy/app.crt')
}, handleRequest).listen(2222);
console.log("https listening on port 2222")

