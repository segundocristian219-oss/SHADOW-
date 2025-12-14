import { WAMessageStubType } from '@whiskeysockets/baileys'

const ppCache = new Map()
const CACHE_TTL = 60_000

async function getProfilePic(conn, jid) {
  const cached = ppCache.get(jid)
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.url

  let url = 'https://cdn.russellxz.click/262f94ad.jpeg'
  try {
    url = await conn.profilePictureUrl(jid, 'image')
  } catch {
    try {
      url = await conn.profilePictureUrl(jid, 'preview')
    } catch {}
  }

  ppCache.set(jid, { url, time: Date.now() })

  if (ppCache.size > 1000) {
    for (const [k, v] of ppCache) {
      if (Date.now() - v.time > CACHE_TTL) ppCache.delete(k)
    }
  }

  return url
}

function parseText(text, data) {
  return text.replace(/@user|@group|@desc/g, m =>
    m === '@user' ? data.user :
    m === '@group' ? data.group :
    data.desc
  )
}

async function sendEvent(conn, chatId, jid, text) {
  const pic = await getProfilePic(conn, jid)
  await conn.sendMessage(chatId, {
    image: { url: pic },
    caption: text,
    mentions: [jid]
  })
}

export async function before(m, { conn, groupMetadata }) {
  if (!m.isGroup || !m.messageStubType) return true

  const chat = global.db.data.chats[m.chat]
  if (chat.welcome === undefined) chat.welcome = true
if (!chat.welcome) return true

  const groupName = groupMetadata?.subject || 'Grupo'
  const groupDesc = groupMetadata?.desc || 'Sin descripción'
  const users = m.messageStubParameters || []

  const byeMsgs = [
    `*╭┈┈┈┈┈┈┈┈┈┈┈┈┈≫*
*┊* @user
*┊𝗧𝗨 𝗔𝗨𝗦𝗘𝗡𝗖𝗜𝗔 𝗙𝗨𝗘 𝗖𝗢𝗠𝗢 𝗨𝗡 𝗤𝗟𝗢*
*┊𝗖𝗢𝗡 𝗢𝗟𝗢𝗥 𝗔 𝗠𝗥𝗗* 👿
*╰┈┈┈┈┈┈┈┈┈┈┈┈┈≫*`,
    `*╭┈┈┈┈┈┈┈┈┈┈┈┈┈≫*
*┊* @user
*┊𝗔𝗟𝗚𝗨𝗜𝗘𝗡 𝗠𝗘𝗡𝗢𝗦*
*┊𝗡𝗔𝗗𝗜𝗘 𝗧𝗘 𝗩𝗔 𝗔 𝗘𝗫𝗧𝗥𝗔𝗡̃𝗔𝗥* 👿
*╰┈┈┈┈┈┈┈┈┈┈┈┈┈≫*`
  ]

  for (const jid of users) {
    const user = `@${jid.split('@')[0]}`
    const data = { user, group: groupName, desc: groupDesc }

    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
      const text = chat.sWelcome
        ? parseText(chat.sWelcome, data)
        : `┊» 𝙋𝙊𝙍 𝙁𝙄𝙉 𝙇𝙇𝙀𝗚𝗔𝗦
┊» ${groupName}
┊» ${user}
┊» 𝗹𝗲𝗲 𝗹𝗮 𝗱𝗲𝘀𝗰𝗿𝗶𝗽𝗰𝗶𝗼𝗻

» Siéntete como en tu casa`
      await sendEvent(conn, m.chat, jid, text)
    }

    if (
      m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE ||
      m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE
    ) {
      const text = chat.sBye
        ? parseText(chat.sBye, data)
        : parseText(byeMsgs[Math.floor(Math.random() * byeMsgs.length)], data)
      await sendEvent(conn, m.chat, jid, text)
    }
  }

  return true
}