import fetch from 'node-fetch'

const handler = async (m, { conn, text, command }) => {

  await conn.sendMessage(m.chat, { react: { text: "🔥", key: m.key } }).catch(() => {})

  if (!text) throw `Ejemplo:\n${command} karma police`

  try {
    const id = ((await fetch(`https://api.ryuzei.xyz/search/yts?q=${encodeURIComponent(text)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }).then(r => r.json()))?.results?.[0]?.id)
    if (!id) throw "No encontré resultados"

    const dl = await fetch(`https://api.ryuzei.xyz/dl/ytmp3?id=${id}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }).then(r => r.text())

    if (dl.startsWith("<")) throw "API bloqueada"

    const { data, download } = JSON.parse(dl)
    if (!download?.url) throw "No se obtuvo el audio"

    await conn.sendMessage(m.chat, {
      audio: { url: download.url },
      mimetype: "audio/mpeg",
      fileName: `${data?.title || "audio"}.mp3`
    }, { quoted: m })

  } catch (e) {
    await conn.reply(m.chat, `❌ ERROR\n${e}`, m)
  }
}

handler.command = ['play', 'mp3']
export default handler