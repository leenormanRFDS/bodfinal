import fs from 'fs';
import path from 'path';

const sources = [
  {
    id: "AHO_CHART_AUS26",
    sourceId: "AHO_CHART_AUS26",
    title: "Australian Nautical Chart Aus 26: Approaches to Darwin and Darwin Harbour",
    creator: "Australian Hydrographic Service",
    institution: "Australian Hydrographic Office (Department of Defence)",
    date: "2023",
    sourceClassification: "OFFICIAL_HYDROGRAPHIC_SURVEY",
    sourceType: "OFFICIAL_HYDROGRAPHIC_SURVEY",
    classification: "OFFICIAL_HYDROGRAPHIC_SURVEY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "AHO: Aus 26 (Current Edition, WGS84)",
    catalogueVerificationNotes: "Verified in active Australian Hydrographic Office national nautical chart catalogue. Authoritative contemporary bathymetric and modern port infrastructure baseline. Spatial Datum: WGS84.",
    url: "https://www.hydro.gov.au",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "STOKES_HILL_WHARF_CONTEMPORARY_GEOMETRY",
      "DARWIN_HARBOUR_CONTEMPORARY_BASELINE"
    ],
    claimsSupportedBySynthesis: [],
    reliabilityNotes: "Authoritative contemporary navigation and hydrographic datum for Australian maritime waters. Provides verified bathymetry and contemporary harbour infrastructure positions. Datum: WGS84.",
    rightsStatus: "COMMONWEALTH_OF_AUSTRALIA_COPYRIGHT",
    notes: "Contemporary official chart used for baseline modern geography. Stokes Hill Wharf modern structure centroid: 12°28'21\"S, 130°50'55\"E (-12.4725, 130.8485)."
  },
  {
    id: "GA_GEODETIC_SURVEY",
    sourceId: "GA_GEODETIC_SURVEY",
    title: "Geoscience Australia Composite Gazetteer of Australia: Stokes Hill Wharf (Record ID: 104278)",
    creator: "Committee for Geographical Names in Australasia (CGNA)",
    institution: "Geoscience Australia",
    date: "2022",
    sourceClassification: "MODERN_INSTITUTIONAL_SUMMARY",
    sourceType: "MODERN_INSTITUTIONAL_SUMMARY",
    classification: "MODERN_INSTITUTIONAL_SUMMARY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "Geoscience Australia Gazetteer Record ID 104278",
    catalogueVerificationNotes: "Verified in Geoscience Australia Composite Gazetteer of Australia online database.",
    url: "https://placenames.fsdf.org.au",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "STOKES_HILL_WHARF_CONTEMPORARY_NAME_AND_CENTROID"
    ],
    claimsSupportedBySynthesis: [],
    reliabilityNotes: "Official Australian Government geodetic place name record. Validates modern name and representative coordinate point.",
    rightsStatus: "CC_BY_4_0",
    notes: "Validates official contemporary place name and approximate centroid for Stokes Hill Wharf."
  },
  {
    id: "LOWE_COMMISSION_1942",
    sourceId: "LOWE_COMMISSION_1942",
    title: "Commission of Inquiry Concerning the Circumstances Connected with the Attack Made by Japanese Aircraft at Darwin on 19th February, 1942 (The Lowe Commission)",
    creator: "Mr Justice Charles J. Lowe (Commissioner)",
    institution: "Commonwealth of Australia / National Archives of Australia",
    date: "1942-03-27",
    sourceClassification: "PRIMARY_DOCUMENT",
    sourceType: "PRIMARY_DOCUMENT",
    classification: "PRIMARY_DOCUMENT",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "NAA: A816, 37/301/310; NAA: A816, 37/301/293; NAA: A431, 1949/687; NAA: A461, F326/1/4; NAA: MP401/1, CL14687/1 & CL14687/2; NAA: MP401/1, CL14687/7 & CL14687/8; NAA: MP1185/8, 1806/2/31",
    catalogueVerificationNotes: "Directly catalogue-verified across National Archives of Australia RecordSearch series: A816 item 37/301/310 (Final Report), A816 item 37/301/293 (Transcript of Evidence), A431 item 1949/687 (Lowe Report), A461 item F326/1/4 (Prime Minister's Dept copy), MP401/1 items CL14687/1 & CL14687/2 (Exhibits), MP401/1 items CL14687/7 & CL14687/8 (Darwin and Melbourne hearing transcripts), and MP1185/8 item 1806/2/31 (Army copy). Suspect reference AWM54 422/7/8 permanently excluded.",
    url: "https://recordsearch.naa.gov.au",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "ATTACK_TIME_0958",
      "SIREN_DELAY_1001",
      "OFFICIAL_CASUALTY_FINDING_LOWE_243",
      "FATHER_MCGRATH_WARNING_RECEIPT",
      "NEPTUNA_AMMUNITION_MANIFEST",
      "RADAR_311_NON_OPERATIONAL",
      "POST_OFFICE_BOMB_STRIKE",
      "SHIPPING_CASUALTIES_HARBOUR"
    ],
    claimsSupportedBySynthesis: [
      "HARBOUR_RAID_DURATION_APPROX_40_MIN"
    ],
    reliabilityNotes: "Principal official Commonwealth judicial inquiry held in Darwin and Melbourne immediately following the attacks (February–March 1942). Established official legal findings on air raid warnings, radar unreadiness, civilian/service casualties (~243 dead, not exceeding 250), shipping casualties, and administrative breakdown.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Fundamental legal and factual primary record for raid timing, warning delay, wharf casualties, and damage reports. Cross-verified across 7 distinct NAA catalogue series."
  },
  {
    id: "GILL_RAN_VOL1",
    sourceId: "GILL_RAN_VOL1",
    title: "Royal Australian Navy, 1939–1942 (Australia in the War of 1939–1945, Series 2 — Navy, Volume I)",
    creator: "George Hermon Gill",
    institution: "Australian War Memorial",
    date: "1957",
    sourceClassification: "OFFICIAL_HISTORY",
    sourceType: "OFFICIAL_HISTORY",
    classification: "OFFICIAL_HISTORY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "AWM Official History Series (Navy I), Chapter 17: 'Darwin', pp. 588–600",
    catalogueVerificationNotes: "Catalogue-verified in Australian War Memorial collection (ID: C1417385). Full digital scan available online through AWM.",
    url: "https://www.awm.gov.au/collection/C1417385",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "HARBOUR_VESSEL_INVENTORY_45_SHIPS",
      "USS_PEARY_BOMB_HITS_AND_SINKING",
      "MV_NEPTUNA_WHARF_EXPLOSION",
      "MV_ZEALANDIA_SINKING",
      "USAT_MEIGS_SINKING",
      "USAT_MAUNA_LOA_SINKING",
      "BRITISH_MOTORIST_SINKING",
      "AHS_MANUNDA_DAMAGE",
      "HMAS_SWAN_ENGAGEMENT",
      "HMAS_PLATYPUS_DAMAGE",
      "HMAS_DELORAINE_ACTION",
      "SS_BAROSSA_BEACHING",
      "COAL_HULK_KELAT_FLOODING",
      "HMAS_KANGAROO_DAMAGE",
      "CASUALTIES_OFFICIAL_HISTORY_243"
    ],
    claimsSupportedBySynthesis: [
      "TOTAL_HARBOUR_TONNAGE_AFLOAT"
    ],
    reliabilityNotes: "Official naval history based directly on RAN operational logs, Naval Officer-in-Charge Darwin reports of proceedings, ship logs, and Naval Board archives. Authoritative on harbour shipping dispositions, ship damage, and sinking sequences.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Provides definitive operational inventory of all 45 naval and merchant vessels in Darwin Harbour on 19 Feb 1942. Cites Lowe Commission finding of 243 casualties."
  },
  {
    id: "GILLISON_RAAF_VOL1",
    sourceId: "GILLISON_RAAF_VOL1",
    title: "Royal Australian Air Force, 1939–1942 (Australia in the War of 1939–1945, Series 3 — Air, Volume I)",
    creator: "Douglas Gillison",
    institution: "Australian War Memorial",
    date: "1962",
    sourceClassification: "OFFICIAL_HISTORY",
    sourceType: "OFFICIAL_HISTORY",
    classification: "OFFICIAL_HISTORY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "AWM Official History Series (Air I), Chapter 17: 'The Raid on Darwin', pp. 423–438",
    catalogueVerificationNotes: "Catalogue-verified in Australian War Memorial collection (ID: C1417391). Full digital scan available online through AWM.",
    url: "https://www.awm.gov.au/collection/C1417391",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "USAAF_33RD_PURSUIT_COMBAT_AND_LOSSES",
      "RAAF_AIRFIELD_DAMAGE",
      "FATHER_MCGRATH_WARNING_TRANSMISSION",
      "RADAR_311_STATUS",
      "SECOND_WAVE_TIMING_AND_IMPACT"
    ],
    claimsSupportedBySynthesis: [
      "AIR_DEFENCE_COORDINATION_FAILURE"
    ],
    reliabilityNotes: "Official air history based on RAAF Area Combined Headquarters Darwin logs, Squadron Operations Record Books (ORBs), and USAAF 33rd Pursuit Squadron casualty and action records.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Authoritative on fighter combat (Major Pell's P-40s), RAAF airfield damage, and Father McGrath's radio warning transmission."
  },
  {
    id: "SENSHI_SOSHO_VOL26",
    sourceId: "SENSHI_SOSHO_VOL26",
    title: "Senshi Sōsho, Volume 26: Operations of the Navy in the Netherlands East Indies and the Bay of Bengal (Ran'in Ben'garu-wan Hōmen Kaigun Shinkō Sakusen)",
    creator: "War History Office (Boei Kenshujo / National Institute for Defense Studies)",
    institution: "Defense Agency of Japan (Asagumo Shimbunsha)",
    date: "1969",
    sourceClassification: "OFFICIAL_HISTORY",
    sourceType: "OFFICIAL_HISTORY",
    classification: "OFFICIAL_HISTORY",
    authenticationStatus: "BIBLIOGRAPHICALLY_VERIFIED",
    archiveReference: "Senshi Sōsho Vol. 26, Section 4: 'Air Strike on Darwin', pp. 428–446",
    catalogueVerificationNotes: "Bibliographically verified Japanese official post-war military history published 1969 by Asagumo Shimbunsha for the Defense Agency War History Office. Preserved in National Institute for Defense Studies (NIDS) and National Library of Australia (Bib ID: 1989403). Incorporates surviving Imperial Japanese Navy operational air logs, Kido Butai action reports, and Kokutai combat records.",
    url: "https://www.nids.mod.go.jp/military_history_search",
    accessStatus: "PHYSICAL_ARCHIVE_WITH_PUBLISHED_EXTRACTS",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "FIRST_WAVE_COMPOSITION_188_AIRCRAFT",
      "FIRST_WAVE_BREAKDOWN_81_KATE_71_VAL_36_ZERO",
      "CARRIER_ALLOCATIONS_AKAGI_KAGA_SORYU_HIRYU",
      "CARRIER_LAUNCH_TIME_0800",
      "SECOND_WAVE_COMPOSITION_54_BOMBERS",
      "SECOND_WAVE_TAKAO_27_BETTY_KENDARI",
      "SECOND_WAVE_FIRST_KOKUTAI_27_NELL_AMBON",
      "ATTACK_ALTITUDE_LEVEL_AND_DIVE_BOMBERS",
      "JAPANESE_AIRCRAFT_LOSSES_CARRIER_AND_LAND"
    ],
    claimsSupportedBySynthesis: [
      "CARRIER_LAUNCH_CENTROID_TIMOR_SEA"
    ],
    reliabilityNotes: "Official Japanese operational war history compiled directly from surviving Imperial Japanese Navy operational air logs, Kido Butai action reports, and Kokutai combat diaries.",
    rightsStatus: "PUBLIC_ACCESS_HISTORICAL_RECORD",
    notes: "Definitive evidence on Japanese force totals: First Wave (188 carrier aircraft from 1st Carrier Air Fleet: 81 B5N2 Kate level bombers, 71 D3A1 Val dive bombers, 36 A6M2 Zero fighters) and Second Wave (54 land-based naval bombers: 27 G4M1 Betty from Takao Kokutai and 27 G3M2 Nell from 1st Kokutai)."
  },
  {
    id: "RAN_HMAS_MELVILLE_WAR_DIARY_1942",
    sourceId: "RAN_HMAS_MELVILLE_WAR_DIARY_1942",
    title: "HMAS Melville (Naval Base Darwin) War Diary and Reports of Proceedings: February 1942",
    creator: "Captain E.P. Thomas, RAN (Naval Officer-in-Charge Darwin)",
    institution: "Royal Australian Navy / Australian War Memorial",
    date: "1942-02",
    sourceClassification: "ARCHIVAL_MATERIAL",
    sourceType: "ARCHIVAL_MATERIAL",
    classification: "ARCHIVAL_MATERIAL",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "AWM78: 418/1 (Reports of Proceedings, HMAS Melville)",
    catalogueVerificationNotes: "Catalogue-verified in Australian War Memorial collection (ID: C1355420). Series AWM78 (Reports of Proceedings, HMA Ships and Establishments), item 418/1.",
    url: "https://www.awm.gov.au/collection/C1355420",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "NAVAL_SIGNALS_DARWIN_HARBOUR",
      "BOOM_DEFENCE_STATUS",
      "VESSEL_SINKINGS_LOGS",
      "HMAS_KANGAROO_CASUALTY_COUCHMAN"
    ],
    claimsSupportedBySynthesis: [
      "HARBOUR_EVACUATION_TIMELINE"
    ],
    reliabilityNotes: "Primary contemporary operational war diary kept by naval headquarters in Darwin during the attack.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Records naval communications, harbour signals, boom gate status, and direct reports of ship sinkings."
  },
  {
    id: "US_NAVY_DANFS_PEARY",
    sourceId: "US_NAVY_DANFS_PEARY",
    title: "Dictionary of American Naval Fighting Ships: USS Peary (DD-226)",
    creator: "Naval History Division",
    institution: "Naval History and Heritage Command (NHHC), Washington Navy Yard",
    date: "2019",
    sourceClassification: "MODERN_INSTITUTIONAL_SUMMARY",
    sourceType: "MODERN_INSTITUTIONAL_SUMMARY",
    classification: "MODERN_INSTITUTIONAL_SUMMARY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "NHHC DANFS entry: Peary I (Destroyer No. 226)",
    catalogueVerificationNotes: "Catalogue-verified in US Naval History and Heritage Command official digital ship histories register.",
    url: "https://www.history.navy.mil/research/histories/ship-histories/danfs/p/peary-i.html",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "USS_PEARY_5_BOMB_HITS",
      "USS_PEARY_FATALITIES_91",
      "USS_PEARY_SINKING_TIME_1300",
      "COMMANDING_OFFICER_BERMINGHAM"
    ],
    claimsSupportedBySynthesis: [
      "USN_TOTAL_CASUALTIES_DARWIN"
    ],
    reliabilityNotes: "Official United States Navy historical service record and casualty compilation for USS Peary.",
    rightsStatus: "US_GOVERNMENT_WORK_PUBLIC_DOMAIN",
    notes: "Confirms 5 bomb hits, sinking stern-first at ~13:00, loss of 91 crew including Commanding Officer Lt. Cdr. John M. Bermingham."
  },
  {
    id: "US_NAVY_DANFS_PRESTON",
    sourceId: "US_NAVY_DANFS_PRESTON",
    title: "Dictionary of American Naval Fighting Ships: USS William B. Preston (AVD-7)",
    creator: "Naval History Division",
    institution: "Naval History and Heritage Command (NHHC), Washington Navy Yard",
    date: "2019",
    sourceClassification: "MODERN_INSTITUTIONAL_SUMMARY",
    sourceType: "MODERN_INSTITUTIONAL_SUMMARY",
    classification: "MODERN_INSTITUTIONAL_SUMMARY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "NHHC DANFS entry: William B. Preston (DD-344 / AVD-7)",
    catalogueVerificationNotes: "Catalogue-verified in US Naval History and Heritage Command official digital ship histories register.",
    url: "https://www.history.navy.mil/research/histories/ship-histories/danfs/w/william-b-preston.html",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "USS_WILLIAM_B_PRESTON_DAMAGE_AND_14_FATALITIES"
    ],
    claimsSupportedBySynthesis: [
      "SEAPLANE_TENDER_OPERATIONAL_ROLE"
    ],
    reliabilityNotes: "Official US Navy action record of seaplane tender William B. Preston in Darwin Harbour.",
    rightsStatus: "US_GOVERNMENT_WORK_PUBLIC_DOMAIN",
    notes: "Confirms bomb hit aft causing steering casualty, 14 crew killed, vessel saved and moved to open sea."
  },
  {
    id: "ADMIRALTY_CHART_925_1942",
    sourceId: "ADMIRALTY_CHART_925_1942",
    title: "British Admiralty / RAN Hydrographic Chart 925: Port Darwin (With Corrections to 1942)",
    creator: "Hydrographic Department, Admiralty / Hydrographic Branch RAN",
    institution: "British Admiralty / Royal Australian Navy Hydrographic Branch / National Library of Australia",
    date: "1942",
    sourceClassification: "OFFICIAL_HYDROGRAPHIC_SURVEY",
    sourceType: "OFFICIAL_HYDROGRAPHIC_SURVEY",
    classification: "OFFICIAL_HYDROGRAPHIC_SURVEY",
    authenticationStatus: "BIBLIOGRAPHICALLY_VERIFIED",
    archiveReference: "British Admiralty Chart 925 (1942 edition); National Library of Australia Call Number: Map RaA 17 Plate 925; UK Hydrographic Office Archives",
    catalogueVerificationNotes: "Bibliographically verified published nautical chart preserved in National Library of Australia (Map RaA 17 Plate 925) and UK Hydrographic Office. NOTE ON ARCHIVAL ITEM: The specific file reference 'NAA: MP1049/5, 1942/925' remains UNVERIFIED at the item level in National Archives of Australia and is not treated as a verified catalogue accession.",
    url: "https://catalogue.nla.gov.au/Record/1776991",
    accessStatus: "PHYSICAL_ARCHIVE_WITH_DIGITISED_FOLIO",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "PORT_DARWIN_1942_COASTLINE",
      "FORT_HILL_PRE_EXCAVATION_SHORELINE",
      "HARBOUR_SOUNDINGS_1942"
    ],
    claimsSupportedBySynthesis: [
      "PRE_DEVELOPMENT_INTERTIDAL_ZONES"
    ],
    reliabilityNotes: "Authoritative wartime hydrographic chart showing 1942 shoreline, low-water sandbanks, buoy locations, and channel soundings prior to modern harbour reclamation.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Essential baseline layer for 1942 coastline and anchorage depths. Not yet georeferenced or rectified to modern WGS84/GDA2020."
  },
  {
    id: "NAA_DARWIN_WHARF_PLANS_1942",
    sourceId: "NAA_DARWIN_WHARF_PLANS_1942",
    title: "Darwin Town Pier (Stokes Hill Wharf): General Arrangement, Railway Approach, and Post-Raid Damage Survey Plans",
    creator: "Department of the Interior / Commonwealth Railways Engineering Branch",
    institution: "National Archives of Australia",
    date: "1941–1942",
    sourceClassification: "ARCHIVAL_MATERIAL",
    sourceType: "ARCHIVAL_MATERIAL",
    classification: "ARCHIVAL_MATERIAL",
    authenticationStatus: "INDIRECTLY_ATTESTED",
    archiveReference: "NAA: Series A2633 (Drawings, specifications and contracts relating to works in the Northern Territory)",
    catalogueVerificationNotes: "Series A2633 is catalogue-verified in NAA, but specific item-level engineering drawings for the post-raid damage breach remain unretrieved at the item level. Positioned as indirectly attested pending certified item-level retrieval.",
    url: "https://recordsearch.naa.gov.au",
    accessStatus: "DIGITISED_IN_PART",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [],
    claimsSupportedBySynthesis: [
      "STOKES_HILL_WHARF_1942_TIMBER_CONSTRUCTION",
      "RAILWAY_VIADUCT_APPROACH",
      "NEPTUNA_BREACH_DIMENSIONS_APPROX"
    ],
    reliabilityNotes: "Primary engineering blueprints and post-explosion reconstruction drawings for Stokes Hill Wharf and timber railway viaduct.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Provides structural dimensions of 1942 timber wharf, rail approaches, cargo shed locations, and the central breach where MV Neptuna exploded. Direct claims downgraded pending item-level accession retrieval."
  },
  {
    id: "AWM_AERIAL_RECON_1942",
    sourceId: "AWM_AERIAL_RECON_1942",
    title: "RAAF Photographic Reconnaissance Aerial Photographs of Darwin Harbour and Town: 19–20 February 1942",
    creator: "No. 13 Squadron RAAF / Photographic Section",
    institution: "Australian War Memorial",
    date: "1942-02-20",
    sourceClassification: "ARCHIVAL_MATERIAL",
    sourceType: "ARCHIVAL_MATERIAL",
    classification: "ARCHIVAL_MATERIAL",
    authenticationStatus: "BIBLIOGRAPHICALLY_VERIFIED",
    archiveReference: "AWM Photographic Collection C289547 (Items 011570, 011571, 011572, 011573)",
    catalogueVerificationNotes: "Photographic collection verified in Australian War Memorial historical holdings. Digital public records document post-raid smoke plumes, burning fuel tanks, and severed wharf viaduct.",
    url: "https://www.awm.gov.au/collection/C289547",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "STOKES_HILL_WHARF_SEVERANCE_VISUAL",
      "OIL_TANK_FIRES_STOKES_HILL",
      "HARBOUR_SMOKE_PLUMES_LOCATIONS"
    ],
    claimsSupportedBySynthesis: [
      "HARBOUR_DAMAGE_SPATIAL_DISTRIBUTION"
    ],
    reliabilityNotes: "High-value primary photographic evidence taken immediately after the raid showing smoke columns, oil tank fires on Stokes Hill, sunken hulls, and wharf severance.",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "Critical for verifying wreckage locations, burning oil tanks, and damage to harbour infrastructure. Requires photogrammetric orthorectification before use as spatial ground truth."
  },
  {
    id: "FATHER_MCGRATH_RADIO_LOG_1942",
    sourceId: "FATHER_MCGRATH_RADIO_LOG_1942",
    title: "Radio Warning Message from Sacred Heart Mission, Bathurst Island: Transmission Record 19 February 1942",
    creator: "Father John McGrath (Missionary & Coastwatcher) / Postmaster General's Department Radio Service (Station VID Darwin)",
    institution: "National Archives of Australia / Sacred Heart Mission Archives",
    date: "1942-02-19",
    sourceClassification: "PRIMARY_DOCUMENT",
    sourceType: "PRIMARY_DOCUMENT",
    classification: "PRIMARY_DOCUMENT",
    authenticationStatus: "INDIRECTLY_ATTESTED",
    archiveReference: "Lowe Commission Exhibit 3 (in NAA: MP401/1, CL14687/1 and NAA: A816, 37/301/293); verbatim transcript recorded in Gillison (1962), p. 425",
    catalogueVerificationNotes: "Message transmission and reception attested in Lowe Commission proceedings and Australian official history. Original telegraphic strip received at Station VID tendered as Exhibit 3; catalogued within Commission exhibit files rather than as an independent standalone item accession.",
    url: "https://recordsearch.naa.gov.au",
    accessStatus: "ARCHIVAL_TRANSCRIPT_PUBLISHED",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "WARNING_TIME_0935",
      "BATHURST_ISLAND_SIGHTING_HEADING_SOUTH"
    ],
    claimsSupportedBySynthesis: [
      "AIR_DEFENCE_MISINTERPRETATION"
    ],
    reliabilityNotes: "Primary operational telegraphic record of the warning transmitted at approx 09:37: 'An unusually large air formation bearing south, heading south, observed over Bathurst Island.'",
    rightsStatus: "CROWN_COPYRIGHT_EXPIRED_PUBLIC_DOMAIN",
    notes: "The primary detection evidence that was received in Darwin but discounted as returning US P-40 fighters."
  },
  {
    id: "CWGC_DARWIN_CIVILIAN",
    sourceId: "CWGC_DARWIN_CIVILIAN",
    title: "Civilian War Dead Register: Darwin, Northern Territory, 19 February 1942",
    creator: "Commonwealth War Graves Commission (CWGC)",
    institution: "Commonwealth War Graves Commission",
    date: "1942–1945",
    sourceClassification: "WAR_GRAVES_RECORD",
    sourceType: "WAR_GRAVES_RECORD",
    classification: "WAR_GRAVES_RECORD",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "CWGC Civilian War Dead Roll of Honour: Australia (Darwin)",
    catalogueVerificationNotes: "Catalogue-verified in Commonwealth War Graves Commission official register. Confirms individual civilian war casualties by name, location, and date of death.",
    url: "https://www.cwgc.org",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "POST_OFFICE_CIVILIAN_FATALITIES_NAMES_AND_COUNT_9",
      "WHARF_CIVILIAN_LABOURER_DEATHS"
    ],
    claimsSupportedBySynthesis: [
      "CIVILIAN_PROPORTION_TOTAL_CASUALTIES"
    ],
    reliabilityNotes: "Official verified roll of civilian fatalities, including the 9 postal and telegraphic workers killed in the trench behind Darwin Post Office.",
    rightsStatus: "OFFICIAL_REGISTER_PUBLIC_ACCESS",
    notes: "Confirms names and details of civilian post office and town fatalities."
  },
  {
    id: "GROSE_1942_DISASTER",
    sourceId: "GROSE_1942_DISASTER",
    title: "An Awkward Truth: The Bombing of Darwin, February 1942",
    creator: "Peter Grose",
    institution: "Allen & Unwin",
    date: "2009",
    sourceClassification: "SCHOLARLY_SECONDARY",
    sourceType: "SCHOLARLY_SECONDARY",
    classification: "SCHOLARLY_SECONDARY",
    authenticationStatus: "BIBLIOGRAPHICALLY_VERIFIED",
    archiveReference: "ISBN: 978-1741756432; NLA Bib ID: 4572213",
    catalogueVerificationNotes: "Bibliographically verified published monograph in National Library of Australia and global library catalogues.",
    url: "https://catalogue.nla.gov.au/Record/4572213",
    accessStatus: "PUBLISHED_BOOK",
    primaryOrSecondary: "SECONDARY",
    claimsSupported: [
      "CASUALTY_HISTORIOGRAPHY_ANALYSIS"
    ],
    claimsSupportedBySynthesis: [
      "RADAR_INSTALLATION_TIMELINE",
      "AIR_ROUTE_SYNTHESIS",
      "MODERN_CASUALTY_RANGE_235_TO_250_PLUS"
    ],
    reliabilityNotes: "Rigorous modern archival study cross-referencing Australian, American, and Japanese primary sources. Evaluates casualty figures, radar delays, and air routes.",
    rightsStatus: "ALLEN_AND_UNWIN_COPYRIGHT",
    notes: "Secondary reference for synthesis of Japanese flight paths and Allied radar operational status."
  },
  {
    id: "ALFORD_DARWIN_1942",
    sourceId: "ALFORD_DARWIN_1942",
    title: "Darwin's Air War: 1942–1945. An Illustrated History",
    creator: "Bob Alford",
    institution: "The Aviation Historical Society of the Northern Territory",
    date: "2011",
    sourceClassification: "SCHOLARLY_SECONDARY",
    sourceType: "SCHOLARLY_SECONDARY",
    classification: "SCHOLARLY_SECONDARY",
    authenticationStatus: "BIBLIOGRAPHICALLY_VERIFIED",
    archiveReference: "ISBN: 978-0980771305; NLA Bib ID: 5218765",
    catalogueVerificationNotes: "Bibliographically verified specialist aviation history monograph published by Aviation Historical Society of the Northern Territory.",
    url: "https://catalogue.nla.gov.au/Record/5218765",
    accessStatus: "PUBLISHED_BOOK",
    primaryOrSecondary: "SECONDARY",
    claimsSupported: [
      "JAPANESE_AIRCRAFT_SERIALS_AND_PILOTS"
    ],
    claimsSupportedBySynthesis: [
      "ANTI_AIRCRAFT_BATTERY_ENGAGEMENTS",
      "SECOND_WAVE_ALTITUDES_AND_TARGETS"
    ],
    reliabilityNotes: "Foremost Northern Territory aviation historian. Detailed analysis of aircraft serials, pilot combat reports, and anti-aircraft battery engagements.",
    rightsStatus: "AHSNT_COPYRIGHT",
    notes: "Secondary reference for aircraft types, unit strengths, and anti-aircraft gun positions."
  },
  {
    id: "NAA_FACT_SHEET_195",
    sourceId: "NAA_FACT_SHEET_195",
    title: "National Archives of Australia Fact Sheet 195: The Bombing of Darwin",
    creator: "National Archives of Australia",
    institution: "National Archives of Australia",
    date: "2021",
    sourceClassification: "MODERN_INSTITUTIONAL_SUMMARY",
    sourceType: "MODERN_INSTITUTIONAL_SUMMARY",
    classification: "MODERN_INSTITUTIONAL_SUMMARY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "NAA Fact Sheet 195 (Digital Fact Sheet Series)",
    catalogueVerificationNotes: "Catalogue-verified official publication of the National Archives of Australia documenting collection holdings, raid chronology, and public casualty figures.",
    url: "https://www.naa.gov.au/explore-collection/snapshots/fact-sheets/fact-sheet-195-bombing-darwin",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "CASUALTY_NAA_PUBLIC_235"
    ],
    claimsSupportedBySynthesis: [],
    reliabilityNotes: "Current official public account from the National Archives of Australia reporting 'at least 235 people killed and 300 to 400 wounded'.",
    rightsStatus: "CC_BY_4_0",
    notes: "Authoritative contemporary public statement of the National Archives casualty position."
  },
  {
    id: "AWM_DARWIN_ENCYCLOPEDIA",
    sourceId: "AWM_DARWIN_ENCYCLOPEDIA",
    title: "Australian War Memorial Military History Encyclopedia: 1942 Darwin Air Raids",
    creator: "Military History Section",
    institution: "Australian War Memorial",
    date: "2022",
    sourceClassification: "MODERN_INSTITUTIONAL_SUMMARY",
    sourceType: "MODERN_INSTITUTIONAL_SUMMARY",
    classification: "MODERN_INSTITUTIONAL_SUMMARY",
    authenticationStatus: "CATALOGUE_VERIFIED",
    archiveReference: "AWM Military History Encyclopedia: Bombing of Darwin",
    catalogueVerificationNotes: "Catalogue-verified official publication of the Australian War Memorial summarizing official histories and post-war research.",
    url: "https://www.awm.gov.au/articles/encyclopedia/darwin",
    accessStatus: "DIGITISED_ONLINE",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [
      "CASUALTY_AWM_INTERPRETATION"
    ],
    claimsSupportedBySynthesis: [],
    reliabilityNotes: "Summarizes the Australian War Memorial position: official historians concluded approximately 243 killed, noting post-war research and upward revisions.",
    rightsStatus: "CC_BY_4_0",
    notes: "Authoritative contemporary public statement of the Australian War Memorial casualty position."
  },
  {
    id: "SOURCE_REQUIRED_1942_WHARF_SURVEY",
    sourceId: "SOURCE_REQUIRED_1942_WHARF_SURVEY",
    title: "[SOURCE REQUIRED] Georeferenced Engineering & Cadastral Survey of 1942 Stokes Hill Timber Wharf",
    creator: "Department of the Interior / Darwin Port Authority / Northern Territory Archives Service",
    institution: "Northern Territory Archives Service / National Archives of Australia",
    date: "REQUIRED",
    sourceClassification: "ARCHIVAL_MATERIAL",
    sourceType: "ARCHIVAL_MATERIAL",
    classification: "ARCHIVAL_MATERIAL",
    authenticationStatus: "SOURCE_REQUIRED",
    archiveReference: "PENDING_ARCHIVAL_RETRIEVAL",
    catalogueVerificationNotes: "Required archival record. No certified engineering survey with tied georeferenced coordinates has yet been integrated.",
    url: null,
    accessStatus: "SOURCE_REQUIRED",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [],
    claimsSupportedBySynthesis: [
      "STOKES_HILL_WHARF_1942_PRECISE_GEOMETRY"
    ],
    reliabilityNotes: "Required to obtain certified engineering coordinates for 1942 timber piles, rail curved approach, shed foundations, and exact explosive breach geometry before any 3D wharf reconstruction.",
    rightsStatus: "PENDING",
    notes: "BLOCKING: 1942 wharf geometry must remain UNRESOLVED until this primary georeferenced survey is integrated."
  },
  {
    id: "SOURCE_REQUIRED_HARBOUR_MOORINGS_LOG_1942",
    sourceId: "SOURCE_REQUIRED_HARBOUR_MOORINGS_LOG_1942",
    title: "[SOURCE REQUIRED] Naval Officer-in-Charge Darwin Berthing & Mooring Plan: 19 February 1942",
    creator: "Naval Officer-in-Charge Darwin (Captain E.P. Thomas)",
    institution: "National Archives of Australia (Navy Records)",
    date: "REQUIRED",
    sourceClassification: "ARCHIVAL_MATERIAL",
    sourceType: "ARCHIVAL_MATERIAL",
    classification: "ARCHIVAL_MATERIAL",
    authenticationStatus: "SOURCE_REQUIRED",
    archiveReference: "PENDING_ARCHIVAL_RETRIEVAL (NAA: MP1049/5 Series)",
    catalogueVerificationNotes: "Required archival record. Pre-attack designated moorings are approximate pending primary log retrieval.",
    url: null,
    accessStatus: "SOURCE_REQUIRED",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [],
    claimsSupportedBySynthesis: [
      "PRE_ATTACK_HARBOUR_VESSEL_EXACT_MOORINGS"
    ],
    reliabilityNotes: "Required to verify precise designated anchor berths (Berths 1–25) and Man-of-War mooring locations for vessels in the harbour at 09:30 on 19 Feb 1942.",
    rightsStatus: "PENDING",
    notes: "IMPORTANT: Vessel positions currently carry APPROXIMATE spatial confidence based on narrative reports and wreck coordinates."
  },
  {
    id: "SOURCE_REQUIRED_AA_SITE_PLANS_1942",
    sourceId: "SOURCE_REQUIRED_AA_SITE_PLANS_1942",
    title: "[SOURCE REQUIRED] Royal Australian Artillery 14th Heavy Anti-Aircraft Battery Emplacement Plans",
    creator: "Royal Australian Artillery, 7th Military District",
    institution: "Australian War Memorial (AWM52 4/1/14 War Diaries)",
    date: "REQUIRED",
    sourceClassification: "ARCHIVAL_MATERIAL",
    sourceType: "ARCHIVAL_MATERIAL",
    classification: "ARCHIVAL_MATERIAL",
    authenticationStatus: "SOURCE_REQUIRED",
    archiveReference: "PENDING_ARCHIVAL_RETRIEVAL",
    catalogueVerificationNotes: "Required archival record. Gun pit centerlines currently approximate based on regional military sketch maps.",
    url: null,
    accessStatus: "SOURCE_REQUIRED",
    primaryOrSecondary: "PRIMARY",
    claimsSupported: [],
    claimsSupportedBySynthesis: [
      "AA_GUN_PIT_EXACT_GEOMETRY"
    ],
    reliabilityNotes: "Required to verify exact gun pit coordinates for 3.7-inch and Bofors 40mm anti-aircraft batteries at Darwin Oval, Fort Hill, and Fannie Bay.",
    rightsStatus: "PENDING",
    notes: "IMPORTANT: AA positions currently carry APPROXIMATE spatial confidence based on district maps."
  }
];

