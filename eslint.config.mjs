// ESLint flat config (ESLint v10+)
//
// Source pattern: open-mercato/open-mercato eslint.config.mjs
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files
//
// Uses eslint-config-next flat-config export (Next.js 16+).
// Run: yarn lint  →  eslint .

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const ignores = [
  'node_modules/**',
  '.next/**',
  '**/.next/**',
  '.mercato/**',
  '**/.mercato/**',
  'dist/**',
  '**/dist/**',
  'out/**',
  'build/**',
  'generated/**',
  '**/generated/**',
  'next-env.d.ts',
  // Generated SDK dirs from `pulumi package add`
  'sdks/**',
]

const ruleOverrides = {
  // Display names are redundant in a server-components-first codebase
  'react/display-name': 'off',

  // React Hooks experimental rules not yet stable — keep off
  'react-hooks/immutability': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/refs': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/static-components': 'off',
}

export default [
  ...nextCoreWebVitals,
  { ignores },
  { name: 'project/rule-overrides', rules: ruleOverrides },
]
