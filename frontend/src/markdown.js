import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Repository prose remains untrusted even in a bundled snapshot.
export function renderMarkdown(source, sourcePath, sourceUrl, documents = []) {
  const container = document.createElement('div');
  container.innerHTML = DOMPurify.sanitize(sourcePath.endsWith('.yaml') ? `<pre><code>${escapeHTML(source)}</code></pre>` : marked.parse(source), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['img', 'input', 'form', 'button', 'style', 'iframe'],
    FORBID_ATTR: ['style', 'id', 'name'],
  });
  for (const link of container.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    if (!href) continue;
    if (href.startsWith('#')) { link.removeAttribute('href'); continue; }
    try {
      const resolved = new URL(href, `${sourceUrl}/${sourcePath}`);
      if (!['https:', 'http:'].includes(resolved.protocol)) { link.removeAttribute('href'); continue; }
      const known = documents.find(doc => resolved.href.split('#')[0] === `${sourceUrl}/${doc.path}`);
      if (known) link.href = `#/docs/${known.id}`;
      else { link.href = resolved.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    } catch { link.removeAttribute('href'); }
  }
  return container.innerHTML;
}
