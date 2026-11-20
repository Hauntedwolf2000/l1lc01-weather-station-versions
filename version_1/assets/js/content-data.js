window.CONTENT = {
  id: 'L1LC01', short: 'WeatherStation', title: 'Weather Station', subject: 'LC', level: 1, version: '1.0.0', allowedOrigins: [],
  disclaimer: 'For educational purposes only. Data and scenarios are illustrative and may not reflect real people, products or results.',
  aiNote: 'This project may include AI-generated images.',
  items: [
    { id: 'read', w: 20, type: 'numeric', lo: 'LC.JOURNAL.OBSERVE' },
    { id: 'sky', w: 20, type: 'match', opts: 6, lo: 'LC.JOURNAL.OBSERVE' },
    { id: 'journal', w: 20, type: 'match', opts: 6, lo: 'LC.JOURNAL.RECORD' },
    { id: 'chart', w: 20, type: 'chart', lo: 'DATA.CHART.PLOT' },
    { id: 'range', w: 20, type: 'numeric', lo: 'DATA.COMPARE' }
  ]
};
