const t = require('@json-schema-org/tests');
const d7 = t.loadSync({draft: 'draft7'});
const d6 = t.loadSync({draft: 'draft6'});
const files7 = new Set(d7.map(f => f.file));
const files6 = new Set(d6.map(f => f.file));
console.log('Draft 6-only files:', [...files6].filter(f => !files7.has(f)));
console.log('\nDraft 7-only files:', [...files7].filter(f => !files6.has(f)));
