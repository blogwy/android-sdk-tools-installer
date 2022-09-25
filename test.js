'use strict'

const {ok, strictEqual} = require('assert')
const {isAbsolute} = require('path')
const fs = require('fs')
const {spawnSync} = require('child_process')
const { getAndroidSdkToolsDir, getAndroidSdkToolsPath } = require('.')

console.info('1..10')

const adbPath = getAndroidSdkToolsPath('adb');
const fastbootPath = getAndroidSdkToolsPath('fastboot');
const toolsDir = getAndroidSdkToolsDir();

// absolute path
ok(isAbsolute(adbPath))
console.info('ok 1 -adb path is absolute')

ok(isAbsolute(fastbootPath))
console.info('ok 2 -fastboot path is absolute')

ok(isAbsolute(toolsDir))
console.info('ok 3 -tools dir is absolute')

// file dir
ok(fs.statSync(adbPath).isFile(adbPath))
console.info(`ok 4 - ${adbPath} is a file`)

ok(fs.statSync(fastbootPath).isFile(fastbootPath))
console.info(`ok 5 - ${fastbootPath} is a file`)

ok(fs.statSync(toolsDir).isDirectory(toolsDir))
console.info(`ok 6 - ${toolsDir} is a dir`)

// executable
fs.accessSync(adbPath, fs.constants.X_OK)
console.info(`ok 7 - ${adbPath} is executable`)

fs.accessSync(fastbootPath, fs.constants.X_OK)
console.info(`ok 8 - ${fastbootPath} is executable`)

// cmd
const { status: adbStatus } = spawnSync(adbPath, ['--help'], {
	stdio: ['ignore', 'ignore', 'pipe'],
})
strictEqual(adbStatus, 0)
console.info(`ok 9 - \`${adbPath} --help\` works`)

const { status: fastbootStatus } = spawnSync(fastbootPath, ['--help'], {
	stdio: ['ignore', 'ignore', 'pipe'],
})
strictEqual(fastbootStatus, 0)
console.info(`ok 10 - \`${fastbootPath} --help\` works`)
