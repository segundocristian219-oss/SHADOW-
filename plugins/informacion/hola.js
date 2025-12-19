let handler = async (m, { conn }) => {

  await conn.sendMessage(m.chat, {
    text: '👋 Hola, elige una opción',
    footer: 'Angel Bot',
    buttons: [
      {
        buttonId: '.menu',
        buttonText: { displayText: '📋 Menú' },
        type: 1
      },
      {
        buttonId: '.estado',
        buttonText: { displayText: '📊 Estado' },
        type: 1
      }
    ],
    headerType: 1
  }, { quoted: m })

}

handler.command = /^hola$/i
export default handler