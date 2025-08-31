export const environment = {
  production: false,
  supabase: {
    url: 'https://usafiyvkyzqulznzjvod.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYWZpeXZreXpxdWx6bnpqdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTY1NjEsImV4cCI6MjA3MjIzMjU2MX0.FXgvXotcciH1CUuMX8gw_wVMelzV16VT6uN2dnWD15A'
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000
  },
  features: {
    enableAnalytics: false,
    enableDebugMode: true,
    enableFeatureFlags: false
  },
  app: {
    name: 'Luli Beads',
    version: '1.0.0',
    supportEmail: 'support@lulibeads.com'
  }
};
