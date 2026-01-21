let handler = async (m, { conn, isAdmin, isROwner} ) => {
    if (!(isAdmin || isROwner)) return dfail('admin', m, conn)
    global.db.data.chats[m.chat].isBanned = false
    m.reply('🔓 Bot activo no estes chingando.')   
}
handler.help = ['desbanearbot']
handler.tags = ['group']
handler.command = ['vuelve', 'unbanchat']
handler.group = true 
handler.owner = true
export default handler
