// ESLint del juego. Los archivos de src/js comparten un solo ámbito (se unen en un bloque al armar),
// así que cada archivo recibe como globales lo que usa de los demás, según herramientas/dependencias.mjs:
// de solo lectura lo que solo lee y escribible lo que cambia. Así ESLint avisa si un archivo usa o cambia
// algo de otro sin que se note.
import js from '@eslint/js';
import globals from 'globals';
import { basename } from 'node:path';
import { analyze } from './herramientas/dependencias.mjs';

const { files, info } = analyze('src');
const perFile = files.map(f => {
  const I = info.get(f);
  const g = {};
  for (const [, names] of I.uses) for (const n of names) g[n] = 'readonly';
  for (const [, names] of I.writes) for (const n of names) g[n] = 'writable';
  return {
    files: ['src/js/' + (f.includes('/fuera/') ? 'fuera/' : '') + basename(f)],
    languageOptions: { globals: g },
  };
});

export default [
  js.configs.recommended,
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: 'error',
      curly: ['error', 'all'],
      'max-len': ['error', { code: 100, ignoreUrls: true, ignoreTemplateLiterals: true }],
      'max-depth': ['error', 3],
      complexity: ['warn', 20],
      'no-shadow': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-implicit-globals': 'off',
    },
  },
  ...perFile,
  {
    files: ['*.mjs', 'herramientas/**/*.mjs', 'pruebas/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
  { ignores: ['index.html', 'node_modules/', 'material/', 'pruebas/bot.js'] },
];
