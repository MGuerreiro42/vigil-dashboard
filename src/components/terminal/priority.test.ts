import { describe, expect, it } from 'vitest'
import { metaPieces, PRIORITY_CLASS } from './priority'

describe('PRIORITY_CLASS', () => {
  it('hides p2 below 600px and p3 below 1024px', () => {
    expect(PRIORITY_CLASS).toEqual({ p1: '', p2: 'max-sm:hidden', p3: 'max-lg:hidden' })
  })
})

describe('metaPieces', () => {
  it('keeps every segment on wide screens and the first two on phones', () => {
    const pieces = metaPieces(['falcon 9', 'spacex', 'sex 19/10 16:41', 'slc-40'])
    expect(pieces.map((piece) => piece.text)).toEqual(['falcon 9', 'spacex', 'sex 19/10 16:41', 'slc-40'])
    expect(pieces.map((piece) => piece.phone)).toEqual([true, true, false, false])
    expect(pieces.map((piece) => piece.phoneLast)).toEqual([false, true, false, false])
  })

  it('skips empty and p2 segments when choosing the phone ones', () => {
    const pieces = metaPieces([{ text: 'spacex', priority: 'p2' }, null, 'falcon 9', '', 'sex 16:41', 'slc-40'])
    expect(pieces.map((piece) => piece.text)).toEqual(['spacex', 'falcon 9', 'sex 16:41', 'slc-40'])
    expect(pieces.map((piece) => piece.phone)).toEqual([false, true, true, false])
    expect(pieces.map((piece) => piece.phoneFirst)).toEqual([false, true, false, false])
    expect(pieces.map((piece) => piece.phoneLast)).toEqual([false, false, true, false])
  })

  it('marks a single segment as both first and last', () => {
    expect(metaPieces(['wikipedia'])).toEqual([{ text: 'wikipedia', phone: true, phoneFirst: true, phoneLast: true }])
  })
})
