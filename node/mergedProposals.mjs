import fs from "fs";
import path from "path";

const baseDir = "."; // current working directory
const mergedDir = "merged_output_proposals";

// create merged folder if not exists
if (!fs.existsSync(mergedDir)) {
    fs.mkdirSync(mergedDir);
}

// find all folders like output_proposals_YYYY_M_D
const folders = fs
    .readdirSync(baseDir)
    .filter(
        (f) =>
            fs.statSync(path.join(baseDir, f)).isDirectory() &&
            f.startsWith("output_proposals_")
    );

console.log("Found proposal folders:", folders);

// track the best file per (programId, realmPubKey)
const proposalMap = new Map();

for (const folder of folders) {
    const files = fs.readdirSync(folder).filter((f) => f.endsWith("_proposals.json"));

    for (const file of files) {
        // example filename: PROGRAMID_REALMPUBKEY_proposals.json
        const [programId, realmPubKey] = file.replace("_proposals.json", "").split("_");

        const key = `${programId}_${realmPubKey}`;
        const srcPath = path.join(folder, file);

        try {
            const data = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
            // count = total number of proposals across governance arrays
            let count = 0;
            if (Array.isArray(data)) {
                for (const governance of data) {
                    if (Array.isArray(governance)) {
                        count += governance.length;
                    }
                }
            }

            if (!proposalMap.has(key) || count > proposalMap.get(key).count) {
                proposalMap.set(key, { path: srcPath, count });
                console.log(
                    `Selected ${key} from ${folder} (count=${count})`
                );
            } else {
                console.log(
                    `Skipped ${key} from ${folder} (count=${count}, smaller than best)`
                );
            }
        } catch (err) {
            console.error(`Error reading/parsing ${srcPath}:`, err.message);
        }
    }
}

// copy the best version of each proposal file into merged folder
for (const [key, { path: srcPath }] of proposalMap) {
    const destPath = path.join(mergedDir, `${key}_proposals.json`);
    fs.copyFileSync(srcPath, destPath);
}

console.log(`✅ Merged ${proposalMap.size} unique (programId, realmPubKey) into "${mergedDir}"`);
