import { smsg } from "./lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(r => setTimeout(r, ms))

global.processedMessages ||= new Map()
setInterval(() => {
const now = Date.now()
for (const [id, time] of global.processedMessages) {
if (now - time > 60000) global.processedMessages.delete(id)
}
}, 30000)

export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (!chatUpdate) return
this.pushMessage(chatUpdate.messages).catch(console.error)
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) return
const msgId = m.key?.id
if (!msgId) return
if (global.processedMessages.has(msgId)) return
global.processedMessages.set(msgId, Date.now())
if (m.key.fromMe) return
if (global.db.data == null) await global.loadDatabase()
try {
m = smsg(this, m) || m
if (!m) return
if (typeof m.text !== "string") m.text = ""
try {
const user = global.db.data.users[m.sender]
if (typeof user !== "object") global.db.data.users[m.sender] = {}
if (user) {
if (!("name" in user)) user.name = m.name
if (!("genre" in user)) user.genre = ""
if (!("birth" in user)) user.birth = ""
if (!("marry" in user)) user.marry = ""
if (!("description" in user)) user.description = ""
if (!("packstickers" in user)) user.packstickers = null
if (!("premium" in user)) user.premium = false
if (!("banned" in user)) user.banned = false
if (!("bannedReason" in user)) user.bannedReason = ""
} else global.db.data.users[m.sender] = {
name: m.name,
genre: "",
birth: "",
marry: "",
description: "",
packstickers: null,
premium: false,
banned: false,
bannedReason: ""
}
const chat = global.db.data.chats[m.chat]
if (typeof chat !== "object") global.db.data.chats[m.chat] = {}
if (chat) {
if (!("isBanned" in chat)) chat.isBanned = false
if (!("isMute" in chat)) chat.isMute = false
if (!("welcome" in chat)) chat.welcome = false
if (!("sWelcome" in chat)) chat.sWelcome = ""
if (!("sBye" in chat)) chat.sBye = ""
if (!("detect" in chat)) chat.detect = true
if (!("primaryBot" in chat)) chat.primaryBot = null
if (!("modoadmin" in chat)) chat.modoadmin = false
if (!("antiLink" in chat)) chat.antiLink = true
} else global.db.data.chats[m.chat] = {
isBanned: false,
isMute: false,
welcome: false,
sWelcome: "",
sBye: "",
detect: true,
primaryBot: null,
modoadmin: false,
antiLink: true
}
const settings = global.db.data.settings[this.user.jid]
if (typeof settings !== "object") global.db.data.settings[this.user.jid] = {}
if (settings) {
if (!("self" in settings)) settings.self = false
if (!("restrict" in settings)) settings.restrict = true
if (!("jadibotmd" in settings)) settings.jadibotmd = true
if (!("antiPrivate" in settings)) settings.antiPrivate = false
if (!("gponly" in settings)) settings.gponly = false
} else global.db.data.settings[this.user.jid] = {
self: false,
restrict: true,
jadibotmd: true,
antiPrivate: false,
gponly: false
}
} catch (e) {
if (opts?.debug) console.error(e)
}
const user = global.db.data.users[m.sender]
try {
const actual = user.name || ""
const nuevo = m.pushName || await this.getName(m.sender)
if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) user.name = nuevo
} catch (e) {}
const chat = global.db.data.chats[m.chat]
const settings = global.db.data.settings[this.user.jid]
const isROwner = [...global.owner.map(v => v.replace(/[^0-9]/g, "") + "@lid")].includes(m.sender)
const isOwner = isROwner || m.fromMe
const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, "") + "@lid").includes(m.sender) || user.premium == true
const isOwners = [this.user.jid, ...global.owner.map(v => v + "@lid")].includes(m.sender)
if (settings.self && !isOwners) return
if (settings.gponly && !isOwners && !m.chat.endsWith("g.us") && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return
if (opts["queque"] && m.text && !isPrems) await delay(5000)
if (m.isBaileys) return
let usedPrefix
let groupMetadata = {}
let participants = []
let userGroup = {}
let botGroup = {}
let isRAdmin = false
let isAdmin = false
let isBotAdmin = false
if (m.isGroup) {
try {
global.groupCache ||= new Map()
const cached = global.groupCache.get(m.chat)
if (cached && Date.now() - cached.time < 60000) {
groupMetadata = cached.data
} else {
groupMetadata = await this.groupMetadata(m.chat)
global.groupCache.set(m.chat, { data: groupMetadata, time: Date.now() })
}
participants = groupMetadata.participants || []
const userParticipant = participants.find(p => p.id === m.sender)
const botParticipant = participants.find(p => p.id === this.user.jid)
isRAdmin = userParticipant?.admin === "superadmin" || m.sender === groupMetadata.owner
isAdmin = isRAdmin || userParticipant?.admin === "admin"
isBotAdmin = botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin"
userGroup = userParticipant || {}
botGroup = botParticipant || {}
} catch (e) {
if (opts?.debug) console.error(e)
}
}
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "plugins")
const hasPrefix = global.prefix && m.text.startsWith(global.prefix)
for (const name in global.plugins) {
const plugin = global.plugins[name]
if (!plugin || plugin.disabled) continue
const __filename = join(___dirname, name)
if (typeof plugin.all === "function") {
try {
await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })
} catch (e) {
if (opts?.debug) console.error(e)
}
}
if (!hasPrefix && typeof plugin === "function") continue
plugin._regex ||= (() => {
const p = plugin.customPrefix || global.prefix
const arr = Array.isArray(p) ? p : [p]
return arr.map(v => v instanceof RegExp ? v : new RegExp(v.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")))
})()
const match = plugin._regex.map(r => [r.exec(m.text), r]).find(v => v[0])
if (typeof plugin.before === "function") {
if (await plugin.before.call(this, m, {
match,
conn: this,
participants,
groupMetadata,
userGroup,
botGroup,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename,
user,
chat,
settings
})) continue
}
if (typeof plugin !== "function") continue
if (!(usedPrefix = match?.[0]?.[0])) continue
const noPrefix = m.text.replace(usedPrefix, "")
let [command, ...args] = noPrefix.trim().split(" ").filter(Boolean)
let _args = noPrefix.trim().split(" ").slice(1)
let text = _args.join(" ")
command = (command || "").toLowerCase()
const fail = plugin.fail || global.dfail
const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
Array.isArray(plugin.command) ? plugin.command.some(c => c instanceof RegExp ? c.test(command) : c === command) :
plugin.command === command
global.comando = command
if (!isAccept) continue
if ((m.id.startsWith("NJX-") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return
if (chat.primaryBot && chat.primaryBot !== this.user.jid) {
const primaryBotConn = global.conns.find(c => c.user.jid === chat.primaryBot && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)
const primaryBotInGroup = participants.some(p => p.id === chat.primaryBot)
if (primaryBotConn && primaryBotInGroup || chat.primaryBot === global.conn.user.jid) throw !1
chat.primaryBot = null
}
if (chat?.isBanned && !isROwner) {
const aviso = `ꕥ El bot *${botname}* está desactivado en este grupo\n\n> ✦ Un *administrador* puede activarlo con el comando:\n> » *${usedPrefix}bot on*`.trim()
await m.reply(aviso)
return
}
if (user.banned && !isROwner) {
const mensaje = `ꕥ Estas baneado/a, no puedes usar comandos en este bot!\n\n> ● *Razón ›* ${user.bannedReason}\n\n> ● Si este Bot es cuenta oficial y tienes evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`.trim()
m.reply(mensaje)
return
}
const adminMode = chat.modoadmin || false
const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || pluginPrefix || m.text.slice(0, 1) === pluginPrefix || plugin.command
if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return
if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { fail("owner", m, this); continue }
if (plugin.rowner && !isROwner) { fail("rowner", m, this); continue }
if (plugin.owner && !isOwner) { fail("owner", m, this); continue }
if (plugin.premium && !isPrems) { fail("premium", m, this); continue }
if (plugin.group && !m.isGroup) { fail("group", m, this); continue }
else if (plugin.botAdmin && !isBotAdmin) { fail("botAdmin", m, this); continue }
else if (plugin.admin && !isAdmin) { fail("admin", m, this); continue }
if (plugin.private && m.isGroup) { fail("private", m, this); continue }
try {
await plugin.call(this, m, {
match,
usedPrefix,
noPrefix,
_args,
args,
command,
text,
conn: this,
participants,
groupMetadata,
userGroup,
botGroup,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename,
user,
chat,
settings
})
} catch (err) {
m.error = err
console.error(err)
} finally {
if (typeof plugin.after === "function") {
try {
await plugin.after.call(this, m, {
match,
usedPrefix,
noPrefix,
_args,
args,
command,
text,
conn: this,
participants,
groupMetadata,
userGroup,
botGroup,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename,
user,
chat,
settings
})
} catch (e) {
if (opts?.debug) console.error(e)
}
}
}
} catch (err) {
console.error(err)
} finally {
try {
if (!opts["noprint"]) await (await import("./lib/print.js")).default(m, this)
} catch (e) {}
}
}

global.dfail = (type, m, conn) => {
const msg = {
rowner: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋*`,
owner: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋*`,
mods: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖽𝖾𝗌𝖺𝗋𝗋𝗈𝗅𝗅𝖺𝖽𝗈𝗋𝖾𝗌 𝖮𝖿𝗂𝖼𝗂𝖺𝗅𝖾𝗌*`,
premium: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖫𝗈 𝖯𝗎𝖾𝖽𝖾𝗇 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝗋 𝖴𝗌𝗎𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆*`,
group: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌*`,
private: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈 𝖣𝖾𝗅 𝖡𝗈𝗍*`,
admin: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌*`,
botAdmin: `*𝖭𝖾𝖼𝖾𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇 𝖯𝖺𝗋𝖺 𝖴𝗌𝖺𝗋 𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈*`,
unreg: `*𝖭𝗈 𝖤𝗌𝗍𝖺𝗌 𝖱𝖾𝗀𝗂𝗌𝗍𝗋𝖺𝖽𝗈, 𝖴𝗌𝖺 .𝗋𝖾𝗀 (𝗇𝖺𝗆𝖾) 19*`,
restrict: `*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖠𝗁 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋*`
}[type]
if (msg) return conn.reply(m.chat, msg, m, rcanal).then(_ => m.react("✖️"))
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.magenta("Se actualizo 'handler.js'"))
if (global.reloadHandler) console.log(await global.reloadHandler())
})