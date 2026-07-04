import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node,
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^next$', ignoreRestSiblings: true }],
        },
    },
    eslintConfigPrettier,
    {
        ignores: ['node_modules', 'src/generated', 'src/logs', 'prisma/migrations'],
    },
];
