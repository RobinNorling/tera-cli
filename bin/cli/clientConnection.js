const { ModManager, Dispatch, Connection, FakeClient } = require('tera-proxy-game');
const path = require('path');
const versions = require('./versions.json')
const servers = require('./servers.json')

class ClientConnection {
    constructor(settings, clientIndex, settingsDir, modsDir){
        this.log = require('log')(`client ${clientIndex+1}`);
        this.closed = false
        this.settings = settings
        this.clientIndex = clientIndex
        this.loaded = false
        //preload mods
        this.modManager = new ModManager({
            modsDir: path.join(__dirname, `../../${modsDir}`),
            settingsDir: path.join(__dirname, `../../${settingsDir}`),
            autoUpdate: settings.autoUpdateMods
        })
        this.dispatch = new Dispatch(this.modManager);
        this.dispatch.cli = true;
        this.connection = new Connection(this.dispatch, { classic: settings.region.split('-')[1] === 'CLASSIC' });
        this.client = null
        this.srvConn = null
        this.log.log(`${this.settings.region.toUpperCase()} -> ${this.settings.serverName} | v${versions[this.settings.region].patch/100} (protocol ${versions[this.settings.region].protocol})`)
    }
    preLoadMods(){
        return new Promise(async (resolve, reject)=>{
            await this.modManager.init()
            resolve()
        })
    }
    serverConnect(serverName) {
        const server = serverName ? serverName : this.settings.serverName;
        for(const data of servers) {
		    if(data.name.toLowerCase() === server) {
		    	this.server = {ip: data.ip, port: data.port};
		    }
        }
        this.client = new FakeClient(this.connection);
		this.srvConn = this.connection.connect(this.client, { host: this.server.ip, port: this.server.port });
        // load mods
        this.client.on('connect', () => {
            this.connection.dispatch.setProtocolVersion(versions[this.settings.region].protocol);
            this.dispatch.loadAll();
        })
        this.client.on('close', () => {
			this.closeClient();
		});
		this.srvConn.setTimeout(30 * 1000);
		this.srvConn.on('connect', () => {
		  	this.log.log(`connected to ${this.srvConn.remoteAddress}:${this.srvConn.remotePort}`);
		});
		this.srvConn.on('timeout', () => {
            this.log.error('connection timed out.');
            if(!this.reconnectTimer) {
            	this.reconnectTimer = setTimeout(() => { new this.prototype.constructor(this.settings, this.clientIndex, this.modManager.settingsDir, this.modManager.modsDir); }, 30 * 1000);
            }
            if(this.closed) this.closeClient();
		});
		this.srvConn.on('close', () => {
            if(this.closed) {
                this.log.log('disconnected.');
            	if(!this.reconnectTimer) {
            		this.reconnectTimer = setTimeout(() => { new this.prototype.constructor(this.settings, this.clientIndex, this.modManager.settingsDir, this.modManager.modsDir); }, 30 * 1000);
            	}
            }
		});
		this.srvConn.on('error', (err) => {
		  	this.log.warn(err);
		});
    }
    getConnectionSettings(){
        return this.settings
    }
    getClientIndex(settings){
        if (checkEqual(this.settings,settings)) return true
        else return false
    }
    currentConnection(){
        return `${this.settings.region.toUpperCase()}: ${this.settings.serverName} | ${this.settings.accountEmail}`
    }
    closeClient() {
        if (this.closed) return;
        this.closed = true;
        this.client.close();
        setImmediate(() => {
            process.exit();
        });
    }
}

function checkEqual(obj1, obj2){
    let values1 = Object.values(obj1),
        values2 = Object.values(obj2)
    if(values1.length != values2.length) return false
    for(let i=0; i<Object.keys(obj1).length; i++) {
        if(values1[i]!=values2[i]) return false
    }
    return true
}

module.exports = ClientConnection