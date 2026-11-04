<template>
  <div class="accordion" :class="[{ collapsible, alwaysOpen, faq }, props['class']]" ref="parent">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ alwaysOpen?: boolean; class?: string; faq?: boolean; multipleCanBeOpen?: boolean }>()

const collapsible = ref(false)
const parent = ref<HTMLElement | null>(null)

const emit = defineEmits<{ change: [index: number] }>()

let qaElements: [Element, Element][] = []

onMounted(() => {
  collapsible.value = true
  if (!parent.value) return

  const headers: Element[] = []
  const contents: Element[] = []

  parent.value.querySelectorAll('.accordion-item__header').forEach((e) => headers.push(e))
  parent.value.querySelectorAll('.accordion-item__content').forEach((e) => contents.push(e))

  qaElements = headers.map((q, i) => [q, contents[i]!])
  qaElements.forEach(([q, a], i) => {
    q.addEventListener('click', () => {
      clicked(q, a)
      emit('change', i)
    })
  })

  if (props.alwaysOpen) {
    const firstElement = qaElements[0]
    if (firstElement) {
      clicked(firstElement[0], firstElement[1])
      emit('change', 0)
    }
  }
})

function clicked(q: Element, a: Element) {
  const isActive = q.classList.contains('active')

  if (isActive && props.alwaysOpen) return

  if (!props.multipleCanBeOpen) {
    qaElements.forEach(([q, a]) => {
      q.classList.remove('active')
      a.classList.remove('active')
    })
  }

  if (!isActive) {
    q.classList.add('active')
    a.classList.add('active')
  } else if (props.multipleCanBeOpen) {
    q.classList.remove('active')
    a.classList.remove('active')
  }
}
</script>

<style lang="scss">
@mixin collapsible {
  .accordion-item__header {
    cursor: pointer;
    > [data-icon] {
      visibility: visible;
      transform: rotate(45deg);
      transition:
        transform 0.3s ease-out,
        opacity 0.15s ease-in-out;
    }

    &.active {
      > [data-icon] {
        transform: rotate(0deg);
      }
    }
  }
  .accordion-item__content {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    visibility: hidden;
    transition:
      grid-template-rows 0.3s ease-out,
      visibility 0.3s ease-out,
      opacity 0.3s ease-out;

    &.active {
      grid-template-rows: 1fr;
      opacity: 1;
      visibility: visible;
    }
  }
}

.accordion {
  display: flex;
  flex-direction: column;

  &.collapsible.alwaysOpen .accordion-item__header.active {
    cursor: default;

    > [data-icon] {
      opacity: 0;
    }
  }

  &.faq.collapsible {
    @include collapsible;
  }

  @media (min-width: 900px) {
    &.collapsible {
      @include collapsible;
    }
  }

  .accordion-item__header {
    display: flex;
    flex-direction: row;
    gap: 10px;
    padding: 30px 10px;

    > span {
      flex: 1;
    }

    > [data-icon] {
      user-select: none;
      margin-left: 16px;
      display: block;
      visibility: hidden;
    }
  }

  .accordion-item__content {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    gap: 24px;
    height: auto;
    overflow: hidden;

    > .accordion-item__content__inner {
      transition: padding 0.3s ease-out;
      padding: 0 32px 0px 40px;
      overflow: hidden;
    }

    &.active {
      > .accordion-item__content__inner {
        padding-bottom: 30px;
      }
    }
  }
}
</style>
