import { expect, test } from 'vitest';
import { renderMarkdown } from './markdown.js';

test('repo Markdown cannot execute active content and relative docs resolve safely', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n[Policy](03.md)\n\n**Hello**', 'docs/README.md', 'https://github.com/example/repo/blob/abc', [{id:'policy',path:'docs/03.md'}]);
  const el = document.createElement('div'); el.innerHTML = html;
  expect(el.querySelector('script')).toBeNull();
  expect(el.querySelector('a')?.hasAttribute('href')).toBe(false);
  expect(el.querySelectorAll('a')[1].getAttribute('href')).toBe('#/docs/policy');
  expect(el.querySelector('strong').textContent).toBe('Hello');
});
