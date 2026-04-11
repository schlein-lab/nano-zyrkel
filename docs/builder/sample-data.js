/* Sample data for chart previews in the visual editor */
const SAMPLE_DATA = {
  trend: [
    { date: '2026-01', value: 12 },
    { date: '2026-02', value: 18 },
    { date: '2026-03', value: 15 },
    { date: '2026-04', value: 24 },
    { date: '2026-05', value: 22 },
    { date: '2026-06', value: 31 },
    { date: '2026-07', value: 28 },
    { date: '2026-08', value: 35 }
  ],
  distribution: [
    { label: 'Pathogenic', value: 142, color: '#ef4444' },
    { label: 'Likely Path.', value: 89, color: '#f97316' },
    { label: 'VUS', value: 312, color: '#eab308' },
    { label: 'Likely Benign', value: 178, color: '#22c55e' },
    { label: 'Benign', value: 445, color: '#3b82f6' }
  ],
  table: [
    { gene: 'BRCA1', variant: 'c.68_69del', classification: 'Pathogenic', submissions: 142, lastUpdate: '2026-03-15' },
    { gene: 'TP53', variant: 'c.743G>A', classification: 'VUS', submissions: 89, lastUpdate: '2026-03-12' },
    { gene: 'MLH1', variant: 'c.306+5G>A', classification: 'Benign', submissions: 67, lastUpdate: '2026-03-10' },
    { gene: 'BRCA2', variant: 'c.5946del', classification: 'Pathogenic', submissions: 234, lastUpdate: '2026-03-08' },
    { gene: 'MSH2', variant: 'c.942+3A>T', classification: 'Likely Path.', submissions: 45, lastUpdate: '2026-03-05' },
    { gene: 'PTEN', variant: 'c.388C>T', classification: 'VUS', submissions: 23, lastUpdate: '2026-02-28' }
  ],
  heatmap: Array.from({ length: 8 }, () =>
    Array.from({ length: 12 }, () => Math.random())
  ),
  scatter: Array.from({ length: 30 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 6
  })),
  survival: {
    groupA: [1.0, 0.95, 0.90, 0.85, 0.78, 0.72, 0.68, 0.65, 0.62, 0.60],
    groupB: [1.0, 0.92, 0.84, 0.76, 0.70, 0.62, 0.55, 0.50, 0.46, 0.43],
    timepoints: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54]
  },
  stats: [
    { label: 'Varianten', value: '4,412,108', trend: '+2.3%', color: '#8B5CF6' },
    { label: 'Gene', value: '21,847', trend: '+12', color: '#06b6d4' },
    { label: 'Letztes Update', value: '14:32', trend: 'vor 2h', color: '#22c55e' },
    { label: 'Alerts', value: '3', trend: 'neu', color: '#f59e0b' }
  ],
  feeds: [
    { title: 'Structural variants in BRCA1 intron 12', source: 'bioRxiv', date: '2026-04-10', isNew: true },
    { title: 'ClinVar reclassification rates 2020-2025', source: 'PubMed', date: '2026-04-09', isNew: true },
    { title: 'Segmental duplications and gene conversion', source: 'medRxiv', date: '2026-04-08', isNew: false },
    { title: 'Hardy-Weinberg testing in admixed populations', source: 'PubMed', date: '2026-04-07', isNew: false }
  ]
};
