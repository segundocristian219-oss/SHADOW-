const handler = async (msg, { conn }) => {
  await conn.sendMessage(msg.key.remoteJid, { 
    text: '❌ El comando update está desactivado para no borrar tu config y no romper el bot.' 
  }, { quoted: msg });
};

handler.command = ["carga", "update"];
export default handler;