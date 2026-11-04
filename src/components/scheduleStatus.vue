<template>
  <p class="bg-orange-200 rounded-sm p-1 event__status" :class="status">{{ status }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  date: String,
  start: String,
  end: String
})

const timestamp_now = new Date().getTime()
// const timestamp_now = new Date('2026-11-13 16:00:00').getTime()
const timestamp_start = new Date(`${props.date} ${props.start}`).getTime()
let timestamp_end = new Date(`${props.date} ${props.end}`).getTime()

// events just have a start and end time in the cms, so if the end time is before the start time we assume it is the day afterwards
if (timestamp_start > timestamp_end) {
  timestamp_end += 86400 * 1000
}

const diff_start = timestamp_start - timestamp_now
const diff_end = timestamp_end - timestamp_now

const status = ref('upcoming')

if (0 > diff_start) {
  status.value = 'live'
}

if (0 > diff_end) {
  status.value = 'past'
}

switch (status.value) {
  // @ts-ignore
  case 'upcoming':
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value
    if (diff_start < 2147483647) {
      setTimeout(() => {
        status.value = 'live'
      }, diff_start)
    }
  case 'live':
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value
    if (diff_end < 2147483647) {
      setTimeout(() => {
        status.value = 'past'
      }, diff_end)
    }
}
</script>
