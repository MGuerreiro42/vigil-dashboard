import { expect, it } from 'vitest'
import { feedDate, parseFeaturedFeed } from './wikimedia-feed'

const page = (title: string, extra: object = {}) => ({ title, description: `${title} description`, ...extra })

it('strips HTML from headlines and anchors each on a page with a thumbnail', () => {
  const feed = parseFeaturedFeed({
    news: [{
      story: '<!--Oct 16--> <a href="./Navi_Pillay">Navi Pillay</a> is awarded the <b>Nobel Peace Prize</b>.',
      links: [page('Nobel_Peace_Prize'), page('Navi_Pillay', { thumbnail: { source: 'https://img/pillay.jpg' } })],
    }],
  }, 'en', new Date(2026, 9, 17))
  expect(feed.headlines).toEqual([{
    id: '0-Navi_Pillay',
    text: 'Navi Pillay is awarded the Nobel Peace Prize.',
    date: '2026-10-16',
    article: {
      title: 'Navi Pillay',
      description: 'Navi_Pillay description',
      url: 'https://en.wikipedia.org/wiki/Navi_Pillay',
      thumbnail: 'https://img/pillay.jpg',
    },
  }])
})

it('splits the date prefix of Portuguese current-events entries', () => {
  const [headline] = parseFeaturedFeed({
    news: [{ story: '11 de outubro de 2026 - Paramount conclui a aquisição da Warner Bros.', links: [page('Paramount')] }],
  }, 'pt').headlines
  expect(headline).toMatchObject({ date: '2026-10-11', text: 'Paramount conclui a aquisição da Warner Bros.' })
  expect(headline.article?.url).toBe('https://pt.wikipedia.org/wiki/Paramount')
})

it('dates an en story from the previous year when its month is still ahead', () => {
  const [headline] = parseFeaturedFeed({ news: [{ story: '<!--Dec 30-->Fireworks.', links: [] }] }, 'en', new Date(2027, 0, 2)).headlines
  expect(headline.date).toBe('2026-12-30')
})

it('leaves the date empty when a story carries none', () => {
  const [headline] = parseFeaturedFeed({ news: [{ story: 'Undated story.', links: [] }] }, 'en').headlines
  expect(headline.date).toBeNull()
})

it('drops special pages from most-read, re-ranks and keeps the view history', () => {
  const { trending } = parseFeaturedFeed({
    mostread: {
      articles: [
        { ...page('Main_Page'), rank: 1, views: 900_000 },
        { ...page('Special:Search'), rank: 2, views: 500_000 },
        { ...page('GBU-43/B_MOAB'), rank: 3, views: 453_110, view_history: [{ views: 1_000 }, { views: 453_110 }] },
      ],
    },
  }, 'en')
  expect(trending).toHaveLength(1)
  expect(trending[0]).toMatchObject({ title: 'GBU-43/B MOAB', rank: 1, views: 453_110, history: [1_000, 453_110] })
})

it('orders "on this day" from most recent', () => {
  const { onThisDay } = parseFeaturedFeed({
    onthisday: [{ year: 1978, text: 'Older', pages: [] }, { year: 2017, text: 'Newer', pages: [page('Malta')] }],
  }, 'en')
  expect(onThisDay.map((event) => event.year)).toEqual([2017, 1978])
  expect(onThisDay[1].article).toBeNull()
})

it('builds the feed path from the UTC date', () => {
  expect(feedDate(new Date('2026-10-16T23:30:00-03:00'))).toBe('2026/10/17')
})
