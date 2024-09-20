const { default: makeWASocket, 
       useMultiFileAuthState,
       DisconnectReason,
       makeInMemoryStore,
       Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const Jimp = require('jimp');
const config = require('./config');
const { languages } = require('./data_store/languages.js');
const { commands } = require('./lib/commands');
const { serialised, decodeJid } = require('./lib/serialize');
const store = makeInMemoryStore({ logger: P().child({ level: "silent", stream: "store",}),});
const SESSION_FILE = path.join(__dirname, 'auth_info_baileys', 'creds.json');

async function Connect_Session() {
    if (fs.existsSync(SESSION_FILE)) return;
    const sessionId = config.SESSION_ID.replace("A-S-W-I-N-S-P-A-R-K-Y:", "");
    let sessionData = sessionId;
    if (sessionId.length < 30) {
        const { data } = await axios.get(`https://pastebin.com/raw/${sessionId}`);
        sessionId = Buffer.from(data, 'base64').toString('utf8');
    }
    fs.writeFileSync(SESSION_FILE, sessionId, 'utf8');
}

async function startBot() {
    await Connect_Session();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, SESSION_FILE));
    const storez = { contacts: {} };
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.windows('Firefox'),
        auth: state,
        getMessage: async () => {
            return {
                conversation: '⍗ owner is diego call me naxor'
            }
        }
    });
    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);    
    sock.ev.on('messages.upsert', async (m) => {
        const chalk = (await import('chalk')).default;
        const fetch = (await import('node-fetch')).default;
        if (m.type !== 'notify') return;
        const msg = await serialised(JSON.parse(JSON.stringify(m.messages[0])), m, sock);
        if (!msg.message) return;
        const sendd = msg.sender;
        const contact = store.contacts[sendd] || {};
        const author = contact.name || sendd.split('@')[0];     
        const messageMapping = {
            'conversation': () => msg.text,
            'imageMessage': () => msg.text,
            'videoMessage': () => msg.text,
            'extendedTextMessage': () => msg.text,
            'buttonsResponseMessage': () => m.message.buttonsResponseMessage.selectedButtonId,
            'listResponseMessage': () => m.message.listResponseMessage.singleSelectReply.selectedRowId,
            'templateButtonReplyMessage': () => m.message.templateButtonReplyMessage.selectedId
        };
        const msgType = msg.messageType;
        let body = '';
        if (messageMapping[msgType]) {
            body = messageMapping[msgType]();
        }          
        const creator = config.MODS;
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        if (isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Group: ${groupMetadata.subject}, Message: ${body}, Sender: ${msg.sender}`));
            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.mentionedJid) {
                const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid;
                const mentionedJidList = await Promise.all(
                    msg.message.extendedTextMessage.contextInfo.mentionedJid.map(async (jid) => {
                        const contact = await sock.onWhatsApp(jid);
                        return contact && contact[0] && contact[0].notify ? contact[0].notify : jid.split('@')[0];
                    })
                );      
                const reply = (text) => {
                    sock.sendMessage(
                        msg.key.remoteJid,  
                        {
                            text,  
                            contextInfo: { externalAdReply: { title: "Click", body: "x-astral", mediaType: 1,  
                            thumbnail: " ", mediaUrl: " ", sourceUrl: " ",  
                            }}
                        }
                    );
                }; 
                
                if (config.antilink) {
                    const cd_code = body.match(/https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{10,}/g);
                    if (cd_code && !msg.key.fromMe) {
                        const group_code = groupMetadata.inviteCode;
                        const gc_code = `https://chat.whatsapp.com/${group_code}`;
                        const groupAdmins = groupMetadata.participants
                            .filter(participant => participant.admin !== null)
                            .map(admin => admin.id);
                        if (!groupAdmins.includes(msg.sender)) { 
                            if (cd_code[0] !== gc_code) {
                                const Mzg_code = `*<===Alert===>*\n\n` +
                                    `⍗ @${msg.sender.split('@')[0]}: not_allowed\n\n` +
                                    `⍗ *Link*: ${cd_code[0]}\n\n` +
                                    `⍗ *Note*: unauthorized links\n` +
                                    `⍗  Adhere to gc_rules.`;                                   
                                await sock.sendMessage(from, { text: Mzg_code, mentions: [msg.sender] });
                                await sock.groupParticipantsUpdate(from, [msg.sender], 'remove');
                            }
                        }
                    }
                }
            } else {
                console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Chat: ${body}, Sender: ${msg.sender}`));
            }
            const isBotAdmin = msg.sender === sock.user.id;
            const mode_locked = config.MODS.includes(msg.sender);
            if (config.MODE === 'private') {
                if (!isBotAdmin && !mode_locked) return;
            } 
            if (config.MODE === 'public' && command.fromMe && !isBotAdmin) {
                return;
            } 
            const mention_cn = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.includes(sock.user.id);
            const rep = msg.message.extendedTextMessage?.contextInfo?.stanzaId && msg.message.extendedTextMessage.contextInfo.participant === sock.user.id;
            await sock.sendMessage(from, { text: reply }, { quoted: msg });
        }
        if (body.startsWith(`${config.PREFIX}eval`) || body.startsWith(`${config.PREFIX}$`) ||
            body.startsWith(`${config.PREFIX}>`) || body.startsWith(`${config.PREFIX}#`)) {
            const command_Type = body.charAt(config.PREFIX.length); 
            const code_Eval = body.slice(config.PREFIX.length + 2).trim();
            if (code_Eval === '') {
                await sock.sendMessage(from, { text: 'Provide_code to evaluate Example: !eval 2 + 2' });
                return;
            } 
            if (msg.sender === sock.user.id || config.MODS.includes(msg.sender)) {
                try { 
                    const timeout = 5000;
                    let result;
                    const compile_cd = new Promise((resolve, reject) => {
                        try { 
                            result = eval(code_Eval);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    });
                    result = await Promise.race([
                        compile_cd,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), timeout))
                    ]); 
                    const output = typeof result === 'string' ? result : require('util').inspect(result);
                    const trimmed = output.length > 2000 ? `${output.slice(0, 2000)}...` : output;
                    await sock.sendMessage(from, { text: `*OUTPUT*:\n${trimmed}` });
                } catch (error) {
                    await sock.sendMessage(from, { text: `${error.message}` });
                }
            }
        }
        const reacts = async (emoji) => {
            await sock.sendMessage(from, {
                react: {
                    text: emoji,
                    key: msg.key 
                }
            });
        };
        if (body.startsWith(config.PREFIX)) {
            const cmd_str = body.slice(config.PREFIX.length).trim().split(' ')[0];
            const command = commands.find(cmd => cmd.command === cmd_str);
            if (command) {
                const args = body.slice(config.PREFIX.length + cmd_str.length).trim().split(' ');
                try {  
                    await command.handler({
                        sock, msg, args, reply, isGroup, author, creator, groupMetadata, mentionedJid, mentionedJidList, groupAdmins, languages, reacts,
                        command: cmd_str,
                    });
                } catch (error) {}
            }
        }
    });
                                          
    if (body.startsWith(`${config.PREFIX}mute`)) {
        if (!isGroup) {
            await sock.sendMessage(from, { text: 'This command can only be used in groups' });
            return;
        } const isAdmin = groupMetadata.participants.some(participant => participant.id === msg.sender && participant.admin !== null);
        const isBotAdmin = groupMetadata.participants.some(participant => participant.id === sock.user.id && participant.admin !== null);
        if (!isAdmin) {
            await sock.sendMessage(from, { text: 'You must be an admin to use this command' });
            return;
        } if (!isBotAdmin) {
            await sock.sendMessage(from, { text: 'I must be an admin to execute this command' });
            return;
        }
        await sock.groupSettingUpdate(from, 'announcement');
    }
    sock.ev.on('group-participants.update', async (data) => {
        if (data.action === 'add') {
            const contact = await sock.onWhatsApp(data.participants[0]);
            if (!contact || !contact[0]) return;
            const contact_nemo = contact[0].notify || contact[0].jid.split('@')[0];
            const Messagei = `┌────\n` +
                `│ ⍗ *Welcome* @${contact'nemo}\n` +
                `│ ⍗ *We are excited X3*\n` +
                `└─────────────┘`;
            await sock.sendMessage(data.id, { text: Messagei, mentions: [data.participants[0]] });
        }
    });
    sock.ev.on('contacts.update', (update) => {
        update.forEach(contact => {
            const id = decodeJid(contact.id);
            storez.contacts[id] = contact.notify;
        });
    });
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('Connection closed. You are logged out');
            }
        }
        if (connection === 'open') {
            console.log('Bot is online');
        }
    });
}
startBot();
