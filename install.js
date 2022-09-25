'use strict'

var fs = require("fs-extra");
var path = require("path");
var os = require("os");
var child_process = require("child_process");
const {encode: encodeQuery} = require('querystring');
const {strictEqual} = require('assert');
const envPaths = require('env-paths');
const FileCache = require('@derhuerst/http-basic/lib/FileCache').default;
var ProgressBar = require("progress");
var request = require('@derhuerst/http-basic');
const {pipeline} = require('stream');
const extract = require('extract-zip');
var pkg = require("./package");
var toolsPath = '';

const exitOnError = (err) => {
  console.error(err)
  process.exit(1)
}

let agent = false
// https://github.com/request/request/blob/a9557c9e7de2c57d92d9bab68a416a87d255cd3d/lib/getProxyFromURI.js#L66-L71
const proxyUrl = (
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy
)
if (proxyUrl) {
  const HttpsProxyAgent = require('https-proxy-agent')
  const {hostname, port, protocol} = new URL(proxyUrl)
  agent = new HttpsProxyAgent({hostname, port, protocol})
}

// https://advancedweb.hu/how-s3-signed-urls-work/
const normalizeS3Url = (url) => {
  url = new URL(url)
  if (url.hostname.slice(-17) !== '.s3.amazonaws.com') return url.href
  const query = Array.from(url.searchParams.entries())
  .filter(([key]) => key.slice(0, 6).toLowerCase() !== 'x-amz-')
  .reduce((query, [key, val]) => ({...query, [key]: val}), {})
  url.search = encodeQuery(query)
  return url.href
}
strictEqual(
  normalizeS3Url('https://example.org/foo?bar'),
  'https://example.org/foo?bar'
)
strictEqual(
  normalizeS3Url('https://github-production-release-asset-2e65be.s3.amazonaws.com/29458513/26341680-4231-11ea-8e36-ae454621d74a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20200405%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20200405T225358Z&X-Amz-Expires=300&X-Amz-Signature=d6415097af04cf62ea9b69d3c1a421278e96bcb069afa48cf021ec3b6941bae4&X-Amz-SignedHeaders=host&actor_id=0&response-content-disposition=attachment%3B%20filename%3Ddarwin-x64&response-content-type=application%2Foctet-stream'),
  'https://github-production-release-asset-2e65be.s3.amazonaws.com/29458513/26341680-4231-11ea-8e36-ae454621d74a?actor_id=0&response-content-disposition=attachment%3B%20filename%3Ddarwin-x64&response-content-type=application%2Foctet-stream'
)

const cache = new FileCache(envPaths(pkg.name).cache)
cache.getCacheKey = (url) => {
  return FileCache.prototype.getCacheKey(normalizeS3Url(url))
}

const noop = () => {}
function downloadFile(url, destinationPath, progressCallback = noop) {
  let fulfill, reject;
  let totalBytes = 0;

  const promise = new Promise((x, y) => {
    fulfill = x;
    reject = y;
  });

  request('GET', url, {
    agent,
    followRedirects: true,
    maxRedirects: 3,
    cache,
    timeout: 30 * 1000, // 30s
    retry: true,
  }, (err, response) => {
    if (err || response.statusCode !== 200) {
      err = err || new Error('Download failed.')
      if (response) {
        err.url = response.url
        err.statusCode = response.statusCode
      }
      reject(err)
      return;
    }

    pipeline(
      response.body,
      fs.createWriteStream(destinationPath),
      (err) => {
        if (err) {
          err.url = response.url
          err.statusCode = response.statusCode
          reject(err)
        } else fulfill()
      }
    )

    if (!response.fromCache && progressCallback) {
      const cLength = response.headers["content-length"]
      totalBytes = cLength ? parseInt(cLength, 10) : null
      response.body.on('data', (chunk) => {
        progressCallback(chunk.length, totalBytes);
      });
    }
  });

  return promise;
}

let progressBar = null;
function onProgress(deltaBytes, totalBytes) {
  if (process.env.CI) return;
  if (totalBytes === null) return;
  if (!progressBar) {
    progressBar = new ProgressBar(`Downloading android-sdk-tools ${releaseName} [:bar] :percent :etas `, {
      complete: "|",
      incomplete: " ",
      width: 20,
      total: totalBytes
    });
  }

  progressBar.tick(deltaBytes);
}

function checkToolsDir(toolsPath) {
  if (!fs.existsSync(toolsPath)) return false;
  const adbCmd = `${path(toolsPath, 'adb')} --help`;
  const fastbootCmd = `${path(toolsPath, 'fastboot')} --help`;
  try {
    child_process.execSync(adbCmd);
    child_process.execSync(fastbootCmd);
    return true;
  } catch (error) {
    // remove sdk dir
    fs.removeSync(toolsPath);
    return false;
  }
}

function chmodDirSync(target, mode) {
  console.log(target)
  const fsStat = fs.statSync(target);
  const isDir = fsStat.isDirectory();
  if (isDir) {
    const dirArr = fs.readdirSync(target);
    console.log(dirArr);
    for (let index = 0; index < dirArr.length; index++) {
      const src = dirArr[index];
      chmodDirSync(path.join(target, src), mode);
    }
  } else {
    fs.chmodSync(target, mode)
  }
}

const release = (
  process.env.ANDROID_SDK_TOOLS_BINARIES_RELEASE ||
  pkg['android-sdk-tools-installer']['binary-release-tag']
)
const releaseName = (
  pkg['android-sdk-tools-installer']['binary-release-name'] ||
  release
)
const platform = process.env.npm_config_platform || os.platform()
const downloadsUrl = (
	process.env.ANDROID_SDK_TOOLS_BINARIES_URL ||
	'https://github.com/blogwy/android-sdk-tools-installer/releases/download'
)
const baseUrl = `${downloadsUrl}/${release}`;
const downloadUrl = `${baseUrl}/${platform}.zip`;

toolsPath = path.join(__dirname, platform);

const res = checkToolsDir(toolsPath);

if (!res) {
  downloadFile(downloadUrl, `${toolsPath}.zip`, onProgress)
    .then(async () => {
      console.log('success')
      // extract
      await extract(`${toolsPath}.zip`, { dir: toolsPath });
      // move
      const dirArr = fs.readdirSync(toolsPath);
      if (dirArr.length === 1) {
        const src = path.join(toolsPath, dirArr[0]);
        fs.copySync(src, toolsPath, { overwrite: true });
        fs.removeSync(src);
      }
      // chmod
      chmodDirSync(toolsPath, 0o755);
      // del origin
      fs.removeSync(`${toolsPath}.zip`);
    })
    .catch(exitOnError)
}

