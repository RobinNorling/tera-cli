'use strict'

const fs = require('fs'),
	path = require('path'),
	crypto = require('crypto')

const startTime = Date.now()

const override = {
	"node_modules/tera-auth-ticket/node_modules/.bin/acorn": "Bzg9zCzzrwjsxHBtNN3rsluL3/HWyEm4XAEqQ9v/AeE=",
	"node_modules/tera-auth-ticket/node_modules/.bin/escodegen": "fh3Fu9AXKaE2kb/qI25QN7/Ng3pWuU2a9Ah2xvRyZ1c=",
	"node_modules/tera-auth-ticket/node_modules/.bin/esgenerate": "toxJREL/KpBHiA3o91BIiHftHWn0i/TNS9tnYA7Gbos=",
	"node_modules/tera-auth-ticket/node_modules/.bin/esvalidate": "kd/ru/twubA4t4fvLFZgEjOJDKPQskyTkmO5fJMt30k=",
	"node_modules/tera-auth-ticket/node_modules/.bin/esparse": "euqqHSFFCZXKMgmaRlkJZ8SltPjFuPjTTUw2mZUaVMg=",
	"node_modules/tera-auth-ticket/node_modules/.bin/sshpk-verify": "D/msZna4DzsT20b1pI2FZi6myufaYAHiDJbzw58JZRk=",
	"node_modules/tera-auth-ticket/node_modules/.bin/sshpk-sign": "K7hm2ZLQOnGsyz1jVDNe3Zlf7GpF9KOK2s/d1x2l+zY=",
	"node_modules/tera-auth-ticket/node_modules/.bin/sshpk-conv": "LCF3uS2nZR3AqDmPUIbvC6Ai8xDzf4jwG97Qp3il+uU=",
	"node_modules/tera-auth-ticket/node_modules/.bin/uuid": "6QOCrqfPs9EnyWTjgyoGdx3/PcLpm0kmi3+FLO0OV9c="
}

let count = 0

function generate(base) {
	const manifest = {}
	addDir(manifest, base, '')
	delete manifest['manifest.json']
	return manifest
}

function addDir(manifest, base, relDir) {
	const absDir = path.join(base, relDir)

	for(let file of fs.readdirSync(absDir))
		if(file !== '.git') {
			const absFile = path.join(absDir, file),
				relFile = relDir ? `${relDir}/${file}` : file

			if(fs.lstatSync(absFile).isDirectory()) addDir(manifest, base, relFile)
			else if(relFile != 'genmanifest.js') {
				manifest[relFile] = override[relFile] ? override[relFile] : crypto.createHash('sha256').update(fs.readFileSync(absFile)).digest().toString('base64')
				count++
			}
		}
}

const base = process.argv[2],
	manifest = { data: generate(base) }

console.log(`Added ${count} file(s) in ${Date.now() - startTime}ms`)

fs.writeFileSync(path.join(base, 'manifest.json'), JSON.stringify(manifest, null, '\t'))

console.log('Done!')