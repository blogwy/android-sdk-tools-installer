# android-sdk-tools-installer

**[android-sdk-tools](https://developer.android.com/studio/releases/platform-tools) static binaries for Mac OSX, Linux, Windows. This project is a fork of [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)**

## Installation

This module is installed via npm:

``` bash
$ npm install android-sdk-tools-installer
```

*Note:* During installation, it will download the appropriate `android-sdk-tools` binary from the [`33.0.3` GitHub release](https://github.com/blogwy/android-sdk-tools-installer/releases/tag/33.0.3)

## Custom binaries url

By default, the `android-sdk-tools` binary will get downloaded from `https://github.com/blogwy/android-sdk-tools-installer/releases/download`. To customise this, e.g. when using a mirror, set the `ANDROID_SDK_TOOLS_BINARIES_URL` environment variable.

```shell
export ANDROID_SDK_TOOLS_BINARIES_URL=https://ghproxy.com/https://github.com/blogwy/android-sdk-tools-installer/releases/download
```

## Custom Android SDK Tools Version

By default, the version downloaded by Android SDK Tools comes from the binary-release-tag value in the package.json file, of course you can customize。set the `ANDROID_SDK_TOOLS_BINARIES_RELEASE` environment variable. however, since it is downloaded from GitHub Release, the custom ANDROID_SDK_TOOLS_BINARIES_RELEASE value must be the existing tag name of GitHub Release

```shell
export ANDROID_SDK_TOOLS_BINARIES_RELEASE=https://ghproxy.com/https://github.com/blogwy/android-sdk-tools-installer/releases/download
```

## Electron & other cross-platform packaging tools

Because `android-sdk-tools` will download a binary specific to the OS/platform, you need to purge `node_modules` before (re-)packaging your app *for a different OS/platform* ([read more in #35](https://github.com/eugeneware/ffmpeg-static/issues/35#issuecomment-630225392)).

## Example Usage

``` js
var { getAndroidSdkToolsPath, getAndroidSdkToolsDir } = require('android-sdk-tools-installer');

console.log(getAndroidSdkToolsPath('adb'));
// /Users/j/playground/node_modules/android-sdk-tools-installer/darwin/adb

console.log(getAndroidSdkToolsPath('fastboot'));
// /Users/j/playground/node_modules/android-sdk-tools-installer/darwin/fastboot

console.log(getAndroidSdkToolsDir());
// /Users/j/playground/node_modules/android-sdk-tools-installer/darwin/


```

## Sources of the binaries

- [developer.android.com](https://developer.android.com/studio/releases/platform-tools)

## Thanks

- [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)
- [android-tools-bin](https://gitlab.com/ubports/installer/android-tools-bin)

