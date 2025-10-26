import fs from "fs";
import path from "path";

// adjust paths to your merged dirs
const deploymentsDir = "merged_output_deployments";
const proposalsDir = "merged_output_proposals";
const votesDir = "merged_output_votes";

// -------------------
// 1. Collect all deployments (deployment = programId)
// -------------------
const deploymentIds = new Set();
const deploymentFiles = fs.readdirSync(deploymentsDir);

for (const file of deploymentFiles) {
    if (!file.endsWith("_realms.json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file)));
    data.forEach((realm) => {
        deploymentIds.add(realm.owner); // programId
    });
}
console.log("Deployments:", deploymentIds.size);

// -------------------
// 2. Collect all proposals (proposal = proposal.pubkey)
// -------------------
const proposalIds = new Set();
const proposalsFiles = fs.readdirSync(proposalsDir);

for (const file of proposalsFiles) {
    if (!file.endsWith("_proposals.json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(proposalsDir, file)));
    for (const list of data) {
        if (Array.isArray(list)) {
            for (const proposal of list) {
                proposalIds.add(proposal.pubkey);
            }
        }
    }
}
console.log("Proposals:", proposalIds.size);

// -------------------
// 3. Collect all votes (vote files are keyed by proposal ID in filename)
// -------------------
const votedProposalIds = new Set();
const voteFiles = fs.readdirSync(votesDir);

for (const file of voteFiles) {
    if (!file.endsWith("_votes.json")) continue;
    // file format: <programId>_<realmId>_<proposalId>_votes.json
    const parts = file.split("_");
    const proposalId = parts.slice(2, -1).join("_"); // safe extract
    votedProposalIds.add(proposalId);
}
console.log("Proposals with votes:", votedProposalIds.size);

// -------------------
// 4. Find missing
// -------------------
const missingProposalDeployments = []; // deployments with no proposals
for (const depId of deploymentIds) {
    // check if ANY proposal exists for this deployment
    let hasProposal = false;
    for (const file of proposalsFiles) {
        if (file.startsWith(depId)) {
            hasProposal = true;
            break;
        }
    }
    if (!hasProposal) {
        missingProposalDeployments.push(depId);
    }
}

const missingVotes = [];
for (const propId of proposalIds) {
    if (!votedProposalIds.has(propId)) {
        missingVotes.push(propId);
    }
}

console.log("Missing proposals for deployments:", missingProposalDeployments.length);
console.log("Missing votes for proposals:", missingVotes.length);

// write reports
fs.writeFileSync(
    "missing_proposal_deployments.json",
    JSON.stringify(missingProposalDeployments, null, 2)
);
fs.writeFileSync(
    "missing_votes.json",
    JSON.stringify(missingVotes, null, 2)
);

console.log("✅ Reports written: missing_proposal_deployments.json, missing_votes.json");
