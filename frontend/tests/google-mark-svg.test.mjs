import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../src/pages/LoginPage.jsx', import.meta.url), 'utf8');
test('Google login mark uses the complete red segment path', () => {
  assert.match(source, /C35\.9 2\.5 30\.4 0 24 0C14\.6 0 6\.5 5\.4 2\.6 13\.3l7\.9 6\.1/);
  assert.doesNotMatch(source, /24 0 14\.6 5\.4 6\.5 13\.3/);
});

test('Both Google login entry points share the same icon', () => {
  assert.equal((source.match(/<GoogleMark\s*\/>/g) || []).length, 2);
});
