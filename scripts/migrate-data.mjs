import fs from 'fs';

const canon = JSON.parse(fs.readFileSync('data/historical-canon.json', 'utf8'));
const beats = JSON.parse(fs.readFileSync('data/story-beats.json', 'utf8'));

const timeline = [
  { t: '08:00', h: 'The strike launches', d: 'One hundred and eighty‑eight aircraft — Zeros, dive bombers and level bombers — lift from the Japanese carrier fleet in the Timor Sea.' },
  { t: '09:35', h: 'The warning that wasn’t heard', d: 'The mission on Bathurst Island radios a large formation approaching. It is discounted as the returning American P‑40s.' },
  { t: '09:58', h: 'The first bombs fall', d: 'With no siren and no warning, the first raid breaks over the harbour and town. It will last about forty minutes.' },
  { t: '10:00', h: 'The Post Office', d: 'A direct hit kills nine — the postmaster, his family and his staff — sheltering in a trench.' },
  { t: '10:45', h: 'USS Peary', d: 'The American destroyer, one of the largest ships in the harbour, is struck by five bombs.' },
  { t: '12:00', h: 'The second raid', d: 'Fifty‑four land‑based bombers return at high altitude to strike the RAAF base at Parap.' },
  { t: '13:00', h: 'Peary is lost', d: 'She sinks stern‑first. Ninety‑one of her crew go down with her — the heaviest single loss of American life in Australian waters.' },
  { t: 'Dusk', h: 'The reckoning begins', d: 'At least 235 are dead. Eight ships lie sunk, more than thirty aircraft destroyed. More bombs fell on Darwin than on Pearl Harbour.' },
];

const CONTACTS = [[22, 36], [132, 180], [352, 468], [396, 408], [240, 500], [452, 278], [240, 500], null];

const newBeats = timeline.map((item, index) => {
  const claimId = `TIMELINE_${item.t.replace(':', '')}`;
  
  // Add to canon if not exists
  if (!canon.claims.find(c => c.id === claimId)) {
    canon.claims.push({
      id: claimId,
      value: item.d,
      classification: "HISTORICAL_INTERPRETATION",
      confidence: "UNKNOWN",
      sources: [],
      note: "Migrated from hard-coded story.astro. Needs verification."
    });
  }

  // Also add claim for time if applicable
  const timeClaimId = `TIME_${item.t.replace(':', '')}`;
  if (!canon.claims.find(c => c.id === timeClaimId)) {
      canon.claims.push({
          id: timeClaimId,
          value: item.t,
          classification: "HISTORICAL_INTERPRETATION",
          confidence: "UNKNOWN",
          sources: [],
          note: "Migrated from hard-coded story.astro. Needs verification."
      });
  }

  return {
    id: `BEAT_${index}`,
    chapter: `CHAPTER_${index}`,
    historicalTime: item.t, // Keeping original for UI simplicity, though could be formatted
    headline: item.h,
    description: item.d,
    truthRefs: [claimId, timeClaimId],
    spatial: {
      plotCoordinate: CONTACTS[index] || null,
      cameraPreset: "TO_BE_AUTHORED",
      visibleEntityIds: [],
      historicalLayerIds: []
    },
    motion: {
      mode: "CINEMATIC_FLIGHT",
      reducedMotion: "STATIC_COMPOSITION"
    },
    status: "REQUIRES_VERIFICATION"
  };
});

beats.beats = newBeats;

fs.writeFileSync('data/historical-canon.json', JSON.stringify(canon, null, 2));
fs.writeFileSync('data/story-beats.json', JSON.stringify(beats, null, 2));
