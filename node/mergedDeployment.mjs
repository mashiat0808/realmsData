import fs from "fs";
import path from "path";

const baseDir = "."; // current working directory
const mergedDir = "merged_output_deployments";

// create merged folder if not exists
if (!fs.existsSync(mergedDir)) {
    fs.mkdirSync(mergedDir);
}

// get all folders like output_deployments_YYYY_M_D
const folders = fs
    .readdirSync(baseDir)
    .filter(
        (f) =>
            fs.statSync(path.join(baseDir, f)).isDirectory() &&
            f.startsWith("output_deployments_")
    );

console.log("Found folders:", folders);

// store the "best" file per programId
const programMap = new Map();

// ...existing code...
for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith("_realms.json"));

    for (const file of files) {
        const programId = file.replace("_realms.json", "");
        const srcPath = path.join(folderPath, file);

        try {
            const data = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
            const count = Array.isArray(data) ? data.length : 0;

            if (!programMap.has(programId) || count > programMap.get(programId).count) {
                programMap.set(programId, { path: srcPath, count });
                console.log(
                    `Selected ${programId} from ${folder} (count=${count})`
                );
            } else {
                console.log(
                    `Skipped ${programId} from ${folder} (count=${count}, smaller than best)`
                );
            }
        } catch (err) {
            console.error(`Error reading/parsing ${srcPath}:`, err.message);
        }
    }
}
// ...existing code...

// copy the best version of each programId into merged folder
for (const [programId, { path: srcPath }] of programMap) {
    const destPath = path.join(mergedDir, `${programId}_realms.json`);
    fs.copyFileSync(srcPath, destPath);
}

console.log(`✅ Merged ${programMap.size} unique programIds into "${mergedDir}"`);
