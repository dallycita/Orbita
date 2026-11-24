// ESLint del juego: src/js son módulos ES; cada archivo importa lo que usa de los demás, así que un nombre
// sin importar es un error (no-undef). Los íconos de src/js/fuera/ viven fuera del juego, como script normal.
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // íconos de las flechas: src/js/fuera/ los define fuera del juego, como script normal
      globals: { ...globals.browser, ARC_L: 'readonly', ARC_R: 'readonly', CHEV_L: 'readonly', CHEV_R: 'readonly' },
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
  {
    files: ['src/js/fuera/**/*.js'],
    languageOptions: { sourceType: 'script' },
  },
  {
    files: ['*.mjs', 'herramientas/**/*.mjs', 'pruebas/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
  { ignores: ['index.html', 'node_modules/', 'material/', 'pruebas/bot.js'] },
];
