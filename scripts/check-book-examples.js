// Run explicit, self-contained teaching examples from the actual book.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = [
  [36, 'generator', ['(define g\n  (generator ()']],
  [36, 'dynamic-wind', ["(make-continuation-prompt-tag 'wind-demo)"]],
  [37, 'generator-state', ['(define sample']],
  [40, 'promise-cache', ['(define failures 0)']],
  [43, 'print-roundtrip', ['(define original']],
  [47, 'raco-entry', ['(define (double n)']],
  [51, 'port-validation', ['(define (string->safe-port-number', '(module+ test']],
  [52, 'sqlite-rollback', ['(check-exn exn:fail:sql?']],
  [54, 'http-response', ['(define (missing)']],
  [57, 'xexpr-escape', ['(define (items xs)']],
  [59, 'task-model', ['(define (add-task tasks title)']],
];
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'racket-book-'));
let passed = 0;
let failed = 0;
try {
  for (const [chapter, name, anchors] of manifest) {
    try {
      const source = path.join(root, 'content', 'part-' + (chapter <= 42 ? 6 : 7), chapter + '.mdx');
      const blocks = [...fs.readFileSync(source, 'utf8').matchAll(/^```racket[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm)].map(m => m[1]);
      const snippets = anchors.map(anchor => {
        const matches = blocks.filter(b => b.includes(anchor));
        if (matches.length !== 1) throw new Error('Expected one block for anchor: ' + anchor);
        return matches[0];
      });
      const text = snippets.join('\n');
      if (!text.startsWith('#lang ')) throw new Error('Example lacks #lang');
      const folder = fs.mkdtempSync(path.join(temp, name + '-'));
      const file = path.join(folder, name + '.rkt');
      fs.writeFileSync(file, text, 'utf8');
      const result = spawnSync('raco', ['test', file], {
        cwd: folder, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024
      });
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      if (result.error || result.status !== 0) throw result.error || new Error('raco test exited ' + result.status);
      console.log('[book-examples] PASS chapter ' + chapter + ': ' + name);
      passed++;
    } catch (error) {
      console.error('[book-examples] FAIL chapter ' + chapter + ': ' + name + ': ' + error.message);
      failed++;
    }
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('[book-examples] ' + passed + ' passed, ' + failed + ' failed, ' + manifest.length + ' selected examples');
if (failed) process.exitCode = 1;
