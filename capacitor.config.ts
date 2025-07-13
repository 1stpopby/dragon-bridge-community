import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1ec6278941b049c08c0b0b53b72f99af',
  appName: 'dragon-bridge-community',
  webDir: 'dist',
  server: {
    url: 'https://1ec62789-41b0-49c0-8c0b-0b53b72f99af.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;