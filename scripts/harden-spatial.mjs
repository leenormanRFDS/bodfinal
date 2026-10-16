import fs from 'fs';

const beatsPath = 'data/story-beats.json';
const beatsData = JSON.parse(fs.readFileSync(beatsPath, 'utf8'));

beatsData.beats = beatsData.beats.map(beat => {
  const plotCoord = beat.spatial.plotCoordinate;
  delete beat.spatial.plotCoordinate;

  beat.spatial.plotBoard = {
    coordinateSpace: "PLOT_BOARD_2D",
    coordinate: plotCoord !== undefined ? plotCoord : null
  };
  beat.spatial.geospatial = {
    status: "UNRESOLVED",
    confidence: "UNKNOWN",
    coordinates: null
  };

  return beat;
});

fs.writeFileSync(beatsPath, JSON.stringify(beatsData, null, 2));
