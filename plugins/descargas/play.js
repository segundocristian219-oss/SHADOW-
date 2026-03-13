import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises' // Usar versión de promesas para evitar bloqueos
import path from 'path'
import os from 'os'
import axios from 'axios'

const execAsync = promisify(exec)
const apikey = 'causa-ec43262f206b3305'

// Cliente optimizado
const axiosClient = axios.create({
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json"
  },
  timeout: 10000
})

const YT_SEARCH = "https://www.youtube.com/youtubei/v1/search?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vzJqR0CqA"

/** * Optimización: Búsqueda más limpia con encadenamiento opcional 
 */
const searchYoutube = async (query) => {
  const body = {
    context: { client: { clientName: "WEB", clientVersion: "2.20240207.00.00" } },
    query
  }

  const { data } = await axiosClient.post(YT_SEARCH, body)
  const items = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents

  const video = items?.find(v => v.videoRenderer)?.videoRenderer
  if (!video) throw new Error('No se encontraron resultados.')

  return `https://www.youtube.com/watch?v=${video.videoId}`
}

/**
 * Obtener datos de la API
 */
const getYoutubeData = async (videoUrl, type = 'video') => {
  const url = `https://rest.apicausas.xyz/api/v1/descargas/youtube?apikey=${apikey}&url=${encodeURIComponent(videoUrl)}&type=${type}`
  const { data } = await axios.get(url)
  if (!data.status || !data.data?.download?.url) throw new Error('Error en el servidor de descarga.')
  return data.data
}

let handler = async (m, { conn, args, command }) => {
    const input = args.join(' ')
    if (!input) return m.reply(`🪐 Ingresa un enlace o texto de YouTube.
Ejemplo: *.ytmp3 autos edits*`)

    const isAudio = ['play', 'mp3', 'audio', 'song', 'music', 'ytmp3'].includes(command)

    try {
        let videoUrl = input
        if (!/youtu\.be|youtube\.com/.test(input)) {
            videoUrl = await searchYoutube(input)
        }

        const data = await getYoutubeData(videoUrl, 'video')
        const { title, uploader, duration_string: duration, thumbnail, download } = data


        // Descargar buffer una sola vez
        const res = await axios.get(download.url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(res.data)

        if (isAudio) {
            const tmpMp4 = path.join(os.tmpdir(), `yt_${Date.now()}.mp4`)
            const tmpMp3 = path.join(os.tmpdir(), `yt_${Date.now()}.mp3`)

            await fs.writeFile(tmpMp4, buffer)

            // Conversión optimizada con FFmpeg
            await execAsync(`ffmpeg -y -i "${tmpMp4}" -vn -ab 128k "${tmpMp3}"`)

            const mp3Buffer = await fs.readFile(tmpMp3)

            // Limpieza asíncrona (no bloquea)
            Promise.all([fs.unlink(tmpMp4), fs.unlink(tmpMp3)]).catch(console.error)

            await conn.sendMessage(m.chat, {
                audio: mp3Buffer,
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title,
                        body: `${uploader} • ${duration}`,
                        thumbnailUrl: thumbnail,
                        sourceUrl: videoUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

        } else {
            await conn.sendMessage(m.chat, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption: `🎬 *${title}*\n👤 ${uploader} • ⏱ ${duration}`
            }, { quoted: m })
        }

    } catch (e) {
        console.error('[YOUTUBE_ERROR]', e)
        m.reply(`❌ *Error:* ${e.message}`)
    }
}

handler.help = ['play', 'video'].map(v => v + ' <búsqueda>')
handler.tags = ['descargas']
handler.command = ['play', 'mp3', 'audio', 'song', 'music', 'mp4', 'video', 'play2', 'ytmp3']

export default handler