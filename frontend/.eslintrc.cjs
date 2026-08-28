module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh', 'unused-imports'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    // Plain JS project (no TypeScript) — PropTypes add boilerplate without real type safety, not enforced here.
    'react/prop-types': 'off',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Node-executed config files (not bundled by Vite/browser)
      files: ['vite.config.js', '.eslintrc.cjs', 'scripts/**/*.cjs'],
      env: { node: true },
    },
    {
      // Service worker runs in its own global scope
      files: ['public/sw.js'],
      env: { serviceworker: true, browser: true },
    },
  ],
}

