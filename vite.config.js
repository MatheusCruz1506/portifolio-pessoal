<<<<<<< HEAD
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
=======
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
>>>>>>> e96f3ccaca6b33969908730f936a61e0b7a9c798

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
