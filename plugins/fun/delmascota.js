let handler = async (m) => {
  const chat = global.db.data.chats[m.chat]

  if (!chat.mascotaGrupo) {
    return m.reply('❌ Este chat no tiene una mascota.\nUsa *mimascota* para elegir una.')
  }

  const ahora = Date.now()
  const cooldown = 4 * 60 * 60 * 1000

  if (!chat.mascotaUltimaComida) {
    chat.mascotaUltimaComida = 0
  }

  const restante = cooldown - (ahora - chat.mascotaUltimaComida)

  if (restante > 0) {
    const h = Math.floor(restante / 3600000)
    const min = Math.floor((restante % 3600000) / 60000)

    return m.reply(
      `🐾 *${chat.mascotaGrupo}* ya comió.\n\n⏳ Intenta de nuevo en *${h}h ${min}m*.`
    )
  }

  chat.mascotaUltimaComida = ahora
  chat.mascotaHambre = 0

  m.reply(
    `🍖 Has alimentado a *${chat.mascotaGrupo}*.\n🐾 Está feliz 😸`
  )
}

handler.help = ['darcomida']
handler.tags = ['rpg']
handler.command = ['darcomida']

export default handler