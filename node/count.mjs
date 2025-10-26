import fs from 'fs';
import path from 'path';

// ---- CHANGE THESE PATHS to your latest output dirs ----
const proposalsDir = 'merged_output_proposals'; 
const deploymentsDir = 'merged_output_deployments'; 
const votesDir = 'merged_output_votes';

function countDeployments(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`Deployments directory not found: ${dir}`);
        return { files: 0, deployments: 0 };
    }

    const files = fs.readdirSync(dir);
    let totalDeployments = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (Array.isArray(content)) {
                totalDeployments += content.length;
            }
        } catch (e) {
            console.warn(`Skipping malformed file: ${filePath}`);
        }
    }
    return { files: files.length, deployments: totalDeployments };
}

function countProposals(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`Proposals directory not found: ${dir}`);
        return { files: 0, proposals: 0 };
    }

    const files = fs.readdirSync(dir);
    let totalProposals = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            // proposals are nested arrays
            content.forEach(list => {
                if (Array.isArray(list)) {
                    totalProposals += list.length;
                }
            });
        } catch (e) {
            console.warn(`Skipping malformed file: ${filePath}`);
        }
    }
    return { files: files.length, proposals: totalProposals };
}

function countVotes(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`Votes directory not found: ${dir}`);
        return { files: 0, votes: 0 };
    }

    const files = fs.readdirSync(dir);
    let totalVotes = 0;

    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            // each vote file is just an array of votes
            if (Array.isArray(content)) {
                totalVotes += content.length;
            }
        } catch (e) {
            console.warn(`Skipping malformed file: ${filePath}`);
        }
    }
    return { files: files.length, votes: totalVotes };
}

const deploymentStats = countDeployments(deploymentsDir);
const proposalStats = countProposals(proposalsDir);
const voteStats = countVotes(votesDir);

console.log('=== Stats ===');
console.log(`Deployments ${deploymentStats.deployments} (across ${deploymentStats.files} files)`);
console.log(`Proposals: ${proposalStats.proposals} (across ${proposalStats.files} files)`);
console.log(`Votes:     ${voteStats.votes} (across ${voteStats.files} files)`);

// === Stats ===
// Deployments 6262 (across 34 files)
// Proposals: 150 (across 34 files)
// Votes:     177 (across 127 files)