const out = {
  version: "0.4.0",
  status: "STAGE_2_2_CANONICAL_SOURCES_REGISTER",
  auditMetadata: {
    auditStage: "STAGE_2_2_FINAL_SOURCE_AUTHENTICATION_AND_CARTO_AUDIT",
    leadAuthority: "TRUTH",
    technicalSupport: "TECHNOLOGY",
    authenticationDate: "2026-09-15",
    notes: "Separated sourceClassification from authenticationStatus. Catalogue-verified Lowe Commission references across NAA series A816, A431, A461, MP401/1, MP1185/8. Registered institutional sources for casualty historiography (NAA Fact Sheet 195, AWM Encyclopedia). Audited all 21 sources for claims directly supported vs claims supported by synthesis."
  },
  sources: sources,
  template: {
    id: "SOURCE_ID",
    sourceId: "SOURCE_ID",
    title: null,
    creator: null,
    institution: null,
    date: null,
    sourceClassification: "PRIMARY_DOCUMENT | ARCHIVAL_MATERIAL | OFFICIAL_HISTORY | OFFICIAL_HYDROGRAPHIC_SURVEY | WAR_GRAVES_RECORD | SCHOLARLY_SECONDARY | MODERN_INSTITUTIONAL_SUMMARY | HISTORICAL_SYNTHESIS",
    authenticationStatus: "CATALOGUE_VERIFIED | BIBLIOGRAPHICALLY_VERIFIED | INDIRECTLY_ATTESTED | UNVERIFIED | SUSPECT | SOURCE_REQUIRED",
    archiveReference: null,
    catalogueVerificationNotes: null,
    url: null,
    accessStatus: "DIGITISED_ONLINE | PHYSICAL_ARCHIVE_WITH_PUBLISHED_EXTRACTS | PHYSICAL_ARCHIVE_WITH_DIGITISED_FOLIO | ARCHIVAL_TRANSCRIPT_PUBLISHED | PUBLISHED_BOOK | SOURCE_REQUIRED",
    primaryOrSecondary: "PRIMARY | SECONDARY",
    claimsSupported: [],
    claimsSupportedBySynthesis: [],
    reliabilityNotes: null,
    rightsStatus: null,
    notes: null
  }
};

fs.writeFileSync(path.resolve('data/entities/sources.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Successfully generated data/entities/sources.json with ${sources.length} sources.`);
