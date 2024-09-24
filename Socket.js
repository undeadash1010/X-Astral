const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, Browsers } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const config = require("./config");
const { Boom } = require('@hapi/boom');
const { serialize, decodeJid } = require('./lib/message');
const { commands } = require("./lib/commands");
const config = require("./config");
const { connect } = require("./lib/session");
const store = makeInMemoryStore({ logger: P().child({ level: "silent", stream: "store" }) });

function loadPlugins() {
    console.log(chalk.yellow('Installing plugins...'));
    fs.readdirSync(__dirname + '/commands').forEach(plugin => {
        if (path.extname(plugin).toLowerCase() === '.js') {
            require(__dirname + '/commands/' + plugin);
            console.log(chalk.green(`Loaded plugin: ${plugin}`));
        }
    });
}

async function startBot() {
        const Microsoft = "./session";
        fs.mkdirSync(Microsoft, { recursive: true });
        let sessionId;
        sessionId = await connect();
    	const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, Microsoft), sessionId);
	const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: true
    });
    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
          }
        if (connection === 'connecting') {
            console.log(chalk.yellow('<=Connecting to WhatsAppBot...=>'));
        }
        if (connection === 'open') {
            console.log(chalk.green('<=Login done=>'));
         loadPlugins();
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Connection closed. Reconnecting...'), shouldReconnect);
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        if (messageUpdate.type !== 'notify') return;
        const msg = serialize(message, sock);
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
        if (msg.type === 'protocolMessage' || msg.type === 'senderKeyDistributionMessage' || !msg.type) return;
        const { from, body } = msg;
        console.log(chalk.blue(`=FROM=: ${msg.isGroup ? 'Group' : 'User'}: ${from} : =CONTENT=: ${body}`));
	    	sock.sendMessage(from, {
						text,
						contextInfo: { externalAdReply: { title: "Click", body: "x-astral", mediaType: 1, thumbnail: " ", mediaUrl: " ", sourceUrl: " " } },
					});
				};

				
	
		if (body.startsWith(config.PREFIX)) {
			const cmd_str = body.slice(config.PREFIX.length).trim().split(" ")[0];
			const command = commands.find(cmd => cmd.command === cmd_str);
			if (command) {
				const args = body
					.slice(config.PREFIX.length + cmd_str.length)
					.trim()
					.split(" ");
				try { await command.handler({
						msg,
						args,
						reply,
						isGroup,
					});
			
    });

    sock.ev.on('contacts.update', (update) => {
        for (let contact of update) {
	    let id = sock.decodeJid(contact.id);
            if (id && contact.notify) {
                console.log(chalk.magenta(`Contact updated: ${id} -> ${contact.notify}`));
            }    if (store && store.contacts) {
                store.contacts[id] = {
                    id,
                    name: contact.notify
                };
            }
        }
    });
}

startBot();
		
