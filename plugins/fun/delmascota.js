
let handler = async (m, { args }) => {
  const chat = global.db.data.chats[m.chat]

  if (!chat.mascotaGrupo) {
    return m.reply('❌ Este chat no tiene ninguna mascota que eliminar.')
  }

  const mascota = chat.mascotaGrupo

  delete chat.mascotaGrupo
  delete chat.mascotaUltimaComida
  delete chat.mascotaHambre

  m.reply(
    `🗑️ La mascota *${mascota}* ha sido eliminada.\n\n` +
    `🐾 Ahora pueden elegir una nueva usando *mimascota*.`
  )
}

handler.help = ['delmascota']
handler.tags = ['rpg']
handler.command = ['delmascota']

export default handler