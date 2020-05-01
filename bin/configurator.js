'use strict'

const fs = require('fs'),
	path = require('path'),
	readline = require('readline'),
	servers = require('./cli/servers.json')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
function question(q) { return new Promise(resolve => { rl.question(q, resolve) }) }

//Configure Global Settings
const configDir = path.join(__dirname, '../'),
	configFile = path.join(configDir, 'config.json')

let config = {
		autoUpdate: true,
		clients: [
			{settingsDir: "settings", modsDir: "mods"}
		]
}
try {
	config = Object.assign(config, JSON.parse(fs.readFileSync(configFile)))
}
catch(e) {
	if(!fs.existsSync(configDir)) fs.mkdirSync(configDir)
}

(async () => {
	console.log(`\n\x1b[4mGlobal Configuration:\x1b[0m`)
	config.autoUpdate = parseBool(await question(`Automatically update client? (${config.autoUpdate ? 'Y/n' : 'y/N'}): `), config.autoUpdate)
	// loop creating clients
	newClient(1)
	async function newClient(clientIndex) {
		if(!config.clients[clientIndex-1]) config.clients[clientIndex-1] = {settingsDir:"", modsDir:""}
		config.clients[clientIndex-1].settingsDir = keepDefault(await question(`Enter the settings directory for client ${clientIndex} (${config.clients[clientIndex-1].settingsDir}): `), config.clients[clientIndex-1].settingsDir)
		// check that clients aren't sharing Directories
		let currentSettingsDirs = config.clients.map((client)=>client.settingsDir)
		if (currentSettingsDirs.indexOf(config.clients[clientIndex-1].settingsDir)> -1 && currentSettingsDirs.indexOf(config.clients[clientIndex-1].settingsDir)!=clientIndex-1) {
			console.log('\x1b[31mError:\x1b[0m Clients cannot share settings directories.')
			newClient(clientIndex)
		}
		config.clients[clientIndex-1].modsDir = keepDefault(await question(`Enter the mods directory for client ${clientIndex} (${config.clients[clientIndex-1].modsDir}): `), config.clients[clientIndex-1].modsDir)
		let nextClient = config.clients[clientIndex]?true:false
		nextClient = parseBool(await question(`Add another client? (${nextClient ? 'Y/n' : 'y/N'})`), nextClient)
		if(nextClient) newClient(clientIndex+1)
		else {
			config.clients = config.clients.slice(0, clientIndex)
			fs.writeFileSync(configFile, JSON.stringify(config, null, '\t'))
			console.log(config)
			clientConfig()
		}
	}
})()


//Configure Client Settings

async function clientConfig(){
	let clientIndex = 1
	for (let client of config.clients) {
		console.log(`\n\x1b[4mConfiguration for client ${clientIndex}:\x1b[0m`)
		const settingsDir = path.join(__dirname, `../${client.settingsDir}`),
			settingsFile = path.join(settingsDir, 'client.json')
	
		let settings = {
				_version: 1,
				autoUpdateMods: true,
				accountEmail: "",
				accountPassword: "",
				region: "",
				serverName: "",
				characterName: ""
		}
	
		try {
			settings = Object.assign(settings, JSON.parse(fs.readFileSync(settingsFile)))
		}
		catch(e) {
			if(!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir)
		}
		settings.region = parseRegion( await question(`Region (${settings.region==='na'? 'NA/eu/ru' : settings.region==='eu'? 'na/EU/ru': settings.region==='ru'? 'na/eu/RU': 'na/eu/ru'}):`), settings.region)
		if(settings.region==="") clientConfig()
		settings.autoUpdateMods = parseBool(await question(`Automatically update mods? (${settings.autoUpdateMods ? 'Y/n' : 'y/N'}): `), settings.autoUpdateMods)
		settings.accountEmail = keepDefault( await question(`Account Email (${settings.accountEmail}): `), settings.accountEmail)
		settings.accountPassword = keepDefault( await question(`Account Password: `), settings.accountPassword)
		settings.serverName = parseServer( await question(`${serverList(settings.region)}Server(${settings.serverName!==""?currentServer(settings.serverName):""}):`), settings.serverName)
		settings.characterName = keepDefault( await question(`Character Name (${settings.characterName}): `), settings.characterName)
		fs.writeFileSync(settingsFile, JSON.stringify(settings, null, '\t'))
		clientIndex++
	}
	rl.close()
}
function currentServer(serverName) {
	for (let server of servers) {
		if (server.name.toLowerCase()===serverName) return servers.indexOf(server)+1
	}
}
function serverList(region){
	return servers.map((s, i)=>{
		if(s.region===region)return `${i+1}) ${s.name}\n`
	}).filter((s)=>s != null).join('')
}

function parseBool(str, def) {
	if(!str) return def
	return ['y', 'yes', 'true', '1'].includes(str.toLowerCase())
}

function parseServer(i, server) {
	if(!i)i = currentServer(server)
	try {
		return servers[i-1].name.toLowerCase()
	}
	catch(e){
		console.error(`Invalid Server!`)
		process.exit(1)
	}
}

function parseRegion(str, def) {
	if(!str) return def
	str = str.toLowerCase()
	switch(str){
		case "na": return str
		case "eu": return str
		case "ru": return str
		default: 
			console.log(`\x1b[31mError:\x1b[0m Unsupported Region: ${str} (Supported Regions: NA/EU/RU)`)
			return ""
	}
}

function keepDefault(str, def) {
	if(!str) return def
	return str
}