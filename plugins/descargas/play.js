import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys.may || ""

const handler = async (msg, { conn, text, usedPrefix, command }) => {

  const chatId = msg.key.remoteJid

  if (!text) 
    return conn.sendMessage(chatId, { 
      text: `✳️ Usa:\n${usedPrefix}${command} <nombre de canción>\nEj:\n${usedPrefix}${command} Lemon Tree` 
    }, { quoted: msg })


  await conn.sendMessage(chatId, { react: { text: "🕒", key: msg.key } })


  try {

    const searchPromise = yts(text)
    const search = await searchPromise

    if (!search?.videos?.length) 
      throw new Error("No se encontró ningún resultado")


    const video = search.videos[0]

    const title    = video.title
    const author   = video.author?.name || "Desconocido"
    const duration = video.timestamp || "Desconocida"
    const thumb    = video.thumbnail || "https://i.ibb.co/3vhYnV0/default.jpg"
    const videoLink= video.url


    const infoCaption = 
`⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* 128kbps
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝚙𝚒:* MyAPI

» 𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖  🎧
» 𝘈𝘎𝘜𝘈𝘙𝘋𝘓𝘌 𝘜𝘕 𝘗𝘖𝘊𝘖...

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓.𝗑𝗒𝗓\`\`\`
`


    conn.sendMessage(chatId, { image: { url: thumb }, caption: infoCaption }, { quoted: msg })


    const { data } = await axios.get(`${API_BASE}/ytdl?url=${encodeURIComponent(videoLink)}&type=Mp3&apikey=${API_KEY}`)

    if (!data?.status || !data.result?.url) 
      throw new Error(data?.message || "No se pudo obtener el audio")


    const videoUrl = data.result.url


    conn.sendMessage(chatId, { 
      audio: { url: videoUrl }, 
      mimetype: "audio/mpeg", 
      fileName: `${title}.mp3`, 
      ptt: false 
    }, { quoted: msg })


    conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } })


  } catch (err) {

    console.error("play error:", err)

    conn.sendMessage(chatId, { 
      text: `❌ Error: ${err?.message || "Fallo interno"}` 
    }, { quoted: msg })

  }

}


handler.command = ["play", "ytplay"]
handler.help    = ["play <texto>"]
handler.tags    = ["descargas"]

export default handler