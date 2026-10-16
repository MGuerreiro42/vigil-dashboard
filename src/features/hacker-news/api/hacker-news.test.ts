import { expect, it } from 'vitest'
import { parseFrontPage } from './hacker-news'

it('maps front-page hits, with the domain for links and none for text posts', () => {
  expect(parseFrontPage({ hits: [
    { objectID: '501', title: 'Tesla Roadster', url: 'https://www.tesla.com/roadster', author: 'shekhar101', points: 412, num_comments: 380, created_at_i: 1792180000 },
    { objectID: '502', title: 'Ask HN: What are you working on?', url: null, author: 'whoishiring', points: null, num_comments: null, created_at_i: 1792170000 },
  ] })).toEqual([
    { id: '501', title: 'Tesla Roadster', url: 'https://www.tesla.com/roadster', domain: 'tesla.com', author: 'shekhar101', points: 412, comments: 380, createdAt: 1792180000, discussionUrl: 'https://news.ycombinator.com/item?id=501' },
    { id: '502', title: 'Ask HN: What are you working on?', url: null, domain: null, author: 'whoishiring', points: 0, comments: 0, createdAt: 1792170000, discussionUrl: 'https://news.ycombinator.com/item?id=502' },
  ])
})
