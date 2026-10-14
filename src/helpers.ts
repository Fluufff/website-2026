import { marked } from 'marked'

export function render_markdown(markdown: string): string {
  return marked.parse(markdown.replaceAll('\n', '<br />'), { breaks: true }) as string
}
