import fs from "fs";
import path from "path";

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  // Reacción 🔄
  await conn.sendMessage(chatId, {
    react: { text: "🔄", key: msg.key }
  });

  // Mensaje de aviso
  await conn.sendMessage(chatId, {
    text: "🔄 *SHADOW BOT se reiniciará en unos segundos...*"
  }, { quoted: msg });

  // Guardar chat para notificar luego
  const restartPath = path.resolve("lastRestarter.json");
  fs.writeFileSync(restartPath, JSON.stringify({ chatId }, null, 2));

  // Reinicio
  setTimeout(() => process.exit(1), 3000);
};

handler.command = ["rest", "restart"];
handler.owner = true
export default handler;