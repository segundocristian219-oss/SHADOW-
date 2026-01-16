import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs?.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys?.may || ""

const handler = async (msg, { conn, args, usedPrefix, command }) => {

  const chatId = msg.key.remoteJid
  const query = args.join(" ").trim()

  if (!query)
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <nombre de canción>\nEj:\n${usedPrefix}${command} Lemon Tree`
    }, { quoted: msg })

  conn.sendMessage(chatId, { react: { text: "🕒", key: msg.key } }).catch(() => {})

  try {
    const search = await yts(query)
    const video = search?.videos?.[0]
    if (!video) throw "No se encontró ningún resultado"

    const title    = video.title
    const author   = video.author?.name || "Desconocido"
    const duration = video.timestamp || "Desconocida"
    const thumb    = video.thumbnail || "https://i.ibb.co/3vhYnV0/default.jpg"
    const link     = video.url

    conn.sendMessage(chatId, {
      image: { url: thumb },
      caption: `
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
`.trim()
    }, { quoted: msg }).catch(() => {})

    const res = await axios.get(`${API_BASE}/ytdl`, {
      params: {
        url: link,
        type: "Mp3",
        apikey: API_KEY
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      },
      timeout: 20000
    })

    const data = res?.data
    const audioUrl = data?.result?.url

    if (
      !data?.status ||
      !audioUrl ||
      typeof audioUrl !== "string" ||
      !audioUrl.startsWith("http")
    ) throw "La API no devolvió un audio válido"

    const cleanTitle = (data.result.title || title).replace(/\.mp3$/i, "")

    await conn.sendMessage(chatId, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${cleanTitle}.mp3`,
      ptt: false
    }, { quoted: msg })

    conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } }).catch(() => {})

  } catch (e) {
    conn.sendMessage(chatId, {
      text: `❌ Error: ${typeof e === "string" ? e : "Fallo interno"}`
    }, { quoted: msg })
  }
}

handler.command = ["play", "ytplay"]
handler.help    = ["play <texto>"]
handler.tags    = ["descargas"]

export default handler