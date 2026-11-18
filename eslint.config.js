/**
 * Regeln fuer die statische Pruefung: `npm run lint`.
 *
 * `tsc` prueft Typen. Der Linter prueft, was Typen nicht sehen koennen: ob
 * Hooks ueberall nach denselben Regeln aufgerufen werden, ob eine
 * Abhaengigkeitsliste vollstaendig ist, ob eine Zuweisung uebrig geblieben
 * ist. Beide gehoeren vor jede Auslieferung.
 *
 * Wo eine Regel hier abgeschwaecht ist, steht der Grund daneben. Einzelne
 * Stellen im Quelltext, die bewusst gegen eine Regel verstossen, tragen die
 * Ausnahme am Ort - mit Begruendung, damit sie nicht zur Gewohnheit wird.
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      // __APP_VERSION__ setzt der Bau ein, siehe vite.config.ts.
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // Ein Unterstrich davor heisst: absichtlich ungenutzt. Dazu die
          // Geschwister eines Rest-Musters - `const { id: _id, ...rest } = x`
          // ist die uebliche Art, Felder wegzulassen, und keine Nachlaessigkeit.
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // In Tests ist eine Zusicherung auf any manchmal der kuerzeste Weg, einen
    // kaputten Datensatz nachzustellen - genau darum geht es dort.
    files: ['**/*.test.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
)
