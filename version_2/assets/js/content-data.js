window.CONTENT = {
  id: 'L1LC01', short: 'WeatherStation', title: 'Weather Station', subject: 'LC', level: 1, version: '2.0.0', allowedOrigins: [],
  disclaimer: 'For educational purposes only. Data and scenarios are illustrative and may not reflect real people, products or results.',
  aiNote: 'This project may include AI-generated images.',
  missions: {
    a: [
      { id: 'a1', w: 17, type: 'numeric', lo: 'LC.JOURNAL.OBSERVE' },
      { id: 'a2', w: 17, type: 'match', opts: 6, lo: 'LC.JOURNAL.OBSERVE' },
      { id: 'a3', w: 17, type: 'chart', lo: 'DATA.CHART.PLOT' },
      { id: 'a4', w: 17, type: 'numeric', lo: 'DATA.COMPARE' },
      { id: 'a5', w: 16, type: 'match', opts: 6, lo: 'DATA.COMPARE' },
      { id: 'a6', w: 16, type: 'match', opts: 6, lo: 'LC.JOURNAL.RECORD' }
    ],
    b: [
      { id: 'b1', w: 17, type: 'match', opts: 3, lo: 'LC.JOURNAL.OBSERVE' },
      { id: 'b2', w: 17, type: 'numeric', lo: 'LC.JOURNAL.OBSERVE' },
      { id: 'b3', w: 17, type: 'match', opts: 6, lo: 'LC.JOURNAL.OBSERVE' },
      { id: 'b4', w: 17, type: 'match', opts: 4, lo: 'DATA.COMPARE' },
      { id: 'b5', w: 16, type: 'match', opts: 5, lo: 'DATA.COMPARE' },
      { id: 'b6', w: 16, type: 'match', opts: 4, lo: 'DATA.COMPARE' }
    ],
    c: [
      { id: 'c1', w: 17, type: 'match', opts: 6, lo: 'LC.JOURNAL.RECORD' },
      { id: 'c2', w: 17, type: 'chart', lo: 'DATA.CHART.PLOT' },
      { id: 'c3', w: 17, type: 'numeric', lo: 'LC.JOURNAL.OBSERVE' },
      { id: 'c4', w: 17, type: 'numeric', lo: 'DATA.COMPARE' },
      { id: 'c5', w: 16, type: 'match', opts: 6, lo: 'DATA.COMPARE' },
      { id: 'c6', w: 16, type: 'match', opts: 4, lo: 'DATA.COMPARE' }
    ]
  },
  get items() { return this._items || this.missions.a; }, set items(v) { this._items = v; }
};
