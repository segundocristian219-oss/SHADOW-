import yts from "yt-search"
import axios from "axios"

const API_URL = "https://api-adonix.ultraplus.click/download/ytaudio"
const API_KEY = "Angxlllll"

const handler = async (m, { conn, args }) => {
  const query = args.join(" ").trim()
  if (!query) return m.reply("🎶 Ingresa el nombre del video de YouTube.")

  await conn.sendMessage(m.chat, {
    react: { text: "🕘", key: m.key }
  })

  try {
    const search = await yts(query)
    const video = search?.videos?.[0]
    if (!video) throw 0

    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.thumbnail },
        caption: `
✧━───『 𝙄𝙣𝙛𝙤 𝙙𝙚𝙡 𝙑𝙞𝙙𝙚𝙤 』───━✧

🎼 Título: ${video.title}
📺 Canal: ${video.author?.name || "—"}
👁️ Vistas: ${formatViews(video.views)}
⏳ Duración: ${video.timestamp || "—"}
`.trim()
      },
      { quoted: m }
    )

    const { data } = await axios.get(API_URL, {
      params: {
        url: video.url,
        apikey: API_KEY
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      },
      timeout: 20000
    })

    const audioUrl =
      data?.data?.url ||
      data?.datos?.url ||
      null

    if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) throw 0

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: cleanName(video.title) + ".mp3",
        ptt: false
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch {
    await m.reply("❌ Error al obtener el audio.")
  }
}

const cleanName = t =>
  t.replace(/[^\w\s.-]/gi, "").substring(0, 60)

const formatViews = v => {
  if (typeof v !== "number") return v
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B"
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M"
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"
  return v.toString()
}

handler.command = ["play", "yt", "mp3"]
handler.tags = ["descargas"]

export default handler