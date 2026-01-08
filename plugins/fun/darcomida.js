const mascotas = {
  pollito: '🐤 Pollito',
  loro: '🦜 Loro',
  gato: '🐱 Gato',
  gallina: '🐔 Gallina',
  perro: '🐶 Perro',
  pingüino: '🐧 Pingüino',
  hamster: '🐹 Hámster',
  simio: '🐒 Simio',
  aguila: '🦅 Águila',
  cocodrilo: '🐊 Cocodrilo',
  lobo: '🐺 Lobo',
  tigre: '🐯 Tigre',
  leon: '🦁 León'
}

let handler = async (m, { args }) => {
  const chat = global.db.data.chats[m.chat]

  const input = args.join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')

  const mascotaElegida = mascotas[input]

  if (chat.mascotaGrupo) {
    return m.reply(
      `🐾 Este chat ya tiene una mascota:\n\n*${chat.mascotaGrupo}*`
    )
  }

  if (!mascotaElegida) {
    return m.reply(
      `🐾 *Mascotas disponibles:*\n\n` +
      Object.values(mascotas).map(v => `• *mimascota ${v}*`).join('\n')
    )
  }

  chat.mascotaGrupo = mascotaElegida

  m.reply(
    `🎉 ¡Mascota establecida!\n\n🐾 *${mascotaElegida}*`
  )
}

handler.help = ['mimascota <mascota>']
handler.tags = ['rpg']
handler.command = ['mimascota']

export default handler