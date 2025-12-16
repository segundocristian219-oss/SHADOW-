
import fs from 'fs'
import path from 'path'

var handler = async (m, { conn }) => {
  if (global.conn.user.jid !== conn.user.jid) {
    return conn.reply(
      m.chat,
      `${emoji} Usa este comando solo en el número principal del bot.`,
      m
    )
  }

  const sessionPath = path.resolve(`./${sessions}`)

  await conn.reply(
    m.chat,
    `${emoji2} Iniciando limpieza completa de sesiones (excepto creds.json)...`,
    m
  )
  //await m.react(rwait)

  if (!fs.existsSync(sessionPath)) {
    return conn.reply(
      m.chat,
      `${emoji} La carpeta de sesiones no existe.`,
      m
    )
  }

  let eliminados = 0

  try {
    const files = fs.readdirSync(sessionPath)

    for (const file of files) {
      if (file === 'creds.json') continue

      const fullPath = path.join(sessionPath, file)

      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(fullPath)
      }

      eliminados++
    }

    //await m.react(done)

    if (eliminados === 0) {
      return conn.reply(
        m.chat,
        `${emoji2} No había sesiones para eliminar.`,
        m
      )
    }

    await conn.reply(
      m.chat,
      `${emoji} Se eliminaron correctamente *${eliminados}* sesiones.\n📁 creds.json fue conservado.`,
      m
    )

    await conn.reply(
      m.chat,
      `${emoji} *¿Hola? ¿Ya me ves activo?*`,
      m
    )

  } catch (e) {
    console.error(e)
    await conn.reply(
      m.chat,
      `${msm} Ocurrió un error limpiando las sesiones.`,
      m
    )
  }
}

handler.help = ['dsowner']
handler.tags = ['owner']
handler.command = ['delai', 'dsowner', 'clearallsession']
handler.owner = true

export default handler