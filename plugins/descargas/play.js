import axios from "axios";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const baseHeaders = (ref) => ({
  "User-Agent": UA,
  "Accept": "application/json, text/plain, */*",
  "Origin": ref,
  "Referer": `${ref}/`,
  "Content-Type": "application/x-www-form-urlencoded"
});

async function ytSearchDirect(query) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const { data: html } = await axios.get(url, { 
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      timeout: 5000 
    });
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) return null;
    const json = JSON.parse(match[1]);
    const contents = json?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
    const video = contents?.find(v => v.videoRenderer)?.videoRenderer;
    return video ? { id: video.videoId, title: video.title.runs[0].text } : null;
  } catch {
    return null;
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return;
  const ref = "https://frame.y2meta-uk.com";
  try {
    await conn.sendMessage(m.chat, { react: { text: "⚡", key: m.key } });
    const [search, resKey] = await Promise.all([
      ytSearchDirect(text),
      axios.get(`https://cnv.cx/v2/sanity/key?_=${Date.now()}`, {
        timeout: 8000,
        headers: { ...baseHeaders(ref), "Content-Type": "application/json" }
      }).catch(() => null)
    ]);
    if (!search || !resKey?.data?.key) throw new Error();
    const params = new URLSearchParams({
      link: `https://youtu.be/${search.id}`,
      format: "mp3",
      audioBitrate: "128",
      filenameStyle: "pretty"
    });
    const { data: resConv } = await axios.post("https://cnv.cx/v2/converter", params.toString(), {
      timeout: 20000,
      headers: { ...baseHeaders(ref), "key": resKey.data.key }
    });
    if (!resConv?.url) throw new Error();
    await conn.sendMessage(m.chat, {
      audio: { url: resConv.url },
      mimetype: "audio/mpeg",
      fileName: `${search.title}.mp3`
    }, { quoted: m });
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
  }
};

handler.help = ['ytmp3'];
handler.tags = ['descargas'];
handler.command = ['play', 'yt3'];

export default handler;