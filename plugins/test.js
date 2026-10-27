const handler = async (m, { conn }) => {
 await conn.reply(m.chat, '✅ SI FUNCIONO, TU BOT SI RESPONDE', m)
}
handler.command = ['test123']
export default handler