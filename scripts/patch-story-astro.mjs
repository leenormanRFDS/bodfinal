import fs from 'fs';

let content = fs.readFileSync('src/pages/story.astro', 'utf8');

content = content.replace(
  /const CONTACTS = beatsData\.beats\.map\(beat => beat\.spatial\.plotCoordinate\);/g,
  "const CONTACTS = beatsData.beats.map(beat => beat.spatial.plotBoard?.coordinate ?? null);"
);

fs.writeFileSync('src/pages/story.astro', content);
