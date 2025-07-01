import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 환경변수 기반 API 설정을 사용하므로 프록시 제거
  // server: {
  //   proxy: {
  //     '/api': 'http://localhost:4000',
  //   },
  // },
})
