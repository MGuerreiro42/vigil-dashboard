import { expect, it } from 'vitest'
import { escapeHtml } from './escape-html'

it('escapes characters that could break out of HTML text or attributes', () => {
  expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
    '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;',
  )
})

it('leaves plain text untouched', () => {
  expect(escapeHtml('12 km SSW of Tokyo, Japan')).toBe('12 km SSW of Tokyo, Japan')
})
