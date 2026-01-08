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

let handler = async (m, { args }) => {
  const chat = global.db.data.chats[m.chat]
  const mascotaElegida = args.join(' ')

  // Ya existe mascota en este chat
  if (chat.mascotaGrupo) {
    return m.reply(
      `🐾 Este chat ya tiene una mascota:\n\n*${chat.mascotaGrupo}*\n\n❌ No se puede cambiar.`
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
    `🎉 ¡Mascota establecida!\n\n` +
    `🐾 Mascota: *${mascotaElegida}*\n` +
    `👤 Elegida por: *@${m.sender.split('@')[0]}*`,
    null,
    { mentions: [m.sender] }
  )
}

handler.help = ['mimascota']
handler.tags = ['rpg']
handler.command = ['mimascota']

export default handler