import { useEffect, useState } from "react"
import { notification } from "antd"
import {
  getElevenLabsApiKey,
  getElevenLabsModel,
  getElevenLabsVoiceId,
  getTTSProvider,
  getVoice,
  isSSMLEnabled,
  getCustomTTSEndpoint,
  getCustomTTSHeaders,
  getCustomTTSModel,
  getCustomTTSVoice
} from "@/services/tts"
import { markdownToSSML } from "@/utils/markdown-to-ssml"
import { generateSpeech } from "@/services/elevenlabs"
import { splitMessageContent } from "@/utils/tts"

export interface VoiceOptions {
  utterance: string
}

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  )

  const speak = async ({ utterance }: VoiceOptions) => {
    try {
      const voice = await getVoice()
      const provider = await getTTSProvider()

      if (provider === "browser") {
        const isSSML = await isSSMLEnabled()
        if (isSSML) {
          utterance = markdownToSSML(utterance)
        }
        if (import.meta.env.BROWSER === "chrome") {
          chrome.tts.speak(utterance, {
            voiceName: voice,
            onEvent(event) {
              if (event.type === "start") {
                setIsSpeaking(true)
              } else if (event.type === "end") {
                setIsSpeaking(false)
              }
            }
          })
        } else {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(utterance))
          window.speechSynthesis.onvoiceschanged = () => {
            const voices = window.speechSynthesis.getVoices()
            const voice = voices.find((v) => v.name === voice)
            const utter = new SpeechSynthesisUtterance(utterance)
            utter.voice = voice
            window.speechSynthesis.speak(utter)
          }
        }
      } else if (provider === "elevenlabs") {
        const apiKey = await getElevenLabsApiKey()
        const modelId = await getElevenLabsModel()
        const voiceId = await getElevenLabsVoiceId()
        const sentences = splitMessageContent(utterance)
        let nextAudioData: ArrayBuffer | null = null
        if (!apiKey || !modelId || !voiceId) {
          throw new Error("Missing ElevenLabs configuration")
        }
        for (let i = 0; i < sentences.length; i++) {
          setIsSpeaking(true)

          let currentAudioData =
            nextAudioData ||
            (await generateSpeech(apiKey, sentences[i], voiceId, modelId))
            
          if (i < sentences.length - 1) {
            generateSpeech(apiKey, sentences[i + 1], voiceId, modelId)
              .then((nextAudioData) => {
                nextAudioData = nextAudioData
              })
              .catch(console.error)
          }

          const blob = new Blob([currentAudioData], { type: "audio/mpeg" })
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          setAudioElement(audio)

          await new Promise((resolve) => {
            audio.onended = resolve
            audio.play()
          })

          URL.revokeObjectURL(url)
        }

        setIsSpeaking(false)
        setAudioElement(null)
      } else if (provider === "custom") {
        try {
          const endpoint = await getCustomTTSEndpoint()
          const headers = await getCustomTTSHeaders()
          const sentences = splitMessageContent(utterance)

          if (!endpoint) {
            throw new Error("Missing Custom TTS endpoint configuration")
          }

          for (let i = 0; i < sentences.length; i++) {
            setIsSpeaking(true)

            const requestBody = {
              input: sentences[i],
              model: await getCustomTTSModel(),
              voice: await getCustomTTSVoice(),
              speed: 1
            }
            console.log('Custom TTS Request:', {
              endpoint,
              headers: { ...JSON.parse(headers || '{}'), "Content-Type": "application/json" },
              body: requestBody
            })
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                ...JSON.parse(headers || '{}'),
                "Content-Type": "application/json"
              },
              body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
              throw new Error(`Failed to generate speech: ${response.statusText}`)
            }

            const jsonResponse = await response.json()
            console.log('Custom TTS Response:', jsonResponse)
            const audioUrl = jsonResponse.url || jsonResponse.audio_url

            if (!audioUrl) {
              throw new Error("No audio URL in response")
            }

            // Validate audio URL format
            try {
              new URL(audioUrl)
            } catch (e) {
              throw new Error(`Invalid audio URL format: ${audioUrl}`)
            }

            const audioResponse = await fetch(audioUrl)
            if (!audioResponse.ok) {
              throw new Error(`Failed to fetch audio data: ${audioResponse.statusText} (${audioResponse.status})`)
            }

            const contentType = audioResponse.headers.get('content-type')
            if (!contentType || !contentType.includes('audio/')) {
              throw new Error(`Invalid content type: ${contentType || 'unknown'}`)
            }

            const audioData = await audioResponse.arrayBuffer()
            if (!audioData || audioData.byteLength === 0) {
              throw new Error('Received empty audio data')
            }

            const blob = new Blob([audioData], { type: contentType })
            const url = URL.createObjectURL(blob)
            const audio = new Audio()
            
            audio.onerror = (e) => {
              console.error('Audio playback error:', e)
              URL.revokeObjectURL(url)
              throw new Error(`Failed to play audio: ${e.type}`)
            }

            audio.src = url
            setAudioElement(audio)

            try {
              await new Promise((resolve, reject) => {
                audio.onended = () => {
                  URL.revokeObjectURL(url)
                  resolve(void 0)
                }
                audio.onerror = (e) => {
                  URL.revokeObjectURL(url)
                  reject(new Error(`Audio playback failed: ${e.type}`))
                }
                audio.play().catch(reject)
              })
            } catch (error) {
              URL.revokeObjectURL(url)
              throw error
            }

            URL.revokeObjectURL(url)
          }

          setIsSpeaking(false)
          setAudioElement(null)
        } catch (error) {
          setIsSpeaking(false)
          setAudioElement(null)
          console.error('Custom TTS error:', error)
          throw error
        }
      }
    } catch (error) {
      setIsSpeaking(false)
      setAudioElement(null)
      notification.error({
        message: "Error",
        description: "Something went wrong while trying to play the audio"
      })
    }
  }

  const cancel = () => {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      setAudioElement(null)
      setIsSpeaking(false)
      return
    }

    if (import.meta.env.BROWSER === "chrome") {
      chrome.tts.stop()
    } else {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  useEffect(() => {
    return () => {
      cancel()
    }
  }, [])

  return {
    speak,
    cancel,
    isSpeaking
  }
}
