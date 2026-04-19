import axios from "axios"
import { Sticker } from "wa-sticker-formatter"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY = global.APIKeys.may || ""

const handler = async (
  m,
  { conn, args = [], usedPrefix = ".", command = "brat" }
) => {

  const quotedText =
    m.quoted?.text ||
    m.quoted?.caption ||
    m.quoted?.conversation ||
    ""

  const text = args.join(" ").trim()
  const input = String(text || quotedText || "").trim()

  if (!input) {
    return conn.sendMessage(
      m.chat,
      {
        text: `✳️ Usa:
${usedPrefix}${command} <texto>
O responde a un mensaje con ${usedPrefix}${command}`
      },
      { quoted: m }
    )
  }

  await conn.sendMessage(m.chat, {
    react: { text: "🕒", key: m.key }
  })

  try {
    const senderName = m.pushName || "Usuario"

    const res = await axios.get(`${API_BASE}/brat`, {
      params: { text: input, apikey: API_KEY }
    })

    if (!res.data?.status) throw "Error API"

    const imgUrl = res.data.result.url

    const img = await axios.get(imgUrl, {
      responseType: "arraybuffer"
    })

    const sticker = new Sticker(img.data, {
      type: "full",
      pack: senderName,
      author: "",
      quality: 100
    })

    const stickerBuffer = await sticker.toBuffer()

    await conn.sendMessage(
      m.chat,
      { sticker: stickerBuffer },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (e) {
    await conn.sendMessage(
      m.chat,
      { text: `❌ Error: ${e}` },
      { quoted: m }
    )
  }
}

handler.command = ["brat"]
handler.help = ["𝖡𝗋𝖺𝗍 <𝖳𝖾𝗑𝗍𝗈>"]
handler.tags = ["𝖲𝖳𝖨𝖢𝖪𝖤𝖱𝖲"]

export default handler