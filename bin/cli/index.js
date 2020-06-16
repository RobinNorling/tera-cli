const ClientConnection = require('./clientConnection.js')
const path = require('path');
const log = require('log')('client');
const config = require('../../config.json');
const clientConnections = [];
const updatedFolders = [];

async function init() {
	if(config.autoUpdate) {
		log.info('Checking for updates')
		try {
			  if(await (new (require('updater'))).update({
					dir: path.join(__dirname, '../../'),
					manifestUrl: `https://raw.githubusercontent.com/RobinNorling/tera-cli/master/manifest.json`,
					defaultUrl: `https://raw.githubusercontent.com/RobinNorling/tera-cli/master/`,
			})) {
				log.info('TERA Client has been updated. Please restart it to apply changes.');
        		process.exit();
			}
			log.info('Client is up to date')
		}
		catch(e) {
			  log.error('Error checking for updates:')
			  if(e.request) log.error(e.message)
				else log.error(e)
		}
	}
}
init();

// OCI enviornment config
if(process.env.environment==='oci'){
	log.info("tera-client set to run in OCI mode.")
	let settings = {
		autoUpdate: JSON.parse(process.env.autoUpdate),
		autoUpdateMods: JSON.parse(process.env.autoUpdateMods),
		accountEmail: process.env.accountEmail,
		accountPassword: process.env.accountPassword,
		region: process.env.region,
		serverName: process.env.serverName,
		characterName: process.env.characterName
	}
	start(settings)
} else {
	let clientIndex = 0;
	const waitStart = Date.now();
	for(const client of config.clients) {
		let settings = null;
		try {
			settings = require(`../../${client.settingsDir}/client.json`);
		} catch(e) {
			log.error("Settings not found! Run the configurator to fix this error.");
			process.exit(1);
		}
		start(settings, clientIndex, client.settingsDir, client.modsDir, { start: waitStart, index: clientIndex });
		clientIndex++;
	}
}

function sleep_until(time) {
	const now = Date.now();
	return new Promise(function(resolve) { return setTimeout(resolve, (time - now) > 0 ? (time - now) : 0); });
}

// Settings Loaded
async function start(settings, clientIndex, settingsDir, modsDir, wait) {
	if(settings.autoUpdateMods) {
		if(updatedFolders.includes(modsDir)) {
			settings.autoUpdateMods = false;
		} else {
			updatedFolders.push(modsDir);
		}
	}
	clientConnections[clientIndex] = new ClientConnection(settings, clientIndex, settingsDir, modsDir, config.reconnectTimeout);
	await clientConnections[clientIndex].preLoadMods();
	if(wait && wait.start > 0 && wait.index > 0) {
		await sleep_until(wait.start + (wait.index * (Math.random() * 3350 + 5130)));
	}
	clientConnections[clientIndex].serverConnect();
}

module.exports = clientConnections;