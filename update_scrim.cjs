const fs = require('fs');
let code = fs.readFileSync('src/pages/story.astro', 'utf8');

code = code.replace(
  /\/\* Desktop Widescreen[^\}]+} *\n *\} *\n *\/\* Tablet[^\}]+} *\n *\} *\n *\/\* Mobile Portrait[^\}]+} *\n *\} *\n *\/\* Mobile Landscape[^\}]+} *\n *\} *\n *\/\* Tame global[^\}]+} */g,
  `/* Desktop Widescreen (>= 1100px): left narrative zone is protected; geographic zone is clear */
  @media (min-width: 1100px) {
    .s-spatial-scrim {
      background: linear-gradient(
        90deg,
        rgba(7, 9, 11, 0.75) 0%,
        rgba(7, 9, 11, 0.72) 26%,
        rgba(7, 9, 11, 0.35) 40%,
        rgba(7, 9, 11, 0.05) 54%,
        transparent 70%,
        transparent 100%
      );
    }
  }

  /* Tablet (768px - 1099px) */
  @media (min-width: 768px) and (max-width: 1099px) {
    .s-spatial-scrim {
      background: linear-gradient(
        90deg,
        rgba(7, 9, 11, 0.76) 0%,
        rgba(7, 9, 11, 0.65) 32%,
        rgba(7, 9, 11, 0.28) 50%,
        rgba(7, 9, 11, 0.05) 64%,
        transparent 80%,
        transparent 100%
      );
    }
  }

  /* Mobile Portrait (< 768px): upper 35-45% open for clear geography, lower half protected for narrative */
  @media (max-width: 767px) {
    .s-spatial-scrim {
      background: linear-gradient(
        180deg,
        transparent 0%,
        transparent 40%,
        rgba(7, 9, 11, 0.25) 50%,
        rgba(7, 9, 11, 0.75) 64%,
        rgba(7, 9, 11, 0.92) 80%,
        rgba(7, 9, 11, 0.98) 100%
      );
    }
  }

  /* Mobile Landscape (< 550px height) */
  @media (max-height: 550px) and (orientation: landscape) {
    .s-spatial-scrim {
      background: linear-gradient(
        90deg,
        rgba(7, 9, 11, 0.78) 0%,
        rgba(7, 9, 11, 0.64) 38%,
        rgba(7, 9, 11, 0.12) 62%,
        transparent 80%,
        transparent 100%
      );
    }
  }

  /* Tame global radial vignette during the spatial journey so the map is not smothered at the edges */
  :global(body.grain::before) {
    opacity: 0.15;
  }`
);

fs.writeFileSync('src/pages/story.astro', code);
