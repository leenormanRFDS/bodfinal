import fs from 'fs';

const path = 'src/lib/spatial/spatial-evidence-overlay.ts';
let code = fs.readFileSync(path, 'utf8');

const setupInterStr = `
  private setupInteraction(): void {
    const handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (this.Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const props = pickedObject.id.properties.getValue(this.viewer.clock.currentTime);
        if (props && props.ledgerData) {
          // Send event or call global function
          if (typeof window !== 'undefined' && (window as any).openEvidenceLedger) {
            (window as any).openEvidenceLedger(props.ledgerData);
          }
        }
      }
    }, this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
`;

if (!code.includes('setupInteraction()')) {
    code = code.replace('private buildEvidenceEntities(): void {', setupInterStr + '\n  private buildEvidenceEntities(): void {');
    code = code.replace('this.buildEvidenceEntities();', 'this.buildEvidenceEntities();\n    this.setupInteraction();');
    fs.writeFileSync(path, code);
    console.log('Added setupInteraction');
}
