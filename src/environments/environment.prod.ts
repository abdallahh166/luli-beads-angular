export const environment = {
  production: true,
  supabase: {
    url: 'https://usafiyvkyzqulznzjvod.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYWZpeXZreXpxdWx6bnpqdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTY1NjEsImV4cCI6MjA3MjIzMjU2MX0.FXgvXotcciH1CUuMX8gw_wVMelzV16VT6uN2dnWD15A'
  },
  api: {
    baseUrl: 'https://api.lulibeads.com',
    timeout: 15000
  },
  features: {
    enableAnalytics: true,
    enableDebugMode: false,
    enableFeatureFlags: true
  },
  app: {
    name: 'Luli Beads',
    version: '1.0.0',
    supportEmail: 'support@lulibeads.com'
  }
};
