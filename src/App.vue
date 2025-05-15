<script lang="ts" setup>
import FunnyText from '@/components/FunnyText.vue'

const fontSize = 40 * devicePixelRatio
</script>

<template>
  <FunnyText :width="1400" :height="600" :font-size="fontSize" />
</template>
