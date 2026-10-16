/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Spatial Representative Asset System
 * 
 * Provides performant, archival-compliant representative visual assets for CesiumJS.
 * Governed by TRUTH, EXPERIENCE & DESIGN authorities.
 * 
 * Aesthetic Rules:
 * - Palette: Muted bone (#ECE7DB), aged gold (#C6A15B), dark graphite (#1B1B18), subtle brass (#9A7E47).
 * - Archival precision: clean linework, no game-like neon, no military HUD crosshairs.
 * - Semantic distinction: What the object represents vs. where history proves it was.
 */

export interface CarrierSilhouetteOptions {
  name: string;
  isFlagship?: boolean;
}

export class SpatialRepresentativeAssets {
  private static carrierTextures: Map<string, string> = new Map();
  private static destroyerTexture: string | null = null;
  private static zeroTexture: string | null = null;
  private static valTexture: string | null = null;
  private static kateTexture: string | null = null;
  private static bettyTexture: string | null = null;
  private static nellTexture: string | null = null;
  private static aircraftTexture: string | null = null;
  private static bomberTexture: string | null = null;
  private static wreckTexture: string | null = null;
  private static missionTexture: string | null = null;
  private static postOfficeTexture: string | null = null;

  /**
   * Generates a high-DPI plan-view silhouette texture of an IJN fleet carrier
   * with historically differentiated planform, island position, and smoke funnels:
   * - AKAGI: Port-side island forward, starboard downward curved funnel, tapered bow flight deck (~260m).
   * - KAGA: Starboard island forward, massive starboard downward funnel duct (~248m).
   * - SORYU: Starboard island forward, sleek cruiser-type hull, twin starboard funnels (~227m).
   * - HIRYU: Port-side island amidships (unique arrangement), twin starboard funnels (~227m).
   */
  public static getCarrierTexture(options: CarrierSilhouetteOptions): string {
    const key = `${options.name}-${options.isFlagship ? 'flag' : 'sub'}`;
    if (this.carrierTextures.has(key)) {
      return this.carrierTextures.get(key)!;
    }

    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(160, 40);

    const isAkagi = options.name === 'AKAGI';
    const isKaga = options.name === 'KAGA';
    const isSoryu = options.name === 'SORYU';
    const isHiryu = options.name === 'HIRYU';

    // Deck dimensions per ship class
    const deckHalfLen = isAkagi ? 135 : isKaga ? 128 : 118;
    const deckHalfWidth = isKaga ? 18 : isAkagi ? 17 : isHiryu ? 15 : 14;

    // Flight deck polygon (characteristic IJN wooden flight deck shape)
    ctx.beginPath();
    ctx.moveTo(-deckHalfLen, -deckHalfWidth);
    ctx.lineTo(deckHalfLen - 25, -deckHalfWidth);
    ctx.lineTo(deckHalfLen, -deckHalfWidth + 6);
    ctx.lineTo(deckHalfLen, deckHalfWidth - 6);
    ctx.lineTo(deckHalfLen - 25, deckHalfWidth);
    ctx.lineTo(-deckHalfLen, deckHalfWidth);
    ctx.lineTo(-deckHalfLen - 7, 0);
    ctx.closePath();

    ctx.fillStyle = '#17181A';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = options.isFlagship ? '#C6A15B' : 'rgba(198, 161, 91, 0.65)';
    ctx.stroke();

    // Flight deck centerline & elevator outlines
    ctx.strokeStyle = 'rgba(236, 231, 219, 0.40)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(-deckHalfLen + 10, 0);
    ctx.lineTo(deckHalfLen - 10, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3 aircraft elevators (fore, mid, aft)
    const elevators = [deckHalfLen - 50, 0, -deckHalfLen + 45];
    ctx.fillStyle = 'rgba(236, 231, 219, 0.12)';
    ctx.strokeStyle = 'rgba(236, 231, 219, 0.35)';
    for (const ex of elevators) {
      ctx.fillRect(ex - 6, -6, 12, 12);
      ctx.strokeRect(ex - 6, -6, 12, 12);
    }

    // Island Superstructure location:
    // Akagi: Port side forward (Y negative = port)
    // Hiryu: Port side amidships
    // Kaga / Soryu: Starboard side forward (Y positive = starboard)
    let islandX = 30;
    let islandY = -deckHalfWidth - 4; // default port
    if (isHiryu) {
      islandX = -10;
      islandY = -deckHalfWidth - 4;
    } else if (isKaga || isSoryu) {
      islandX = 25;
      islandY = deckHalfWidth - 4; // starboard
    }

    ctx.fillStyle = '#C6A15B';
    ctx.fillRect(islandX, islandY, 22, 8);
    ctx.strokeStyle = '#ECE7DB';
    ctx.lineWidth = 1;
    ctx.strokeRect(islandX, islandY, 22, 8);

    // Downward-curved smoke funnels on starboard side (Y positive)
    ctx.fillStyle = 'rgba(27, 27, 24, 0.9)';
    ctx.strokeStyle = '#C6A15B';
    if (isAkagi) {
      // Akagi massive downward funnel amidships
      ctx.beginPath();
      ctx.rect(0, deckHalfWidth, 24, 6);
      ctx.fill();
      ctx.stroke();
    } else if (isKaga) {
      // Kaga elongated funnel duct
      ctx.beginPath();
      ctx.rect(-30, deckHalfWidth, 42, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      // Soryu / Hiryu twin angled funnels
      ctx.beginPath();
      ctx.rect(5, deckHalfWidth, 14, 5);
      ctx.rect(23, deckHalfWidth, 12, 5);
      ctx.fill();
      ctx.stroke();
    }

    // AA Gun sponsons (outboard platforms)
    ctx.fillStyle = 'rgba(198, 161, 91, 0.55)';
    const sponsonX = [-70, -35, 60];
    for (const sx of sponsonX) {
      ctx.beginPath();
      ctx.arc(sx, -deckHalfWidth - 2, 3.5, 0, Math.PI * 2);
      ctx.arc(sx, deckHalfWidth + 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Designation
    ctx.font = '600 10px "Museo Sans", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ECE7DB';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.name + (options.isFlagship ? ' (FLAGSHIP)' : ''), 0, 0);

    ctx.restore();

    const dataUrl = canvas.toDataURL();
    this.carrierTextures.set(key, dataUrl);
    return dataUrl;
  }

  /**
   * Generates a high-contrast plan-view silhouette of USS Peary (Clemson-class four-stack destroyer)
   * with bow pointing UP (North / 12 o'clock) and realistic curved evasive wake trailing astern.
   */
  public static getDestroyerTexture(): string {
    if (this.destroyerTexture) return this.destroyerTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(50, 95); // Center hull around Y = 0; bow at Y = -80, stern at Y = +80

    // 1. High-speed evasive curved naval wake trailing from stern
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-7, 40);
    // Port wake plume curving astern
    ctx.quadraticCurveTo(-26, 100, -32, 175);
    ctx.lineTo(0, 160);
    // Starboard wake plume
    ctx.lineTo(32, 175);
    ctx.quadraticCurveTo(26, 100, 7, 40);
    ctx.closePath();
    const wakeGrad = ctx.createLinearGradient(0, 40, 0, 175);
    wakeGrad.addColorStop(0, 'rgba(236, 231, 219, 0.50)');
    wakeGrad.addColorStop(0.3, 'rgba(180, 210, 230, 0.35)');
    wakeGrad.addColorStop(0.7, 'rgba(140, 180, 210, 0.18)');
    wakeGrad.addColorStop(1, 'rgba(236, 231, 219, 0.0)');
    ctx.fillStyle = wakeGrad;
    ctx.fill();

    // Twin screw prop wash streaks
    ctx.strokeStyle = 'rgba(245, 242, 235, 0.70)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 78);
    ctx.quadraticCurveTo(-14, 115, -18, 165);
    ctx.moveTo(4, 78);
    ctx.quadraticCurveTo(14, 115, 18, 165);
    ctx.stroke();
    ctx.restore();

    // 2. Slender Clemson-class flush-deck hull (sharp raked bow at Y = -82, stern at Y = +80)
    ctx.beginPath();
    ctx.moveTo(0, -82); // Sharp clipper bow
    ctx.lineTo(7.5, -60);
    ctx.lineTo(8.5, 55);
    ctx.lineTo(6.5, 74);
    ctx.lineTo(0, 80); // Rounded cruiser stern
    ctx.lineTo(-6.5, 74);
    ctx.lineTo(-8.5, 55);
    ctx.lineTo(-7.5, -60);
    ctx.closePath();

    ctx.fillStyle = '#6E7682'; // High-contrast naval steel
    ctx.fill();
    ctx.strokeStyle = '#ECE7DB'; // Crisp bone deck outline
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Inner deck surface in charcoal
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(6, -58);
    ctx.lineTo(6.8, 52);
    ctx.lineTo(0, 75);
    ctx.lineTo(-6.8, 52);
    ctx.lineTo(-6, -58);
    ctx.closePath();
    ctx.fillStyle = '#22252A';
    ctx.fill();

    // Forward bridge and wheelhouse (Y = -34 to -22)
    ctx.fillStyle = '#C6A15B';
    ctx.fillRect(-6, -34, 12, 12);
    ctx.strokeStyle = '#ECE7DB';
    ctx.lineWidth = 1;
    ctx.strokeRect(-6, -34, 12, 12);

    // Forward 4-inch/50 caliber gun mount (at Y = -52)
    ctx.fillStyle = '#ECE7DB';
    ctx.beginPath();
    ctx.arc(0, -52, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1D1E20';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Four Clemson vertical smoke funnels (four-piper layout along centerline)
    const funnelYs = [-14, -2, 10, 22];
    for (const fy of funnelYs) {
      ctx.fillStyle = '#ECE7DB';
      ctx.beginPath();
      ctx.ellipse(0, fy, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#17181A';
      ctx.beginPath();
      ctx.arc(0, fy - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Midships torpedo tube banks
    ctx.fillStyle = '#C6A15B';
    ctx.fillRect(-8, 30, 4, 10);
    ctx.fillRect(4, 30, 4, 10);

    // Aft deckhouse and depth-charge racks (Y = 46 to 68)
    ctx.fillStyle = '#6E7682';
    ctx.fillRect(-5, 46, 10, 14);
    ctx.fillStyle = '#C6A15B';
    ctx.beginPath();
    ctx.arc(0, 64, 3, 0, Math.PI * 2);
    ctx.fill();

    // High-visibility ship identifier text
    ctx.font = '600 10px "Museo Sans", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ECE7DB';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('USS PEARY', 0, -88);

    ctx.restore();

    this.destroyerTexture = canvas.toDataURL();
    return this.destroyerTexture;
  }

  /**
   * Generates plan silhouette of Mitsubishi A6M2 Zero with nose pointing UP (-Y / North).
   */
  public static getZeroTexture(): string {
    if (this.zeroTexture) return this.zeroTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(32, 32);

    // Fuselage along Y (nose at Y = -18, tail at Y = +18)
    ctx.fillStyle = '#ECE7DB';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings along X (span -22 to +22, chord around Y = -2)
    ctx.beginPath();
    ctx.moveTo(-22, -3);
    ctx.lineTo(22, -3);
    ctx.lineTo(18, 5);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.fill();

    // Horizontal stabilizer at Y = 13
    ctx.beginPath();
    ctx.moveTo(-7, 12);
    ctx.lineTo(7, 12);
    ctx.lineTo(6, 16);
    ctx.lineTo(-6, 16);
    ctx.closePath();
    ctx.fill();

    // Dark engine cowl at nose (Y = -16)
    ctx.fillStyle = '#1D1E20';
    ctx.beginPath();
    ctx.arc(0, -16, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Propeller spinner in gold
    ctx.fillStyle = '#C6A15B';
    ctx.beginPath();
    ctx.arc(0, -18, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Canopy glass in graphite
    ctx.fillStyle = '#1D1E20';
    ctx.fillRect(-1.5, -6, 3, 7);

    ctx.restore();
    this.zeroTexture = canvas.toDataURL();
    return this.zeroTexture;
  }

  /**
   * Generates plan silhouette of Aichi D3A1 Val with nose pointing UP (-Y / North).
   */
  public static getValTexture(): string {
    if (this.valTexture) return this.valTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(32, 32);

    // Fuselage along Y
    ctx.fillStyle = '#ECE7DB';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.6, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Characteristic elliptical wings along X
    ctx.beginPath();
    ctx.ellipse(0, -2, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fixed spatted landing gear fairings (protruding forward at X = -8, +8, Y = -6)
    ctx.fillStyle = '#C6A15B';
    ctx.beginPath();
    ctx.ellipse(-8, -6, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -6, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Elliptical tailplane at Y = +14
    ctx.fillStyle = '#ECE7DB';
    ctx.beginPath();
    ctx.ellipse(0, 14, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine Cowl at nose
    ctx.fillStyle = '#1B1B18';
    ctx.beginPath();
    ctx.arc(0, -17, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Canopy
    ctx.fillStyle = '#1D1E20';
    ctx.fillRect(-1.8, -8, 3.6, 9);

    ctx.restore();
    this.valTexture = canvas.toDataURL();
    return this.valTexture;
  }

  /**
   * Generates plan silhouette of Nakajima B5N2 Kate with nose pointing UP (-Y / North).
   */
  public static getKateTexture(): string {
    if (this.kateTexture) return this.kateTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 68;
    canvas.height = 68;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(34, 34);

    // Fuselage along Y (nose at Y = -20, tail at Y = +20)
    ctx.fillStyle = '#ECE7DB';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.8, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wide trapezoidal wings along X (span -27 to +27)
    ctx.beginPath();
    ctx.moveTo(-27, -3);
    ctx.lineTo(27, -3);
    ctx.lineTo(22, 6);
    ctx.lineTo(-22, 6);
    ctx.closePath();
    ctx.fill();

    // Horizontal stabilizer at Y = +15
    ctx.beginPath();
    ctx.moveTo(-9, 14);
    ctx.lineTo(9, 14);
    ctx.lineTo(7.5, 18);
    ctx.lineTo(-7.5, 18);
    ctx.closePath();
    ctx.fill();

    // Cowl & nose
    ctx.fillStyle = '#1B1B18';
    ctx.beginPath();
    ctx.arc(0, -18, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Three-seat greenhouse canopy in dark graphite
    ctx.fillStyle = '#1D1E20';
    ctx.fillRect(-1.6, -8, 3.2, 13);

    // Torpedo/bomb payload indicator along centerline
    ctx.fillStyle = '#C6A15B';
    ctx.fillRect(-1, -4, 2, 10);

    ctx.restore();
    this.kateTexture = canvas.toDataURL();
    return this.kateTexture;
  }

  /**
   * Generates plan silhouette of single-engine naval strike aircraft (Kate default).
   */
  public static getAircraftTexture(): string {
    return this.getKateTexture();
  }

  /**
   * Generates refined architectural plan silhouette of Mitsubishi G4M1 Betty (Type 1 Land Attack Bomber)
   * with NOSE POINTING UP (-Y / North / 12 o'clock).
   * Key traits: Large cigar-shaped fuselage, wide trapezoidal mid-wings, twin Mitsubishi Kasei radials.
   */
  /**
   * Generates refined architectural plan silhouette of Mitsubishi G4M1 Betty (Type 1 Land Attack Bomber)
   * with NOSE POINTING UP (-Y / North / 12 o'clock).
   * Key traits: Large cigar-shaped fuselage, wide trapezoidal mid-wings, twin Mitsubishi Kasei radials.
   */
  public static getBettyTexture(): string {
    if (this.bettyTexture) return this.bettyTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(64, 64);

    // Architectural draughtsman palette
    const airframeColor = '#ECE7DB';
    const darkAccents = '#181B20';
    const panelLine = 'rgba(24, 27, 32, 0.45)';

    // 1. Wide tapered cantilever wings (wingspan 25m, span -52 to +52)
    ctx.fillStyle = airframeColor;
    ctx.beginPath();
    ctx.moveTo(-52, -5);
    ctx.lineTo(52, -5);
    // Rounded wingtips
    ctx.arcTo(53, 0, 50, 4, 3);
    ctx.lineTo(38, 12);
    ctx.lineTo(-38, 12);
    ctx.arcTo(-53, 4, -52, -5, 3);
    ctx.closePath();
    ctx.fill();

    // 2. Large streamlined cigar fuselage (20m length, Y: -44 to +44)
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Engine nacelles: Twin Mitsubishi Kasei radials at X = -21, +21
    ctx.beginPath();
    ctx.ellipse(-21, -6, 5.0, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(21, -6, 5.0, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cowling fronts and cooling gills
    ctx.fillStyle = darkAccents;
    ctx.beginPath();
    ctx.ellipse(-21, -18, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(21, -18, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Propeller spinners
    ctx.fillStyle = '#C6A15B';
    ctx.beginPath();
    ctx.arc(-21, -21, 1.8, 0, Math.PI * 2);
    ctx.arc(21, -21, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Horizontal stabilizer at Y = +30 (span -22 to +22)
    ctx.fillStyle = airframeColor;
    ctx.beginPath();
    ctx.moveTo(-22, 28);
    ctx.lineTo(22, 28);
    ctx.lineTo(17, 37);
    ctx.lineTo(-17, 37);
    ctx.closePath();
    ctx.fill();

    // 5. Single vertical stabilizer spine along centerline
    ctx.strokeStyle = panelLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(0, 40);
    ctx.stroke();

    // 6. Glazed nose greenhouse, canopy, and dorsal blister
    ctx.fillStyle = darkAccents;
    // Glazed bombardier nose
    ctx.beginPath();
    ctx.ellipse(0, -36, 4.0, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stepped cockpit canopy
    ctx.fillRect(-3.0, -25, 6.0, 10);
    // Dorsal gunner blister
    ctx.beginPath();
    ctx.ellipse(0, 8, 3.2, 5.0, 0, 0, Math.PI * 2);
    ctx.fill();
    // 20mm tail gunner position
    ctx.beginPath();
    ctx.arc(0, 40, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.bettyTexture = canvas.toDataURL();
    return this.bettyTexture;
  }

  /**
   * Generates plan silhouette of Mitsubishi G3M2 Nell (Type 96 Land Attack Bomber)
   * with NOSE POINTING UP (-Y / North / 12 o'clock).
   * Key traits: Slender fuselage, distinctive twin vertical fins on outer edges of horizontal stabilizer.
   */
  public static getNellTexture(): string {
    if (this.nellTexture) return this.nellTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(64, 64);

    const airframeColor = '#ECE7DB';
    const darkAccents = '#181B20';

    // 1. Long high-aspect-ratio wings (wingspan 25m, span -53 to +53)
    ctx.fillStyle = airframeColor;
    ctx.beginPath();
    ctx.moveTo(-53, -6);
    ctx.lineTo(53, -6);
    ctx.arcTo(54, -1, 51, 3, 3);
    ctx.lineTo(39, 10);
    ctx.lineTo(-39, 10);
    ctx.arcTo(-54, 3, -53, -6, 3);
    ctx.closePath();
    ctx.fill();

    // 2. Slender elongated fuselage (16.5m length, Y: -41 to +41)
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.8, 39, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Twin Kinsei engine nacelles at X = -20, +20
    ctx.beginPath();
    ctx.ellipse(-20, -7, 4.8, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(20, -7, 4.8, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Radial cowls
    ctx.fillStyle = darkAccents;
    ctx.beginPath();
    ctx.ellipse(-20, -18, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(20, -18, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Propeller spinners
    ctx.fillStyle = '#C6A15B';
    ctx.beginPath();
    ctx.arc(-20, -20.5, 1.8, 0, Math.PI * 2);
    ctx.arc(20, -20.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Broad rectangular horizontal stabilizer at Y = +28 (span -25 to +25)
    ctx.fillStyle = airframeColor;
    ctx.fillRect(-24, 26, 48, 8);

    // 5. Twin endplate rudders (TWIN vertical fins) on tail tips (at X = -24, +22)
    ctx.fillStyle = '#C6A15B';
    ctx.fillRect(-25, 22, 4.0, 15);
    ctx.fillRect(21, 22, 4.0, 15);

    // 6. Cockpit canopy and dorsal retractable gun turrets
    ctx.fillStyle = darkAccents;
    // Glazed nose
    ctx.beginPath();
    ctx.ellipse(0, -34, 3.4, 4.0, 0, 0, Math.PI * 2);
    ctx.fill();
    // Main tandem cockpit
    ctx.fillRect(-2.8, -23, 5.6, 12);
    // Twin dorsal retractable blisters
    ctx.beginPath();
    ctx.arc(-5, 6, 2.2, 0, Math.PI * 2);
    ctx.arc(5, 6, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.nellTexture = canvas.toDataURL();
    return this.nellTexture;
  }

  /**
   * Generates a high-contrast plan-view silhouette of a merchant transport vessel (e.g., Meigs, Zealandia)
   * with bow pointing UP (-Y / North).
   */
  public static getMerchantVesselTexture(name: string, lenPx: number = 100): string {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 46;
    canvas.height = lenPx + 24;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(23, (lenPx + 24) / 2);

    const halfLen = lenPx / 2;
    const halfWidth = 7.5;

    // Hull outline
    ctx.beginPath();
    ctx.moveTo(0, -halfLen);
    ctx.lineTo(halfWidth, -halfLen + 16);
    ctx.lineTo(halfWidth, halfLen - 12);
    ctx.lineTo(0, halfLen);
    ctx.lineTo(-halfWidth, halfLen - 12);
    ctx.lineTo(-halfWidth, -halfLen + 16);
    ctx.closePath();

    ctx.fillStyle = '#4B515C';
    ctx.fill();
    ctx.strokeStyle = '#ECE7DB';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Superstructure & cargo hatches
    ctx.fillStyle = '#C6A15B';
    ctx.fillRect(-4.5, -10, 9, 20); // Central deckhouse
    ctx.fillStyle = '#1D1E20';
    ctx.beginPath();
    ctx.arc(0, -2, 2.8, 0, Math.PI * 2); // Funnel
    ctx.fill();

    // Forward and aft cargo hatch frames
    ctx.strokeStyle = 'rgba(236, 231, 219, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-3.5, -halfLen + 20, 7, 10);
    ctx.strokeRect(-3.5, halfLen - 26, 7, 10);

    ctx.restore();
    return canvas.toDataURL();
  }

  /**
   * Generates plan silhouette of twin-engine naval land bomber (Betty default).
   */
  public static getBomberTexture(): string {
    return this.getBettyTexture();
  }

  /**
   * Generates a modern hydrographic chart wreck symbol (Chart Aus 26 standard).
   */
  public static getWreckSymbolTexture(depthM?: number): string {
    if (!depthM && this.wreckTexture) return this.wreckTexture;
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(32, 32);

    // Circular sounding contour
    ctx.strokeStyle = 'rgba(198, 161, 91, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(238, 233, 223, 0.08)';
    ctx.fill();

    // Nautical sunken hull symbol: dashed submerged keel with vertical mast cross
    ctx.strokeStyle = '#ECE7DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(-8, 10);
    ctx.moveTo(8, -10);
    ctx.lineTo(8, 10);
    ctx.stroke();

    // Depth numeral annotation if provided
    if (depthM) {
      ctx.font = 'bold 9px "Museo Sans", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#C6A15B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${depthM}m`, 0, 16);
    }

    ctx.restore();

    const dataUrl = canvas.toDataURL();
    if (!depthM) this.wreckTexture = dataUrl;
    return dataUrl;
  }
}
