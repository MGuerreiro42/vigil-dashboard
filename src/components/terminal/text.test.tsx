import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetaLine } from './text'

describe('MetaLine', () => {
  it('is one ellipsised run, so only the end of the line is cut', () => {
    const { container } = render(<MetaLine segments={['Long March 2D', 'China Aerospace Science and Technology Corporation', 'SSO']} />)
    const line = container.firstElementChild as HTMLElement
    expect(line.className).toContain('block')
    expect(line.className).toContain('text-ellipsis')
    expect(line.className).not.toContain('flex')
    expect(line.textContent).toBe('Long March 2D · China Aerospace Science and Technology Corporation · SSO')
    for (const piece of line.children) expect(piece.className).not.toMatch(/shrink|ellipsis|overflow/)
  })

  it('hides p2 segments and the leading separator below 600px', () => {
    const { container } = render(<MetaLine segments={[{ text: 'spacex', priority: 'p2' }, 'falcon 9', 'sex 16:41', 'slc-40']} />)
    const pieces = [...(container.firstElementChild as HTMLElement).children]
    expect(pieces.map((piece) => piece.className)).toEqual(['max-sm:hidden', '', '', 'max-sm:hidden'])
    expect(pieces[1].firstElementChild?.className).toBe('max-sm:hidden')
  })
})
