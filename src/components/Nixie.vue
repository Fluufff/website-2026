<template>
  <svg
    class="nixie"
    viewBox="0 0 180 279"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :width="width"
    :height="Number(width) * 1.55"
    :aria-label="`IN-12 Nixie tube displaying ${digit ?? 'nothing'}`"
  >
    <defs>
      <clipPath :id="id('chamber-clip')">
        <rect x="27" y="39" width="126" height="204" rx="42" />
      </clipPath>

      <radialGradient :id="id('interior')">
        <stop offset="0" stop-color="#633020" />
        <stop offset=".65" stop-color="#361914" />
        <stop offset="1" stop-color="#120d0d" />
      </radialGradient>

      <radialGradient :id="id('gas-light')">
        <stop offset="0" stop-color="#ff7519" stop-opacity=".36" />
        <stop offset=".45" stop-color="#ff4b08" stop-opacity=".14" />
        <stop offset="1" stop-color="#ff3000" stop-opacity="0" />
      </radialGradient>

      <linearGradient :id="id('cathode-metal')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c58b72" />
        <stop offset=".25" stop-color="#55352c" />
        <stop offset=".55" stop-color="#a66b57" />
        <stop offset="1" stop-color="#35201c" />
      </linearGradient>

      <linearGradient :id="id('glass')" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#b8c0bf" stop-opacity=".9" />
        <stop offset=".09" stop-color="#f5f2e8" stop-opacity=".55" />
        <stop offset=".22" stop-color="#352b28" stop-opacity=".35" />
        <stop offset=".55" stop-color="#4a211b" stop-opacity=".12" />
        <stop offset=".85" stop-color="#20191a" stop-opacity=".45" />
        <stop offset=".95" stop-color="#f8f6ef" stop-opacity=".65" />
        <stop offset="1" stop-color="#8c9697" stop-opacity=".85" />
      </linearGradient>

      <pattern :id="id('mesh')" width="6.5" height="6.5" patternUnits="userSpaceOnUse">
        <path d="M0 0H6.5 M0 0V6.5" stroke="#241b18" stroke-width=".75" opacity=".75" />
        <path d="M0 1H6.5 M1 0V6.5" stroke="#a77d65" stroke-width=".28" opacity=".4" />
      </pattern>

      <filter :id="id('gas-halo')" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="5.5" />
      </filter>

      <filter :id="id('inner-glow')" x="-70%" y="-70%" width="240%" height="240%" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1.7" />
      </filter>

      <filter :id="id('discharge')" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".035 .085" numOctaves="3" seed="12" result="noise">
          <animate v-if="flicker" attributeName="seed" values="12;14;11;15;12" dur="3.7s" repeatCount="indefinite" />
        </feTurbulence>

        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />

        <feGaussianBlur stdDeviation="2.4" />
      </filter>

      <filter :id="id('reflection-blur')">
        <feGaussianBlur stdDeviation="1.2" />
      </filter>
    </defs>

    <rect
      x="25"
      y="35"
      width="130"
      height="211"
      rx="44"
      :fill="`url(#${id('interior')})`"
      stroke="#4b3933"
      stroke-width="2"
    />

    <g :clip-path="`url(#${id('chamber-clip')})`">
      <g fill="none" stroke="#977260" opacity=".55">
        <path d="M43 43V232 M137 43V232" stroke-width="1.5" />
        <path d="M51 230L71 205 M129 230L109 205" />
        <path d="M44 60H136 M44 220H136" opacity=".45" />
      </g>

      <ellipse
        v-if="activePath"
        cx="90"
        cy="140"
        rx="78"
        ry="122"
        :fill="`url(#${id('gas-light')})`"
        :opacity="Number(brightness) * 0.8"
      />

      <g v-for="layer in cathodeLayers" :key="layer.digit" :transform="`translate(${layer.offsetX} ${layer.offsetY})`">
        <path
          :d="layer.path"
          fill="none"
          stroke="#170e0c"
          :stroke-width="layer.strokeWidth + 1.4"
          stroke-linejoin="round"
          stroke-linecap="round"
          :opacity="layer.opacity * 0.8"
        />

        <path
          :d="layer.path"
          fill="none"
          :stroke="`url(#${id('cathode-metal')})`"
          :stroke-width="layer.strokeWidth"
          stroke-linejoin="round"
          stroke-linecap="round"
          :opacity="layer.opacity"
        />

        <path
          v-if="activePath && layer.digit !== Number(digit)"
          :d="layer.path"
          fill="none"
          stroke="#f17a32"
          stroke-width=".65"
          stroke-linejoin="round"
          :opacity="layer.reflection"
        />

        <g
          v-if="layer.digit === Number(digit)"
          class="neon-discharge"
          :style="{
            '--brightness': brightness,
            animationPlayState: flicker ? 'running' : 'paused'
          }"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="layer.path" stroke="#ff4500" stroke-width="18" opacity=".55" :filter="`url(#${id('gas-halo')})`" />

          <path :d="layer.path" stroke="#ff6b00" stroke-width="10" opacity=".8" :filter="`url(#${id('discharge')})`" />

          <path :d="layer.path" stroke="#ff7c0b" stroke-width="7" opacity=".95" :filter="`url(#${id('inner-glow')})`" />

          <path :d="layer.path" stroke="#ff951c" stroke-width="4.7" />

          <path :d="layer.path" stroke="#ffe16a" stroke-width="2.1" opacity=".95" />
        </g>
      </g>

      <rect v-if="showMesh" x="29" y="40" width="122" height="200" :fill="`url(#${id('mesh')})`" opacity=".88" />

      <rect
        x="32"
        y="43"
        width="116"
        height="194"
        rx="38"
        fill="none"
        stroke="#926c58"
        stroke-width="1.5"
        opacity=".55"
      />

      <path
        d="M38 69 Q38 42 67 38
           Q43 60 42 109 L42 181
           Q35 159 35 108Z"
        fill="#fff"
        opacity=".16"
        :filter="`url(#${id('reflection-blur')})`"
      />

      <path
        d="M115 40 Q143 47 148 75 L147 112
           Q140 67 115 40"
        fill="#fff"
        opacity=".23"
      />

      <path d="M44 205 Q54 232 82 239" stroke="#f4b89a" stroke-width="2" fill="none" opacity=".13" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    digit: string
    width?: string
    brightness?: string
    flicker?: boolean
    showMesh?: boolean
  }>(),
  {
    width: '60',
    brightness: '1',
    flicker: true,
    showMesh: true
  }
)

