import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import fs from "fs"

const DIGITS = s => String(s || "").replace(/\D/g, "")

function lidParser(participants = []) {
  try {
    return participants.map(v => ({
      id:
        typeof v?.id === "string" &&
        v.id.endsWith("@lid") &&
        v.jid
          ? v.jid
          : v.id,
      admin: v?.admin ?? null,
      raw: v
    }))
  } catch {
    return participants || []
  }
}

const OWNER_NUMBERS = (global.owner || []).map(v =>
  DIGITS(Array.isArray(v) ? v[0] : v)
)

let ICON_BUFFER = null

async function getIconBuffer() {
  if (ICON_BUFFER) return ICON_BUFFER
  try {
    const r = await fetch("https://files.catbox.moe/u1lwcu.jpg")
    ICON_BUFFER = Buffer.from(await r.arrayBuffer())
    return ICON_BUFFER
  } catch {
    return null
  }
}

getIconBuffer()

function dialogContext() {
  if (!ICON_BUFFER) return {}
  return {
    contextInfo: {
      externalAdReply: {
        title: global.namebot || "𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍",
        body: global.author,
        thumbnail: ICON_BUFFER,
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  }
}

global.dfail = async (type, m, conn) => {
  const msg = {
    rowner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
    owner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
    mods: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖽𝖾𝗌𝖺𝗋𝗋𝗈𝗅𝗅𝖺𝖽𝗈𝗋𝖾𝗌",
    premium: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖫𝗈 𝖯𝗎𝖾𝖽𝖾𝗇 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝗋 𝖴𝗌𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆",
    group: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌",
    private: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈",
    admin: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌",
    botAdmin: "𝖭𝖾𝖼𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇",
    restrict: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖧𝖺 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈"
  }[type]

  if (!msg) return
  conn.sendMessage(m.chat, { text: msg }, { quoted: m, ...dialogContext() })
}

global.groupMetaCache ||= new Map()

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of global.groupMetaCache) {
    if (now - v.ts > 15000) global.groupMetaCache.delete(k)
  }
}, 30000)

export function handler(chatUpdate) {
  if (!chatUpdate?.messages) return
  for (const raw of chatUpdate.messages) handleMessage.call(this, raw)
}

async function handleMessage(m) {
  m = smsg(this, m)
  if (!m || m.isBaileys || !m.text) return

  const textMsg = m.text
  const prefixes =
    global._prefixCache ||
    (global._prefixCache = Object.freeze(
      Array.isArray(global.prefixes)
        ? global.prefixes
        : [global.prefix || "."]
    ))

  let usedPrefix = null
  let command = ""
  let args = []

  const fc = textMsg[0]

  if (prefixes.includes(fc)) {
    usedPrefix = fc
    const body = textMsg.slice(1).trim()
    if (!body) return
    args = body.split(/\s+/)
    command = (args.shift() || "").toLowerCase()
  } else {
    args = textMsg.trim().split(/\s+/)
    command = args.shift()?.toLowerCase() || ""
  }

  const senderNum = DIGITS(m.sender)
  const isROwner = OWNER_NUMBERS.includes(senderNum)
  const isOwner = isROwner || m.fromMe

  let groupMetadata
  let participants
  let isAdmin = false
  let isBotAdmin = !m.isGroup

  const loadGroupData = async () => {
    if (!m.isGroup) return
    let cached = global.groupMetaCache.get(m.chat)

    if (!cached || Date.now() - cached.ts > 15000) {
      const meta = await this.groupMetadata(m.chat)
      const raw = meta.participants || []
      const norm = lidParser(raw)
      const adminNums = new Set()

      for (let i = 0; i < raw.length; i++) {
        const r = raw[i]
        const n = norm[i]
        const adm =
          r?.admin === "admin" ||
          r?.admin === "superadmin" ||
          n?.admin === "admin" ||
          n?.admin === "superadmin"

        if (!adm) continue
        ;[r?.id, r?.jid, n?.id].forEach(x => {
          const d = DIGITS(x)
          if (d) adminNums.add(d)
        })
      }

      cached = { ts: Date.now(), meta, adminNums }
      global.groupMetaCache.set(m.chat, cached)
    }

    groupMetadata = cached.meta
    participants = groupMetadata.participants || []
    isAdmin = cached.adminNums.has(senderNum)
    isBotAdmin = cached.adminNums.has(DIGITS(this.user.jid))
  }

  for (const plugin of Object.values(global.plugins)) {
    if (!plugin || plugin.disabled) continue

    let accept = false

    if (plugin.customPrefix instanceof RegExp)
      accept = plugin.customPrefix.test(textMsg)
    else if (plugin.command)
      accept =
        plugin.command instanceof RegExp
          ? plugin.command.test(command)
          : Array.isArray(plugin.command)
            ? plugin.command.includes(command)
            : plugin.command === command

    if (!accept) continue

    if (plugin.group && !m.isGroup)
      return global.dfail("group", m, this)

    if (m.isGroup && (plugin.admin || plugin.botAdmin))
      if (!groupMetadata) await loadGroupData()

    if (plugin.rowner && !isROwner)
      return global.dfail("rowner", m, this)

    if (plugin.owner && !isOwner)
      return global.dfail("owner", m, this)

    if (plugin.botAdmin && !isBotAdmin)
      return global.dfail("botAdmin", m, this)

    if (plugin.admin && !isAdmin)
      return global.dfail("admin", m, this)

    const exec =
      typeof plugin === "function"
        ? plugin
        : typeof plugin.default === "function"
          ? plugin.default
          : null

    if (!exec) return

    setImmediate(() =>
      exec.call(this, m, {
        conn: this,
        args,
        usedPrefix,
        command,
        participants,
        groupMetadata,
        isROwner,
        isOwner,
        isAdmin,
        isBotAdmin,
        chat: m.chat
      })
    )

    return
  }
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log("handler.js actualizado")
  })
}