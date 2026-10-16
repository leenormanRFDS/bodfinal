/**
 * THE BOMBING OF DARWIN — HISTORICAL SPATIAL ENGINE
 * Historical Time Controller
 * 
 * Manages the canonical conversion between Story beat timestamps and Cesium JulianDate.
 * Historical Baseline:
 *   DARWIN WARTIME LOCAL TIME = UTC+10:30 (Daylight Saving / Standard Australian Central Time basis in 1942).
 * 
 * 19 February 1942 mapping:
 *   08:00 (Darwin Local) = 1942-02-18T21:30:00Z
 *   09:35 (Darwin Local) = 1942-02-18T23:05:00Z
 *   09:37 (Darwin Local) = 1942-02-18T23:07:00Z
 *   09:58 (Darwin Local) = 1942-02-18T23:28:00Z
 *   10:00 (Darwin Local) = 1942-02-18T23:30:00Z
 *   10:45 (Darwin Local) = 1942-02-19T00:15:00Z
 *   12:00 (Darwin Local) = 1942-02-19T01:30:00Z
 *   13:00 (Darwin Local) = 1942-02-19T02:30:00Z
 *   18:30 (Dusk)         = 1942-02-19T08:00:00Z (Canonical evening reckoning instant)
 * 
 * Adjudicated by TRUTH and canon: data/historical-canon.json (TIME_Dusk, temporalProvenance).
 */

import type * as CesiumType from 'cesium';

export interface BeatTimeRecord {
  beatId: string;
  code: string;
  label: string;
  darwinLocalTimeString: string;
  iso8601Utc: string;
  isAdjudicatedRepresentative: boolean;
  notes: string;
}

export const CANONICAL_BEAT_TIMES: Record<string, BeatTimeRecord> = {
  BEAT_0_TIMOR_LAUNCH: {
    beatId: 'BEAT_0_TIMOR_LAUNCH',
    code: '08:00',
    label: 'Timor Sea Launch Area (Estimated)',
    darwinLocalTimeString: '08:00 Darwin Local Time',
    iso8601Utc: '1942-02-18T21:30:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'Flagship Akagi commenced first-wave launch operations at 06:20–06:25 JST = ~07:52 Darwin Local Time. Synthesized historiographically as 08:00.',
  },
  BEAT_1_BATHURST_WARNING: {
    beatId: 'BEAT_1_BATHURST_WARNING',
    code: '09:35',
    label: 'Bathurst Island Warning & Sighting',
    darwinLocalTimeString: '09:35 Darwin Local Time',
    iso8601Utc: '1942-02-18T23:05:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'Father McGrath visual sighting over Nguiu mission. Warning radioed at 09:37.',
  },
  BEAT_2_HARBOUR_STRIKE: {
    beatId: 'BEAT_2_HARBOUR_STRIKE',
    code: '09:58',
    label: 'First Bombs Fall on Harbour & Town',
    darwinLocalTimeString: '09:58 Darwin Local Time',
    iso8601Utc: '1942-02-18T23:28:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'Judicial finding by Justice Lowe: first bomb impacts at 09:58 Darwin Local Time.',
  },
  BEAT_3_POST_OFFICE: {
    beatId: 'BEAT_3_POST_OFFICE',
    code: '10:00',
    label: 'Post Office Trench Direct Hit',
    darwinLocalTimeString: '10:00 Darwin Local Time',
    iso8601Utc: '1942-02-18T23:30:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'Direct bomb strike on slit trench behind Darwin Post & Telegraph Office.',
  },
  BEAT_4_PEARY_ATTACK: {
    beatId: 'BEAT_4_PEARY_ATTACK',
    code: '10:45',
    label: 'USS Peary Under Sustained Attack in Channel',
    darwinLocalTimeString: '10:45 Darwin Local Time',
    iso8601Utc: '1942-02-19T00:15:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'Peak dive-bombing attacks in harbour channel; concluding impacts of First Wave.',
  },
  BEAT_5_RAAF_AIRFIELD: {
    beatId: 'BEAT_5_RAAF_AIRFIELD',
    code: '12:00',
    label: 'Second Wave Strike on RAAF Station Darwin',
    darwinLocalTimeString: '12:00 Darwin Local Time',
    iso8601Utc: '1942-02-19T01:30:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'Second raid of 54 twin-engine naval land bombers arrived 11:58–12:25.',
  },
  BEAT_6_PEARY_LOST: {
    beatId: 'BEAT_6_PEARY_LOST',
    code: '13:00',
    label: 'USS Peary Modern Surveyed Wreck Position',
    darwinLocalTimeString: '13:00 Darwin Local Time',
    iso8601Utc: '1942-02-19T02:30:00Z',
    isAdjudicatedRepresentative: false,
    notes: 'USS Peary sinks stern-first in the harbour channel; more than eighty lost.',
  },
  BEAT_7_RECKONING: {
    beatId: 'BEAT_7_RECKONING',
    code: 'Dusk',
    label: 'The Reckoning · Contemporary Stokes Hill Wharf',
    darwinLocalTimeString: '18:30 (Dusk) Darwin Local Time',
    iso8601Utc: '1942-02-19T08:00:00Z',
    isAdjudicatedRepresentative: true,
    notes: 'Adjudicated representative historical dusk instant in canon (TIME_Dusk in data/historical-canon.json). Harbour fires burning into evening.',
  },
};