const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '_')
const id = (name: string) => `nixie-${instanceId}-${name}`

const paths: Record<number, string> = {
  0: 'M90 73 C53 73 50 112 50 140 C50 174 61 207 91 207 C125 207 131 173 131 139 C131 103 121 73 90 73Z',
  1: 'M73 102 L98 76 L98 207',
  2: 'M53 104 C56 66 128 63 129 105 C131 133 107 150 86 170 L54 203 L132 203',
  3: 'M57 82 C79 69 124 74 126 104 C128 126 111 138 89 139 C113 137 132 151 130 176 C128 213 78 218 53 196',
  4: 'M113 207 L113 75 L49 164 L137 164',
  5: 'M129 77 L61 77 L56 137 C79 119 129 127 130 166 C132 211 77 219 52 194',
  6: 'M119 80 C77 65 55 111 55 161 C55 195 73 210 97 208 C128 207 136 175 122 153 C109 133 75 135 57 159',
  7: 'M49 79 L134 79 L77 207',
  8: 'M90 72 C46 72 46 133 90 138 C136 142 137 72 90 72 M90 138 C40 138 42 210 90 210 C140 210 139 138 90 138',
  9: 'M121 130 C107 151 73 151 58 130 C40 102 60 71 92 71 C124 71 135 96 129 133 C124 169 106 197 67 207'
}

const activePath = computed(() => (props.digit === null ? null : (paths[Number(props.digit)] ?? null)))

const stackingOrder = [1, 7, 4, 2, 3, 5, 0, 6, 9, 8]

const cathodeLayers = computed(() =>
  stackingOrder.map((digit, index) => {
    const depth = index / (stackingOrder.length - 1)

    return {
      digit,
      path: paths[digit],

      // meshes are not perfectly stacked
      offsetX: (depth - 0.5) * 3.2,
      offsetY: (depth - 0.5) * 1.5,

      // front cathodes are more visible.
      opacity: 0.17 + depth * 0.31,
      strokeWidth: 1.2 + depth * 0.65,

      // light reflected onto unlit cathodes.
      reflection: 0.045 + depth * 0.08
    }
  })
)
</script>

<style scoped>
.nixie {
  display: block;
  overflow: visible;
  user-select: none;
}

.neon-discharge {
  opacity: var(--brightness, 1);
  animation: discharge-flicker 4.7s infinite;
}

@keyframes discharge-flicker {
  0%,
  16%,
  18%,
  47%,
  49%,
  78%,
  100% {
    opacity: var(--brightness, 1);
  }

  17% {
    opacity: calc(var(--brightness, 1) * 0.94);
  }

  48% {
    opacity: calc(var(--brightness, 1) * 0.97);
  }

  79% {
    opacity: calc(var(--brightness, 1) * 0.91);
  }
}

@media (prefers-reduced-motion: reduce) {
  .neon-discharge {
    animation: none;
  }
}
</style>
