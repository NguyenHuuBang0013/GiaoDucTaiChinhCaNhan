import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const jsx=readFileSync(new URL('../src/pages/EntityPage.jsx', import.meta.url), 'utf8');

test('search fields reserve space for the magnifying glass despite global input styling', () => {
  const selector='.list-toolbar .list-search input:not([type=radio]):not([type=checkbox]):not([type=range])';
  const rules=css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  const matching=[...rules].filter(([,sel])=>sel.trim()===selector).map(([, ,body])=>body);
  assert.equal(matching.length,2);
  for(const rule of matching) {
    assert.match(rule,/padding\s*:\s*10px\s+(?:12|14)px\s+10px\s+46px\s*;?/);
  }
  assert.match(css,/\.list-search-icon\{[^}]*left:14px;[^}]*width:18px;/);
  assert.match(jsx,/className="list-search-icon"/);
  assert.match(jsx,/className="list-search"/);
});
