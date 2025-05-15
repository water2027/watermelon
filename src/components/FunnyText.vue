<script lang="ts" setup>
import { useTemplateRef, onMounted } from 'vue'

import { renderParticleText } from '@/composables/useParticleText'

import words from '@/assets/1.lrc?raw'

const { width, height, fontSize } = defineProps<{
  width?: number
  height?: number
  fontSize?: number
}>()

const audio = useTemplateRef<HTMLAudioElement>('audio')

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

const lrc = parseLRC(words)

const textGenerator = () => {
  let currentLRC = lrc[0]
  let nextLRC = lrc[1]
  let index = 0
  const len = lrc.length
  const audioElement = audio.value
  if (!audioElement) {
    return () => 'No audio element found'
  }
  return () => {
    const currentTime = audioElement.currentTime
    if (currentLRC.time <= currentTime && nextLRC.time > currentTime) {
      return currentLRC.text
    }
    while (currentLRC.time > currentTime && index > 0) {
      nextLRC = lrc[index]
      index--
      currentLRC = lrc[index]
    }
    while (nextLRC.time <= currentTime && index < len - 1) {
      currentLRC = lrc[index]
      index++
      nextLRC = lrc[index]
    }
    if(index === len-1 && nextLRC.time <= currentTime) {
      return lrc[index].text
    }
    return currentLRC.text
  }
}

function parseLRC(lrcContent: string) {
  const lines = lrcContent.split('\n')

  const lyrics = []

  for (const line of lines) {
    const match = line.match(/\[(\d{2}:\d{2}\.\d+)\](.*)/)
    if (match) {
      const time = match[1]
      const text = match[2].trim()
      const [minutes, seconds] = time.split(':')
      const totalSeconds = parseInt(minutes) * 60 + parseFloat(seconds)
      lyrics.push({ time: totalSeconds, text })
    }
  }
  console.log(lyrics)
  return lyrics
}

onMounted(() => {
  if (!canvas.value) {
    console.error('canvas is null')
    return
  }
  const { draw } = renderParticleText(canvas.value, { width, height, fontSize, textGenerator })
  draw()
})
</script>

<template>
  <div class="flex flex-col">
    <canvas class="absolute" ref="canvas"></canvas>
    <audio src="/1.mp3" controls ref="audio">
      <source src="/2.mp3" type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  </div>
</template>
