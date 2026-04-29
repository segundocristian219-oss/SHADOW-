import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `🔥 ¡Hola! ¿cómo puedo ayudarte hoy?`, m,);
  }

    const res = await fetch('https://files.catbox.moe/p3ef0g.jpg');
    const thumb2 = Buffer.from(await res.arrayBuffer());

    const fkontak = {
      key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "Halo" },
      message: {
        locationMessage: {
          name: `𝗖𝗛𝗔𝗧𝗚𝗣𝗧 𝗢𝗣𝗘𝗡𝗔𝗜`,
          jpegThumbnail: thumb2
        }
      },
      participant: "0@s.whatsapp.net"
    };

  try {
    const url = `https://api.kirito.my/api/chatgpt?q=${encodeURIComponent(text)}&apikey=by_deylin`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.response) {
      return conn.reply(m.chat, "❌ No recibí respuesta de la IA, intenta de nuevo.", m,);
    }

    await conn.reply(m.chat, `${data.response}`, fkontak,);
  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, "⚠️ Hubo un error al conectar con la IA.", m,);
  }
};

handler.tags = ["ai"];
handler.command = handler.help =['gpt', 'chatgpt']

export default handler;