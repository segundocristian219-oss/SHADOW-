import axios from "axios"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

const AXIOS_CFG = {
  timeout: 20000,
  headers: {
    "User-Agent": UA,
    "Accept": "*/*",
    "Referer": "https://www.tiktok.com/",
    "Origin": "https://www.tiktok.com"
  }
}

async function retry(fn, times = 3) {
  let lastErr
  for (let i = 0; i < times; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

async function getTikTokVideo(url) {
  const providers = [
    async () => {
      const r = await axios.get(
        `https://api.dorratz.com/v2/tiktok-dl?url=${encodeURIComponent(url)}`,
        AXIOS_CFG
      )
      return r.data?.data?.media?.org || null
    },

    async () => {
      const r = await axios.get(
        `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
        AXIOS_CFG
      )
      return r.data?.data?.play || null
    }
  ]

  for (const fn of providers) {
    try {
      const video = await retry(fn, 2)
      if (video) return video
    } catch {}
  }

  return null
}

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid
  const url = args[0]

  if (!url)
    return conn.sendMessage(
      chatId,
      { text: "🔗 *Ingresa un enlace de TikTok*" },
      { quoted: msg }
    )

  if (!/^https?:\/\//i.test(url) || !/tiktok\.com/i.test(url))
    return conn.sendMessage(
      chatId,
      { text: "🚩 *Enlace inválido*" },
      { quoted: msg }
    )

  try {
    await conn.sendMessage(chatId, {
      react: { text: "🕒", key: msg.key }
    })

    const videoUrl = await getTikTokVideo(url)

    if (!videoUrl)
      return conn.sendMessage(
        chatId,
        { text: "❌ *No se pudo obtener el video*" },
        { quoted: msg }
      )

    const res = await axios.get(videoUrl, {
      ...AXIOS_CFG,
      responseType: "arraybuffer"
    })

    const sizeMB = res.data.byteLength / (1024 * 1024)
    if (sizeMB > 99)
      return conn.sendMessage(
        chatId,
        { text: `⚠️ *El video pesa ${sizeMB.toFixed(2)}MB*` },
        { quoted: msg }
      )

    await conn.sendMessage(
      chatId,
      {
        video: Buffer.from(res.data),
        mimetype: "video/mp4"
      },
      { quoted: msg }
    )

    await conn.sendMessage(chatId, {
      react: { text: "✅", key: msg.key }
    })
  } catch (err) {
    console.error("TT ERROR:", err)
    await conn.sendMessage(
      chatId,
      { text: "❌ *Error al procesar el video de TikTok*" },
      { quoted: msg }
    )
    await conn.sendMessage(chatId, {
      react: { text: "❌", key: msg.key }
    })
  }
}

handler.command = ["tiktok", "tt"]
handler.help = ["tiktok <url>"]
handler.tags = ["descargas"]

export default handler