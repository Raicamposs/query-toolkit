import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'common/index': 'src/common/index.ts',
    'common/types/index': 'src/common/types/index.ts',
    'converters/index': 'src/converters/index.ts',
    'mappers/index': 'src/mappers/index.ts',
    'query-operator/index': 'src/query-operator/index.ts',
    'rsql-parse/index': 'src/rsql-parse/index.ts',
    'sql-builder/index': 'src/sql-builder/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
})
