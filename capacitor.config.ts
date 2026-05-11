import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.babyday.app',
  appName: 'BabyDay',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
}

export default config