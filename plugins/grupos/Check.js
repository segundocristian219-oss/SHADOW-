import { downloadContentFromMessage } from "@whiskeysockets/baileys"

const handler = async (m, { conn }) => {

  try {

    const quoted = m.quoted

    const doc =
      quoted?.msg?.documentMessage ||
      m.msg?.documentMessage ||
      (m.mtype === "documentMessage" ? m.msg : null)

    if (!doc)
      return conn.sendMessage(
        m.chat,
        { text: "📄 *Responde a un archivo TXT o envíalo con el comando.*" },
        { quoted: m }
      )

    const stream = await downloadContentFromMessage(doc, "document")

    let buffer = Buffer.from([])

    for await (const chunk of stream)
      buffer = Buffer.concat([buffer, chunk])

    const text = buffer.toString("utf8")

    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)

    const results = []

    for (const original of lines) {

      const digits = original.replace(/\D/g, "")
      if (digits.length < 6) continue

      const count = {}

      for (const d of digits)
        count[d] = (count[d] || 0) + 1

      const maxRepeats = Math.max(...Object.values(count))

      if (maxRepeats >= 6)
        results.push({ original, maxRepeats })

    }

    if (!results.length)
      return conn.sendMessage(
        m.chat,
        { text: "❌ No hay números con mínimo 6 dígitos repetidos." },
        { quoted: m }
      )

    results.sort((a,b)=> b.maxRepeats - a.maxRepeats)

    let out = "📊 *TOP 10 – NÚMEROS CON MÁS REPETIDOS*\n\n"

    for (const r of results.slice(0,10)) {

      out += `🔹 ${r.original}\n`
      out += `   ➤ Repeticiones máximas: *${r.maxRepeats}*\n\n`

    }

    await conn.sendMessage(
      m.chat,
      { text: out },
      { quoted: m }
    )

  } catch (e) {

    console.error("CHECKER ERROR:", e)

    await conn.sendMessage(
      m.chat,
      { text: "❌ Error procesando el TXT." },
      { quoted: m }
    )

  }

}

handler.command = ["checker","check","chacker"]
handler.help = ["checker"]
handler.tags = ["tools"]

export default handler