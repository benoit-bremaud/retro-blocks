// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Browser, clock and global-object access the domain must never use (ADR-0004, component diagram).
const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'performance',
  'requestAnimationFrame',
  'setTimeout',
  'setInterval',
  'AudioContext',
  'fetch',
  'globalThis',
].map((name) => ({ name, message: 'The domain never uses browser APIs: go through a port.' }));

// Imports the domain may make: its own modules only, never an adapter or the composition root.
const DOMAIN_IMPORT_PATTERNS = [
  {
    regex: '^(?!\\.{1,2}/)',
    message:
      'The domain imports only its own modules: no package, no Node built-in (component diagram, ADR-0004).',
  },
  {
    group: ['**/adapters/**', '**/app/**'],
    message: 'The domain depends only on its ports (component diagram, ADR-0004).',
  },
];

// Syntax banned in all linted code except the root tool configuration files (security-policy INJ-3,
// owner rules). Flat config replaces rule options per file, so the source override repeats it.
const RESTRICTED_SYNTAX = [
  // Named exports only (owner rule).
  { selector: 'ExportDefaultDeclaration', message: 'Use named exports only.' },
  // HTML injection sinks (security-policy INJ-3): the game draws on a canvas only.
  {
    selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]',
    message: 'No HTML injection sink: build DOM nodes or draw on the canvas (INJ-3).',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(insertAdjacentHTML|setHTMLUnsafe|createContextualFragment)$/]',
    message: 'No HTML injection sink: build DOM nodes or draw on the canvas (INJ-3).',
  },
  {
    // document.write only: clipboard.write or a file stream's write are legitimate.
    selector:
      "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
    message: 'No HTML injection sink: build DOM nodes or draw on the canvas (INJ-3).',
  },
];

export default defineConfig(
  {
    ignores: ['dist/', 'coverage/', 'node_modules/'],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Code execution from data (security-policy INJ-4).
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      // A leading underscore marks a parameter an implementation deliberately ignores.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
    },
  },
  {
    // No allocation inside the game loop (CLAUDE.md): a `for...of` over an array allocates an
    // iterator in every V8 tier below TurboFan (measured in retro-shmup, ADR-0004), so source code uses index
    // loops, which never allocate.
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-for-of': 'off',
      'no-restricted-syntax': [
        'error',
        ...RESTRICTED_SYNTAX,
        {
          selector: 'ForOfStatement',
          message: 'Use an index loop: for...of allocates an iterator (no allocation in the loop).',
        },
      ],
    },
  },
  {
    // Tool configuration files must export a default object and run under Node.
    files: ['*.config.ts', '*.config.mjs'],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // Plain JavaScript configuration files are not type-checked.
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...BROWSER_GLOBALS,
        { name: 'Date', message: 'Inject a Clock (deterministic simulation).' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Inject the seeded Prng (deterministic simulation).',
        },
      ],
      'no-restricted-imports': ['error', { patterns: DOMAIN_IMPORT_PATTERNS }],
    },
  },
  {
    files: ['src/adapters/**/*.ts'],
    languageOptions: { globals: globals.browser },
    rules: {
      // Only the composition root touches these; adapters receive narrow injected interfaces
      // (component diagram, ADR-0004).
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'requestAnimationFrame'].map((name) => ({
          name,
          message:
            'Adapters receive browser objects from src/app/main.ts (component diagram, ADR-0004).',
        })),
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/app/**'], message: 'Adapters never import the composition root.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
);
