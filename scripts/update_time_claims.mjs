import fs from 'fs';

const path = 'data/historical-canon.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

for (let claim of data.claims) {
    if (claim.id.startsWith('TIME_') || claim.id === 'WARNING_TIME_0935' || claim.id === 'ATTACK_TIME_0958') {
        let precision = "EXACT";
        let normStatus = "SOURCE_LOCAL_TIME";
        let tzBasis = "Darwin Local Time (Daylight Saving, UTC+10:30)";
        
        if (claim.value.includes('approx') || claim.value.includes('–')) {
            precision = "APPROXIMATE";
        }
        
        let reportedTime = claim.value.replace(' approx', '');

        if (claim.id === 'TIME_0800') {
           tzBasis = "Tokyo Standard Time (UTC+09:00) / Darwin Local Time (UTC+10:30)";
           normStatus = "NORMALIZED_TO_DARWIN_LOCAL";
        }
        
        claim.temporalProvenance = {
            reportedTime: reportedTime,
            reportedTimeZoneOrBasis: tzBasis,
            normalizedDarwinLocalTime: reportedTime,
            utcOffset: "+10:30",
            normalizationStatus: normStatus,
            precision: precision,
            notes: claim.note
        };
    }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('Updated temporal provenance in historical-canon.json');
