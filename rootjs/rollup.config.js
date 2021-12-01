import vue from 'rollup-plugin-vue'
import { terser } from 'rollup-plugin-terser'
import gzip from 'rollup-plugin-gzip'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import json from '@rollup/plugin-json'
import builtins from '@erquhart/rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import embedCSS from 'rollup-plugin-embed-css'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import svg from 'rollup-plugin-svg'

const production = !process.env.ROLLUP_WATCH

// We can't really do much about circular dependencies in node_modules
function onwarn (warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    console.error(`(!) ${warning.message}`)
  }
}

const plugins = [
  vue(),
  resolve({
    mainFields: ['browser', 'jsnext', 'module', 'main'],
    include: 'node_modules/**',
    preferBuiltins: true
  }),
  babel({
    exclude: 'node_modules/**',
    runtimeHelpers: true
  }),
  commonjs({
    include: 'node_modules/**'
  }),
  json(),
  embedCSS(),
  globals(),
  builtins(),
  production && terser(),
  gzip(),
  svg({
    base64: true
  })
]

if (process.env.SERVER === 'true') {
  plugins.push(
    serve({
      host: '0.0.0.0',
      contentBase: ['dist'],
      port: process.env.PORT || 9104
    })
  )
  plugins.push(
    livereload({
      watch: 'dist'
    })
  )
}

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/main.js',
    format: 'amd',
    sourcemap: production
  },
  onwarn,
  plugins
}