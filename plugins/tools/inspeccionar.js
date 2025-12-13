import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { text, conn }) => {
  if (!text) return m.reply('📎 Por favor proporciona el enlace.')
  if (!text.includes('https://whatsapp.com/channel/')) return m.reply('❗ Enlace no válido.')

  let result = text.split('https://whatsapp.com/channel/')[1]
  let res = await conn.newsletterMetadata('invite', result)

  let teks = `🆔 *ID:* ${res.id}\n📛 *Nombre:* ${res.name}\n👥 *Suscriptores:* ${res.subscribers}\n📶 *Estado:* ${res.state}\n✅ *Verificado:* ${res.verification === 'VERIFIED' ? 'Sí' : 'No'}`

  await m.reply(teks)
}

handler.help = handler.command = ['id']
handler.tags = ['tools']

export default handler