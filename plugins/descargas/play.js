import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import { promisify } from "util"
import { pipeline } from "stream"
import crypto from "crypto"

const streamPipe = promisify(pipeline)

const TMP_DIR = path.join(process.cwd(), "tmp")
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const CACHE_FILE = path.join(TMP_DIR, "cache.json")
const SKY_BASE = (process.env.API_BASE || "https://api-sky.ultraplus.click").replace(/\/+$/, "")
const SKY_KEY = process.env.API_KEY || "Angxllll"

const MAX_CONCURRENT = 3
const MAX_MB = 99
const DOWNLOAD_TIMEOUT = 60000
const MAX_RETRIES = 3
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7

let active = 0
const queue = []
const tasks = {}
let cache = loadCache()

function wait(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function safeUnlink(f) {
  try { f && fs.existsSync(f) && fs.unlinkSync(f) } catch {}
}

function fileSizeMB(f) {
  try { return fs.statSync(f).size / 1024 / 1024 } catch { return 0 }
}

function readHeader(file, len = 16) {
  try {
    const fd = fs.openSync(file, "r")
    const buf = Buffer.alloc(len)
    fs.readSync(fd, buf, 0, len, 0)
    fs.closeSync(fd)
    return buf.toString("hex")
  } catch {
    return ""
  }
}

function validFile(file) {
  if (!file || !fs.existsSync(file)) return false
  const size = fs.statSync(file).size
  if (size < 500000) return false
  const hex = readHeader(file)
  if (file.endsWith(".mp3") && !(hex.startsWith("494433") || hex.startsWith("fff"))) return false
  if (file.endsWith(".mp4") && !hex.includes("66747970")) return false
  return true
}

function saveCache() {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)) } catch {}
}

function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {}
    const data = JSON.parse(fs.readFileSync(CACHE_FILE))
    const now = Date.now()
    for (const id in data) {
      if (now - data[id].timestamp > CACHE_TTL) delete data[id]
      else {
        for (const k in data[id].files) {
          if (!fs.existsSync(data[id].files[k])) delete data[id].files[k]
        }
      }
    }
    return data
  } catch {
    return {}
  }
}

function purgeCache(videoUrl, type) {
  try {
    const f = cache?.[videoUrl]?.files?.[type]
    if (f && fs.existsSync(f)) fs.unlinkSync(f)
    if (cache?.[videoUrl]?.files?.[type]) {
      delete cache[videoUrl].files[type]
      if (!Object.keys(cache[videoUrl].files).length) delete cache[videoUrl]
      saveCache()
    }
  } catch {}
}

async function queueDownload(task) {
  if (active >= MAX_CONCURRENT) await new Promise(r => queue.push(r))
  active++
  try {
    return await task()
  } finally {
    active--
    queue.shift()?.()
  }
}

async function getSkyUrl(videoUrl, type) {
  for (let i = 0; i < 3; i++) {
    try {
      const { data } = await axios.get(`${SKY_BASE}/api/download/yt.php`, {
        params: { url: videoUrl, format: type },
        headers: { Authorization: `Bearer ${SKY_KEY}` },
        timeout: 20000
      })
      const url =
        data?.data?.audio ||
        data?.data?.video ||
        data?.audio ||
        data?.video ||
        data?.url
      if (url?.startsWith("http")) return url
    } catch {}
    await wait(500)
  }
  return null
}

async function downloadStream(url, file) {
  const res = await axios.get(url, {
    responseType: "stream",
    timeout: DOWNLOAD_TIMEOUT,
    maxRedirects: 5
  })
  await streamPipe(res.data, fs.createWriteStream(file))
  return file
}

async function toMp3(input) {
  const out = input.replace(/\.\w+$/, ".mp3")
  await new Promise((res, rej) =>
    ffmpeg(input)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .save(out)
      .on("end", res)
      .on("error", rej)
  )
  safeUnlink(input)
  return out
}

async function startDownload(id, key, mediaUrl) {
  if (tasks[id]?.[key]) return tasks[id][key]

  tasks[id] = tasks[id] || {}

  const ext = key.startsWith("audio") ? "mp3" : "mp4"
  const file = path.join(TMP_DIR, `${crypto.randomUUID()}.${ext}`)

  tasks[id][key] = queueDownload(async () => {
    await downloadStream(mediaUrl, file)
    const final = key.startsWith("audio") ? await toMp3(file) : file
    if (!validFile(final)) throw "Archivo inválido"
    if (fileSizeMB(final) > MAX_MB) throw "Archivo muy grande"
    return final
  })

  return tasks[id][key]
}

