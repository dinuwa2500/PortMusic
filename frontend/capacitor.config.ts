import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Port.free',
  appName: 'Port Music',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
