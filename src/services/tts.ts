import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const DEFAULT_TTS_PROVIDER = "browser"

const AVAILABLE_TTS_PROVIDERS = ["browser", "elevenlabs", "custom"] as const

export const getTTSProvider = async (): Promise<
  (typeof AVAILABLE_TTS_PROVIDERS)[number]
> => {
  const ttsProvider = await storage.get("ttsProvider")
  if (!ttsProvider || ttsProvider.length === 0) {
    return DEFAULT_TTS_PROVIDER
  }
  return ttsProvider as (typeof AVAILABLE_TTS_PROVIDERS)[number]
}

export const setTTSProvider = async (ttsProvider: string) => {
  await storage.set("ttsProvider", ttsProvider)
}

export const getBrowserTTSVoices = async () => {
  if (import.meta.env.BROWSER === "chrome") {
    const tts = await chrome.tts.getVoices()
    return tts
  } else {
    const tts = await speechSynthesis.getVoices()
    return tts.map((voice) => ({
      voiceName: voice.name,
      lang: voice.lang
    }))
  }
}

export const getVoice = async () => {
  const voice = await storage.get("voice")
  return voice
}

export const setVoice = async (voice: string) => {
  await storage.set("voice", voice)
}

export const isTTSEnabled = async () => {
  const data = await storage.get("isTTSEnabled")
  if (!data || data.length === 0) {
    return true
  }
  return data === "true"
}

export const setTTSEnabled = async (isTTSEnabled: boolean) => {
  await storage.set("isTTSEnabled", isTTSEnabled.toString())
}

export const isSSMLEnabled = async () => {
  const data = await storage.get("isSSMLEnabled")
  return data === "true"
}

export const setSSMLEnabled = async (isSSMLEnabled: boolean) => {
  await storage.set("isSSMLEnabled", isSSMLEnabled.toString())
}

export const getElevenLabsApiKey = async () => {
  const data = await storage.get("elevenLabsApiKey")
  return data
}

export const setElevenLabsApiKey = async (elevenLabsApiKey: string) => {
  await storage.set("elevenLabsApiKey", elevenLabsApiKey)
}

export const getElevenLabsVoiceId = async () => {
  const data = await storage.get("elevenLabsVoiceId")
  return data
}

export const setElevenLabsVoiceId = async (elevenLabsVoiceId: string) => {
  await storage.set("elevenLabsVoiceId", elevenLabsVoiceId)
}

export const getElevenLabsModel = async () => {
  const data = await storage.get("elevenLabsModel")
  return data
}

export const setElevenLabsModel = async (elevenLabsModel: string) => {
  await storage.set("elevenLabsModel", elevenLabsModel)
}

export const getResponseSplitting = async () => {
  const data = await storage.get("ttsResponseSplitting")
  if (!data || data.length === 0 || data === "") {
    return "punctuation"
  }
  return data
}

export const getCustomTTSEndpoint = async () => {
  const data = await storage.get("customTTSEndpoint")
  return data
}

export const setCustomTTSEndpoint = async (endpoint: string) => {
  await storage.set("customTTSEndpoint", endpoint)
}

export const getCustomTTSHeaders = async () => {
  const data = await storage.get("customTTSHeaders")
  if (!data) {
    return {}
  }
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

export const setCustomTTSHeaders = async (headers: Record<string, string>) => {
  await storage.set("customTTSHeaders", JSON.stringify(headers))
}

export const setResponseSplitting = async (responseSplitting: string) => {
  await storage.set("ttsResponseSplitting", responseSplitting)
}

export const getCustomTTSModel = async () => {
  const data = await storage.get("customTTSModel")
  return data
}

export const setCustomTTSModel = async (model: string) => {
  await storage.set("customTTSModel", model)
}

export const getCustomTTSVoice = async () => {
  const data = await storage.get("customTTSVoice")
  return data
}

export const setCustomTTSVoice = async (voice: string) => {
  await storage.set("customTTSVoice", voice)
}



export const getTTSSettings = async () => {
  const [
    ttsEnabled,
    ttsProvider,
    browserTTSVoices,
    voice,
    ssmlEnabled,
    elevenLabsApiKey,
    elevenLabsVoiceId,
    elevenLabsModel,
    responseSplitting,
    customTTSEndpoint,
    customTTSModel,
    customTTSVoice,
    customTTSHeaders
  ] = await Promise.all([
    isTTSEnabled(),
    getTTSProvider(),
    getBrowserTTSVoices(),
    getVoice(),
    isSSMLEnabled(),
    getElevenLabsApiKey(),
    getElevenLabsVoiceId(),
    getElevenLabsModel(),
    getResponseSplitting(),
    getCustomTTSEndpoint(),
    getCustomTTSModel(),
    getCustomTTSVoice(),
    getCustomTTSHeaders()
  ])

  return {
    ttsEnabled,
    ttsProvider,
    browserTTSVoices,
    voice,
    ssmlEnabled,
    elevenLabsApiKey,
    elevenLabsVoiceId,
    elevenLabsModel,
    responseSplitting,
    customTTSEndpoint,
    customTTSModel,
    customTTSVoice,
    customTTSHeaders
  }
}

export const setTTSSettings = async ({
  ttsEnabled,
  ttsProvider,
  voice,
  ssmlEnabled,
  elevenLabsApiKey,
  elevenLabsVoiceId,
  elevenLabsModel,
  responseSplitting,
  customTTSEndpoint,
  customTTSModel,
  customTTSVoice,
  customTTSHeaders
}: {
  ttsEnabled: boolean
  ttsProvider: string
  voice: string
  ssmlEnabled: boolean
  elevenLabsApiKey: string
  elevenLabsVoiceId: string
  elevenLabsModel: string
  responseSplitting: string
  customTTSEndpoint: string
  customTTSModel: string
  customTTSVoice: string
  customTTSHeaders: Record<string, string>
}) => {
  await Promise.all([
    setTTSEnabled(ttsEnabled),
    setTTSProvider(ttsProvider),
    setVoice(voice),
    setSSMLEnabled(ssmlEnabled),
    setElevenLabsApiKey(elevenLabsApiKey),
    setElevenLabsVoiceId(elevenLabsVoiceId),
    setElevenLabsModel(elevenLabsModel),
    setResponseSplitting(responseSplitting),
    setCustomTTSEndpoint(customTTSEndpoint),
    setCustomTTSModel(customTTSModel),
    setCustomTTSVoice(customTTSVoice),
    setCustomTTSHeaders(customTTSHeaders)
  ])
}
