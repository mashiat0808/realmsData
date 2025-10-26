import fs from "fs";
import path from "path";

const baseDir = "."; // current working dir
const mergedDir = "merged_output_votes";

// create merged folder if not exists
if (!fs.existsSync(mergedDir)) {
    fs.mkdirSync(mergedDir);
}

// find all folders like output_votes_YYYY_M_D
const folders = fs
    .readdirSync(baseDir)
    .filter(
        (f) =>
            fs.statSync(path.join(baseDir, f)).isDirectory() &&
            f.startsWith("output_votes_")
    );

console.log("Found vote folders:", folders);

// track best file per (programId, realmId, proposalId)
const voteMap = new Map();

for (const folder of folders) {
    const files = fs.readdirSync(folder).filter((f) => f.endsWith("_votes.json"));

    for (const file of files) {
        // filename: PROGRAM_REALM_PROPOSAL_votes.json
        const parts = file.split("_");
        const programId = parts[0];
        const realmId = parts[1];
        const proposalId = parts.slice(2, -1).join("_"); // handles long pubkeys
        const key = `${programId}_${realmId}_${proposalId}`;

        const srcPath = path.join(folder, file);

        try {
            const data = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
            const count = Array.isArray(data) ? data.length : 0;

            if (!voteMap.has(key) || count > voteMap.get(key).count) {
                voteMap.set(key, { path: srcPath, count, filename: file });
                console.log(`Selected ${key} from ${folder} (count=${count})`);
            } else {
                console.log(
                    `Skipped ${key} from ${folder} (count=${count}, smaller than best)`
                );
            }
        } catch (err) {
            console.error(`Error parsing ${srcPath}:`, err.message);
        }
    }
}

// copy best version of each vote file into merged folder
for (const [key, { path: srcPath, filename }] of voteMap) {
    const destPath = path.join(mergedDir, filename);
    fs.copyFileSync(srcPath, destPath);
}

console.log(`✅ Merged ${voteMap.size} unique (programId, realmId, proposalId) into "${mergedDir}"`);
