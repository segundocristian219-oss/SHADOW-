const mascotas = [
  '🐤 Pollito',
  '🦜 Loro',
  '🐱 Gato',
  '🐔 Gallina',
  '🐶 Perro',
  '🐧 Pingüino',
  '🐹 Hámster',
  '🐒 Simio',
  '🦅 Águila',
  '🐊 Cocodrilo',
  '🐺 Lobo',
  '🐯 Tigre',
  '🦁 León'
]

let handler = async (m, { args, isGroup }) => {
  if (!isGroup) {
    return m.reply('❌ Este comando solo puede usarse en *grupos*.')
  }

  const chat = global.db.data.chats[m.chat]
  const mascotaElegida = args.join(' ')

  // Ya existe mascota en el grupo
  if (chat.mascotaGrupo) {
    return m.reply(
      `🐾 Este grupo ya tiene una mascota:\n\n*${chat.mascotaGrupo}*\n\n❌ No se puede cambiar.`
    )
  }

  if (!mascotaElegida || !mascotas.includes(mascotaElegida)) {
    return m.reply(
      `🐾 *Elige una mascota válida escribiendo el comando exactamente:*\n\n` +
      mascotas.map(v => `• *mimascota ${v}*`).join('\n')
    )
  }

  chat.mascotaGrupo = mascotaElegida

  m.reply(
    `🎉 ¡Mascota del grupo establecida!\n\n` +
    `🐾 Mascota: *${mascotaElegida}*\n` +
    `👤 Elegida por: *@${m.sender.split('@')[0]}*`,
    null,
    { mentions: [m.sender] }
  )
}

handler.help = ['mimascota']
handler.tags = ['rpg', 'group']
handler.command = ['mimascota']
handler.group = true

export default handler