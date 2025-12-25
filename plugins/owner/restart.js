import fs from "fs";
import path from "path";
import { exec } from "child_process";

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  const lastRestarterFile = "./lastRestarter.json";
  if (!fs.existsSync(lastRestarterFile)) {
    fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: "" }, null, 2));
  }

  exec("git pull", async (error, stdout, stderr) => {
    if (error) {
      await conn.sendMessage(chatId, {
        text: `❌ Error al actualizar: ${error.message}`
      }, { quoted: msg });
      return;
    }

    const output = stdout || stderr;
    if (output.includes("Already up to date")) {
      await conn.sendMessage(chatId, {
        text: `✅ *Ya estás usando la última versión.*`
      }, { quoted: msg });
    } else {
      const mensaje = `✅ *Actualización completada:*\n\n${output.trim()}\n\n🔄 Reiniciando el servidor...`;

      await conn.sendMessage(chatId, {
        react: { text: "🔄", key: msg.key }
      });

      await conn.sendMessage(chatId, {
        text: mensaje
      }, { quoted: msg });

      fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId }, null, 2));

      setTimeout(() => process.exit(1), 3000);
    }
  });
};

handler.command = ["carga", "update"];
export default handler;