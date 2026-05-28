import eslintPluginNode from 'eslint-plugin-node';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules', 'dist', 'coverage'],

    languageOptions: {
      ecmaVersion: 'latest', // Node 23 soporta ES2024+
      sourceType: 'module', // usamos import/export
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },

    plugins: {
      node: eslintPluginNode,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },

    rules: {
      ...prettierConfig.rules, // desactiva reglas que chocan con Prettier
      'prettier/prettier': 'error', // Prettier obligatorio

      // ✅ Buenas prácticas para APIs Node/Express
      'no-console': 'warn', // permitir console.log pero con warning
      eqeqeq: ['error', 'always'], // evitar == en vez de ===
      curly: 'error', // obligar a usar llaves en if/else
      'no-unused-vars': ['warn', { argsIgnorePattern: 'req|res|next' }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
        },
      ],

      // ✅ Node.js plugin
      'node/no-unsupported-features/es-syntax': 'off', // usamos ESM
      'node/no-missing-import': 'off', // para evitar falsos positivos con ESM
      'node/no-unpublished-import': 'off',
    },
  },
];
