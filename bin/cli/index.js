const ClientConnection = require('./clientConnection.js')
const path = require('path');
const log = require('log')('client');
const config = require('../../config.json')

async function init(){
	if(config.autoUpdate) {
		log.info('Checking for updates')
		try {
			  if(await (new (require('updater'))).update({
					dir: path.join(__dirname, '../../'),
					manifestUrl: `https://raw.githubusercontent.com/RobinNorling/tera-cli/master/manifest.json`,
					defaultUrl: `https://raw.githubusercontent.com/RobinNorling/tera-cli/master/`,
			})) {
				//log.info('TERA Client has been updated. Please restart it to apply changes.')
				//return
				setTimeout(function () {
    				process.on("exit", function () {
        				require("child_process").spawn(process.argv.shift(), process.argv, { cwd: process.cwd(), detached : true, stdio: "inherit" });
        			});
        			process.exit();
        		}, 5000);
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
	for(const client of config.clients){
		try {
			start(require(`../../${client.settingsDir}/client.json`), clientIndex, client.settingsDir, client.modsDir)
		} catch(e) {
			log.error("Settings not found! Run the configurator to fix this error.");
			process.exit(1);
		}
		clientIndex++;
	}
}

// Settings Loaded
async function start(settings, clientIndex, settingsDir, modsDir){
	const clientConnection = new ClientConnection(settings, clientIndex, settingsDir, modsDir);
	await clientConnection.preLoadMods();
	clientConnection.serverConnect();
}