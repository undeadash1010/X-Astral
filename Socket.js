const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Jimp = require('jimp');
const config = require('./config');
const { languages } = require('./data_store/languages.js');
const { commands } = require('./lib/commands');
const { serialize, decodeJid } = require('./lib/message');
const session = require('./lib/session');
const store = makeInMemoryStore({ logger: P().child({ level: "silent", stream: "store" }) });

async function startBot() {
    const Dir = "./auth_info_baileys";
    await fs.mkdirSync(Dir, { recursive: true });
    await session();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, Dir));
    const storez = { contacts: {} };
    const sock = makeWASocket({
        logger: P({ level:'silent' }),
        printQRInTerminal: false,
        browser: Browsers.windows('Firefox'),
        auth: state,
        getMessage: async () => {
            return {
                conversation:'owner is diego call me naxor'
            }
        }
    });
    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const chalk = (await import('chalk')).default;
        const fetch = (await import('node-fetch')).default;
        if (m.type!== 'notify') return;
        const msg = await serialize(JSON.parse(JSON.stringify(m.messages[0])), m, sock);
        if (!msg.message) return;
        const sendd = msg.sender;
        const contact = store.contacts[sendd] || {};
        const author = contact.name || sendd.split('@')[0];
        let body = '';
        if (msg.message.conversation) body = msg.message.conversation;
        else if (msg.message.imageMessage) body = msg.message.imageMessage.caption || '';
        else if (msg.message.videoMessage) body = msg.message.videoMessage.caption || '';
        else if (msg.message.extendedTextMessage) body = msg.message.extendedTextMessage.text;
        else if (msg.message.buttonsResponseMessage) body = msg.message.buttonsResponseMessage.selectedButtonId;
        else if (msg.message.listResponseMessage) body = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        else if (msg.message.templateButtonReplyMessage) body = msg.message.templateButtonReplyMessage.selectedId;
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        if (isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Group: ${groupMetadata.subject}, Message: ${body}, Sender: ${msg.sender}`));
            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.mentionedJid) {
                const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid;
                const mentionedJidList = await Promise.all(
                    mentionedJid.map(async (jid) => {
                        const contact = await sock.onWhatsApp(jid);
                        if (!contact ||!contact[0]) return jid.split('@')[0];
                        return contact[0].notify || contact[0].jid.split('@')[0];
                    })
                );

                const reply = (text) => {
                    sock.sendMessage(from, {
                        text,
                        contextInfo: { externalAdReply: { title: "Click", body: "x-astral", mediaType: 1, thumbnail: " ", mediaUrl: " ", sourceUrl: " " } }
                    });
                };

                if (config.antilink) {
                    const cd_code = body.match(/https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{10,}/g);
                    if (cd_code &&!msg.key.fromMe) {
                        const group_code = groupMetadata.inviteCode;
                        const gc_code = `https://chat.whatsapp.com/${group_code}`;
                        const groupAdmins = groupMetadata.participants
                           .filter(participant => participant.admin!== null)
                           .map(admin => admin.id);
                        if (!groupAdmins.includes(msg.sender)) {
                            if (cd_code[0]!== gc_code) {
                                const Mzg_code = `*<===Alert===>*\n\n` +
                                    ` owner @${msg.sender.split('@')[0]}: not_allowed\n\n` +
                                    `*Link*: ${cd_code[0]}\n\n` +
                                    `*Note*: unauthorized links\n` +
                                    `*Adhere to gc_rules.`;
                                await sock.sendMessage(from, { text: Mzg_code });
                                await sock.groupParticipantsUpdate(from, [msg.sender], 'emove');
                            }
                        }
                    }
                }
            } else {
                console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Chat: ${body}, Sender: ${msg.sender}`));
            }
        }

        if (body.startsWith(`${config.PREFIX}eval`)) {
            const code_Eval = body.slice(config.PREFIX.length + 4).trim();
            if (!code_Eval) {
                await sock.sendMessage(from, { text: 'Provide code to evaluate Example:!eval 2 + 2' });
                return;
            }
            if (msg.sender === sock.user.id || config.MODS.includes(msg.sender)) {
                try {
                    let result = eval(code_Eval);
                    const output = typeof result === 'tring'? result : require('util').inspect(result);
                    const trimmed = output.length > 2000? `${output.slice(0, 2000)}...` : output;
                    await sock.sendMessage(from, { text: `*OUTPUT*:\n${trimmed}` });
                } catch (error) {
                    await sock.sendMessage(from, { text: `${error.message}` });
                }
            }
        }

        if (body.startsWith(config.PREFIX)) {
            const cmd_str = body.slice(config.PREFIX.length).trim().split(' ')[0];
            const command = commands.find(cmd => cmd.command === cmd_str);
            if (command) {
                const args = body.slice(config.PREFIX.length + cmd_str.length).trim().split(' ');
                try {
                    await command.handler({
                        sock, msg, args, reply, isGroup, author, groupMetadata, languages,
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        }
    });

    sock.ev.on('group-participants.update', async (data) => {
        if (data.action === 'add' || data.action === 'emove') {
            if (!data.id) return;
            const groupMetadata = await sock.groupMetadata(data.id);
            if (!groupMetadata) return;
            const contact = groupMetadata.participants.find((participant) => participant.id === data.participants[0]);
            if (!contact) return;
            const contact_nemo = contact.notify || contact.id.split('@')[0];
            const Msgi = `┌────\n│  owner *Welcome* @${contact_nemo}\n│  *We are excited X3*\n└─────────────┘`;
            const goodbyi = `┌────\n│  owner *Goodbye* @${contact_nemo}\n│  *We will miss you X3*\n└─────────────┘`;
            await sock.sendMessage(data.id, {
                text: data.action === 'add'? Msgi : goodbyi,
                mentions: [data.participants[0]]
            });
        }
    });

    sock.ev.on('contacts.update', (data) => {
        data.forEach(contact => {
            const id = decodeJid(contact.id);
            if (!storez.contacts[id]) storez.contacts[id] = { id };
            if (contact.notify) storez.contacts[id].name = contact.notify;
        });
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log("Connecting to WhatsApp...<=Please Wait=>");
        } else if (connection === 'open') {
            console.log("Login_done");
            fs.readdirSync(__dirname + "/commands").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() == ".js") {
                    require(__dirname + "/commands/" + plugin);
                }
            });
            console.log("Plugins Installed");
        } else if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut) {
                startBot();
                console.log("Reconnecting");
            } else {
                console.log("Connection closed_Device logged out=>");
                setTimeout(() => {
                    process.exit(0);
                }, 3000);
            }
        }
    });
}

startBot();
