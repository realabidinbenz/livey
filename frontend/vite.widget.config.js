import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        'process.env.NODE_ENV': '"production"'
    },
    build: {
        lib: {
            entry: 'src/widget/index.jsx',
            name: 'LiveyWidget',
            fileName: () => 'livey-widget.js',
            formats: ['iife']
        },
        outDir: 'dist/widget',
        cssCodeSplit: false,       // Inline CSS into JS
        minify: 'esbuild',
        rollupOptions: {
            output: {
                inlineDynamicImports: true
            }
        }
    }
})