export class HistoricalTimeController {
  private Cesium: typeof CesiumType;
  private julianDates: Map<string, CesiumType.JulianDate> = new Map();

  constructor(Cesium: typeof CesiumType) {
    this.Cesium = Cesium;
    this.precomputeJulianDates();
  }

  private precomputeJulianDates(): void {
    for (const [beatId, record] of Object.entries(CANONICAL_BEAT_TIMES)) {
      try {
        const jd = this.Cesium.JulianDate.fromIso8601(record.iso8601Utc);
        this.julianDates.set(beatId, jd);
      } catch (err) {
        console.error(`[HistoricalTimeController] Failed to parse timestamp for ${beatId}:`, err);
      }
    }
  }

  /**
   * Returns the canonical JulianDate for a given Story beat state ID.
   * If not a historical beat (e.g. contemporary overview STATE_00_WORLD),
   * returns the 09:58 historical anchor or null.
   */
  public getJulianDateForBeat(beatId: string): CesiumType.JulianDate | null {
    if (this.julianDates.has(beatId)) {
      return this.julianDates.get(beatId)!;
    }
    // Fallback if contemporary orientation state is requested
    if (beatId.startsWith('STATE_03_WHARF')) {
      return this.julianDates.get('BEAT_7_RECKONING') || null;
    }
    return this.julianDates.get('BEAT_2_HARBOUR_STRIKE') || null;
  }

  /**
   * Returns the metadata record for the beat.
   */
  public getBeatTimeRecord(beatId: string): BeatTimeRecord | null {
    return CANONICAL_BEAT_TIMES[beatId] || null;
  }

  /**
   * Formats astronomical solar coordinates for diagnostic reporting / verification.
   */
  public computeSunPosition(
    beatId: string,
    latitudeDeg: number = -12.4634,
    longitudeDeg: number = 130.8456
  ): { azimuthDeg: number; elevationDeg: number } | null {
    const jd = this.getJulianDateForBeat(beatId);
    if (!jd) return null;

    const Cesium = this.Cesium;
    try {
      const pos = Cesium.Cartesian3.fromDegrees(longitudeDeg, latitudeDeg, 0);
      const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(pos);
      const invEnu = Cesium.Matrix4.inverse(enuTransform, new Cesium.Matrix4());

      const sunPosECI = (Cesium.Simon1994PlanetaryPositions as any).computeSunPositionInEarthInertialFrame(jd);
      const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(jd) || (Cesium.Transforms as any).computeTemeToPseudoFixedMatrix(jd);
      const sunPosECEF = Cesium.Matrix3.multiplyByVector(icrfToFixed, sunPosECI, new Cesium.Cartesian3());

      const sunLocal = Cesium.Matrix4.multiplyByPoint(invEnu, sunPosECEF, new Cesium.Cartesian3());
      const horizDist = Math.hypot(sunLocal.x, sunLocal.y);
      const elevRad = Math.atan2(sunLocal.z, horizDist);
      let azimRad = Math.atan2(sunLocal.x, sunLocal.y);
      if (azimRad < 0) azimRad += 2 * Math.PI;

      return {
        azimuthDeg: (azimRad * 180) / Math.PI,
        elevationDeg: (elevRad * 180) / Math.PI,
      };
    } catch (err) {
      console.warn('[HistoricalTimeController] Sun position calculation error:', err);
      return null;
    }
  }
}
