import { smsg } from "./lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (!chatUpdate) return
this.pushMessage(chatUpdate.messages).catch(console.error)
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) return

global.processedMessages ||= new Set()
const msgId = m.key?.id
if (!msgId) return
if (global.processedMessages.has(msgId)) return
global.processedMessages.add(msgId)
setTimeout(() => global.processedMessages.delete(msgId), 60000)

if (m.key.fromMe) return
if (global.db.data == null)
await global.loadDatabase()

try {
m = smsg(this, m) || m
if (!m) return

try {
const user = global.db.data.users[m.sender]
if (typeof user !== "object") {
global.db.data.users[m.sender] = {}
}
if (user) {
if (!("name" in user)) user.name = m.name
if (!("premium" in user)) user.premium = false
if (!("premiumTime" in user)) user.premiumTime = 0
if (!("banned" in user)) user.banned = false
if (!("bannedReason" in user)) user.bannedReason = ""
if (!("afk" in user) || !isNumber(user.afk)) user.afk = -1
if (!("afkReason" in user)) user.afkReason = ""
if (!("warn" in user) || !isNumber(user.warn)) user.warn = 0
} else global.db.data.users[m.sender] = {
name: m.name,
premium: false,
premiumTime: 0,
banned: false,
bannedReason: "",
afk: -1,
afkReason: "",
warn: 0
}

const chat = global.db.data.chats[m.chat]
if (typeof chat !== "object") {
global.db.data.chats[m.chat] = {}
}
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
if (!("nsfw" in chat)) chat.nsfw = false
} else global.db.data.chats[m.chat] = {
isBanned: false,
isMute: false,
welcome: false,
sWelcome: "",
sBye: "",
detect: true,
primaryBot: null,
modoadmin: false,
antiLink: true,
nsfw: false
}

const settings = global.db.data.settings[this.user.jid]
if (typeof settings !== "object") {
global.db.data.settings[this.user.jid] = {}
}
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
console.error(e)
}

if (typeof m.text !== "string") m.text = ""
const user = global.db.data.users[m.sender]

try {
const actual = user.name || ""
const nuevo = m.pushName || await this.getName(m.sender)
if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) {
user.name = nuevo
}} catch {}

const chat = global.db.data.chats[m.chat]
const settings = global.db.data.settings[this.user.jid]

const isROwner = [...global.owner.map(v => v)].map(v => v.replace(/[^0-9]/g, "") + "@lid").includes(m.sender)
const isOwner = isROwner || m.fromMe
const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, "") + "@lid").includes(m.sender) || user.premium === true
const isOwners = [this.user.jid, ...global.owner.map(v => v + "@lid")].includes(m.sender)

if (settings.self && !isOwners) return
if (settings.gponly && !isOwners && !m.chat.endsWith("g.us")) return

if (opts["queque"] && m.text && !isPrems) {
const queque = this.msgqueque, time = 1000 * 5
const previousID = queque[queque.length - 1]
queque.push(m.id || m.key.id)
setInterval(async function () {
if (queque.indexOf(previousID) === -1) clearInterval(this)
await delay(time)
}, time)
}

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
isRAdmin = userParticipant?.admin === "superadmin" || m.sender === groupMetadata.owner
isAdmin = isRAdmin || userParticipant?.admin === "admin"

const botParticipant = participants.find(p => p.id === this.user.jid)
isBotAdmin = botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin"

userGroup = userParticipant || {}
botGroup = botParticipant || {}
} catch (e) {
console.error(e)
}
}

const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "plugins")

for (const name in global.plugins) {
const plugin = global.plugins[name]
if (!plugin || plugin.disabled) continue
const __filename = join(___dirname, name)

if (typeof plugin.all === "function") {
try {
await plugin.all.call(this, m, {
chatUpdate,
__dirname: ___dirname,
__filename,
user,
chat,
settings
})
} catch (err) {
console.error(err)
}
}

if (typeof plugin !== "function") continue

const pluginPrefix = plugin.customPrefix || conn.prefix || global.prefix
const match = pluginPrefix instanceof RegExp
? [[pluginPrefix.exec(m.text), pluginPrefix]]
: [[new RegExp("^" + pluginPrefix).exec(m.text), pluginPrefix]]

if (!match) continue

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

if ((usedPrefix = (match[0] || "")[0])) {
const noPrefix = m.text.replace(usedPrefix, "")
let [command, ...args] = noPrefix.trim().split(" ")
let text = args.join(" ")
command = command.toLowerCase()

const isAccept = Array.isArray(plugin.command)
? plugin.command.includes(command)
: plugin.command === command

if (!isAccept) continue
m.plugin = name

if (chat.isBanned && !isROwner) {
await m.reply("🚫 El bot está desactivado en este grupo")
return
}

if (user.banned && !isROwner) {
await m.reply(`🚫 Estás baneado\n📌 Razón: ${user.bannedReason}`)
return
}

if (plugin.owner && !isOwner) continue
if (plugin.premium && !isPrems) continue
if (plugin.group && !m.isGroup) continue
if (plugin.botAdmin && !isBotAdmin) continue
if (plugin.admin && !isAdmin) continue
if (plugin.private && m.isGroup) continue

try {
await plugin.call(this, m, {
conn: this,
args,
text,
command,
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
console.error(err)
}
}
}
} catch (err) {
console.error(err)
} finally {
try {
if (!opts["noprint"]) await (await import("./lib/print.js")).default(m, this)
} catch {}
}
}

global.dfail = (type, m, conn) => {
const msg = {
owner: "*Este comando solo puede ser usado por mi creador*",
premium: "*Este comando es solo para usuarios premium*",
group: "*Este comando solo funciona en grupos*",
admin: "*Este comando es solo para administradores*",
botAdmin: "*Necesito ser admin para ejecutar este comando*"
}[type]
if (msg) conn.reply(m.chat, msg, m)
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.magenta("Se actualizó 'handler.js'"))
if (global.reloadHandler) console.log(await global.reloadHandler())
})