// Run explicit, self-contained teaching examples from the actual book.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = [
  [22, 'mini-interpreter', ['(struct num (value)', '(struct bool (value)', '(define (parse datum)', '(module+ test']],
  [25, 'traffic-light', ['(define (duration state)', '(module+ test']],
  [38, 'module-entry', ['(provide twice)']],

  [14, 'tail-recursion', ['(define (reverse-tail lst)']],
  [17, 'multiple-values', ['(define (division-summary n d)']],
  [19, 'pattern-matching', ['(require rackunit)']],
  [20, 'lambda-calculus', ['(struct Var (name))', '(define (free-in? name expr)', '(define (step expr)', '(module+ test']],
  [21, 'fixed-point', ['(module+ test']],
  [23, 'exceptions', ['(define (safe-divide n d)']],
  [24, 'custodian', ['(define parent (make-custodian))']],
  [27, 'class-state', ['(define counter%']],
  [29, 'task-state', ['(define milk', '(define (reopen t)']],
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
const multi = [
  [18, 'case-lambda-contract', {'report.rkt': ['(define report-cost'], 'report-test.rkt': ['(require rackunit "report.rkt")']}, 'report-test.rkt'],
  [46, 'module-contract', {'temperature.rkt': ['(define (celsius->fahrenheit c)'], 'temperature-test.rkt': ['(require rackunit "temperature.rkt")']}, 'temperature-test.rkt'],
  [42, 'local-language', {'hello.rkt': ['(define-syntax-rule (hello-module-begin'], 'main.rkt': ['#lang s-exp "hello.rkt"']}, 'main.rkt', "你好\n世界\n(+ 1 2)\n"],
];
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'racket-book-'));
let passed = 0;
let failed = 0;
try {
  for (const [chapter, name, anchors] of manifest) {
    try {
      const source = path.join(root, 'content', 'part-' + (chapter <= 22 ? 3 : chapter <= 26 ? 4 : chapter <= 34 ? 5 : chapter <= 42 ? 6 : 7), chapter + '.mdx');
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
  for (const [chapter, name, files, entry, expected] of multi) {
    try {
      const part = chapter <= 22 ? 3 : chapter <= 42 ? 6 : 7;
      const source = path.join(root, 'content', 'part-' + part, chapter + '.mdx');
      const blocks = [...fs.readFileSync(source, 'utf8').matchAll(/^```racket[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm)].map(m => m[1]);
      const folder = fs.mkdtempSync(path.join(temp, name + '-'));
      for (const [filename, anchors] of Object.entries(files)) {
        const snippets = anchors.map(anchor => {
          const matches = blocks.filter(b => b.includes(anchor));
          if (matches.length !== 1) throw new Error('Expected one block for anchor: ' + anchor);
          return matches[0];
        });
        fs.writeFileSync(path.join(folder, filename), snippets.join('\n'), 'utf8');
      }
      const result = spawnSync(expected === undefined ? 'raco' : 'racket',
        expected === undefined ? ['test', entry] : [entry],
        {cwd: folder, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024});
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      if (result.error || result.status !== 0) throw result.error || new Error('exit ' + result.status);
      if (expected !== undefined && result.stdout.replace(/\r\n/g, '\n') !== expected)
        throw new Error('Unexpected language output: ' + JSON.stringify(result.stdout));
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
console.log('[book-examples] ' + passed + ' passed, ' + failed + ' failed, ' + (manifest.length + multi.length) + ' selected examples');
if (failed) process.exitCode = 1;
