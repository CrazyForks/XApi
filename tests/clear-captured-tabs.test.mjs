import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const clearHistoryProp = source.match(/onClearHistory=\{\(\) => \{(?<body>[\s\S]*?)\}\}/);

assert.ok(clearHistoryProp, 'App should pass an onClearHistory handler to Sidebar');
assert.match(
  clearHistoryProp.groups.body,
  /handleTabClose|setTabs/,
  'clearing captured history should also close tabs opened from captured requests'
);