async function sendFile(conn, job, file, isDoc, type, quoted) {
  if (!validFile(file)) {
    await conn.sendMessage(job.chatId, { text: "❌ Archivo inválido." }, { quoted })
    return
  }

  const buffer = fs.readFileSync(file)
  const msg = {}

  if (isDoc) msg.document = buffer
  else if (type === "audio") msg.audio = buffer
  else msg.video = buffer

  await conn.sendMessage(
    job.chatId,
    {
      ...msg,
      mimetype: type === "audio" ? "audio/mpeg" : "video/mp4",
      fileName: `${job.title}.${type === "audio" ? "mp3" : "mp4"}`
    },
    { quoted }
  )
}

const pending = {}

function addPending(id, data) {
  pending[id] = data
  setTimeout(() => delete pending[id], 15 * 60 * 1000)
}

export default async function handler(msg, { conn, text, command }) {
  const pref = global.prefixes?.[0] || "."

  if (!text?.trim()) {
    return conn.sendMessage(
      msg.chat,
      { text: `✳️ Usa:\n${pref}play <término>\nEj: ${pref}play bad bunny` },
      { quoted: msg }
    )
  }

  await conn.sendMessage(msg.chat, { react: { text: "🕒", key: msg.key } })

  const res = await yts(text)
  const video = res.videos?.[0]
  if (!video) {
    return conn.sendMessage(msg.chat, { text: "❌ Sin resultados." }, { quoted: msg })
  }

  const { url, title, timestamp, views, author, thumbnail } = video

  const caption = `
┏━[ *Angel Bot Music 🎧* ]━┓
┃🎵 Título: ${title}
┃⏱️ Duración: ${timestamp}
┃👁️ Vistas: ${(views || 0).toLocaleString()}
┃👤 Autor: ${author?.name || author}
┗━━━━━━━━━━━━━━━━━━┛

📥 Reacciona:
👍 Audio MP3
❤️ Video MP4
📄 Audio Documento
📁 Video Documento
`.trim()

  const preview = await conn.sendMessage(
    msg.chat,
    { image: { url: thumbnail }, caption },
    { quoted: msg }
  )

  addPending(preview.key.id, {
    chatId: msg.chat,
    videoUrl: url,
    title,
    commandMsg: msg,
    sender: msg.participant || msg.key.participant
  })

  await conn.sendMessage(msg.chat, { react: { text: "✅", key: msg.key } })

  if (conn._playListener) return
  conn._playListener = true

  conn.ev.on("messages.upsert", async ev => {
    for (const m of ev.messages || []) {
      const react = m.message?.reactionMessage
      const ctx = m.message?.extendedTextMessage?.contextInfo
      const stanza = react?.key?.id || ctx?.stanzaId
      const job = pending[stanza]
      if (!job) continue

      const sender = m.key.participant || m.participant
      if (sender !== job.sender) continue

      let choice = react?.text
      if (!choice && ctx) {
        const txt = (m.message?.conversation || m.message?.extendedTextMessage?.text || "").trim()
        if (["1", "audio"].includes(txt)) choice = "👍"
        else if (["2", "video"].includes(txt)) choice = "❤️"
        else if (["3", "videodoc"].includes(txt)) choice = "📁"
        else if (["4", "audiodoc"].includes(txt)) choice = "📄"
      }

      if (!["👍", "❤️", "📄", "📁"].includes(choice)) continue

      const map = { "👍": ["audio", false], "📄": ["audio", true], "❤️": ["video", false], "📁": ["video", true] }
      const [type, isDoc] = map[choice]

      const cached = cache?.[job.videoUrl]?.files?.[type]
      if (cached) {
        if (validFile(cached)) {
          await conn.sendMessage(job.chatId, { text: `⚡ Mandando desde cache: ${type}` }, { quoted: job.commandMsg })
          await sendFile(conn, job, cached, isDoc, type, job.commandMsg)
          continue
        } else {
          purgeCache(job.videoUrl, type)
        }
      }

      await conn.sendMessage(job.chatId, { text: `⏳ Descargando ${type}...` }, { quoted: job.commandMsg })

      const mediaUrl = await getSkyUrl(job.videoUrl, type)
      if (!mediaUrl) {
        await conn.sendMessage(job.chatId, { text: "❌ No se pudo obtener enlace." }, { quoted: job.commandMsg })
        continue
      }

      try {
        const file = await startDownload(job.videoUrl, type, mediaUrl)
        cache[job.videoUrl] = cache[job.videoUrl] || { timestamp: Date.now(), files: {} }
        cache[job.videoUrl].files[type] = file
        saveCache()
        await sendFile(conn, job, file, isDoc, type, job.commandMsg)
      } catch (e) {
        await conn.sendMessage(job.chatId, { text: `❌ Error: ${e}` }, { quoted: job.commandMsg })
      }
    }
  })
}

handler.help = ["play <texto>"]
handler.tags = ["descargas"]
handler.command = ["play"]