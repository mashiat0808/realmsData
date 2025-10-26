const splGovernanceModule = await import('@solana/spl-governance');
import fs from 'fs';
const { getAllProposals } = splGovernanceModule;

const solanaWeb3 = await import('@solana/web3.js');
const { Connection, PublicKey } = solanaWeb3;

const RPC_URL = 'https://solana-rpc.publicnode.com';
const connection = new Connection(RPC_URL, 'recent');

// make an output directory based on the date
const date = new Date(2025, 8, 20); 
const outputDir = `output_proposals_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// load missing proposal deployments
const missingProposalFile = "missingIds/missing_proposal_deployments.json";
if (!fs.existsSync(missingProposalFile)) {
  console.error("❌ missing_proposal_deployments.json not found!");
  process.exit(1);
}
const missingRealms = JSON.parse(fs.readFileSync(missingProposalFile, "utf-8"));
console.log(`🔎 Found ${missingRealms.length} missing realms`);

// function: get proposals
const getProposalsForRealm = async (connection, programIdAsString, realmPublicKeyAsString) => {
  const programId = new PublicKey(programIdAsString);
  const realmPubKey = new PublicKey(realmPublicKeyAsString);

  const filename = `${outputDir}/${programId}_${realmPubKey}_proposals.json`;
  if (fs.existsSync(filename)) {
    console.log("  skipping", programId.toString(), realmPubKey.toString());
    return;
  }

  let success = false;
  let realmProposals = null;
  let timeout = 2000;

  for (let numTries = 0; numTries < 5; numTries++) {
    try {
      realmProposals = await getAllProposals(connection, programId, realmPubKey);
      success = true;
      break;
    } catch (e) {
      console.log("error", e);
      timeout *= 2;
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }

  if (!success) {
    const failedFile = `${outputDir}/failed_proposals.json`;
    let failedList = [];
    if (fs.existsSync(failedFile)) {
      try {
        failedList = JSON.parse(fs.readFileSync(failedFile, "utf-8"));
      } catch {}
    }
    failedList.push({ programId: programIdAsString, realmPubKey: realmPublicKeyAsString });
    fs.writeFileSync(failedFile, JSON.stringify(failedList, null, 2));
    console.log("  FAILED", programId.toString(), realmPubKey.toString());
    return;
  }

  // convert BN -> number
  realmProposals.forEach((solanaGovernance) => {
    solanaGovernance.forEach((proposal) => {
      if (proposal.account.votingCompletedAt) {
        proposal.account.votingCompletedAt = proposal.account.votingCompletedAt.toNumber();
      }
    });
  });

  fs.writeFileSync(filename, JSON.stringify(realmProposals));
  console.log("  finished", programId.toString(), realmPubKey.toString());
};

// 1. load all programIds
const programIds = fs
  .readFileSync("program_ids.txt", "utf-8")
  .split("\n")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

// 2. load all realms from deployments
const deployments_output_dir = "merged_output_deployments";
const allRealms = [];
for (const programId of programIds) {
  const filename = `${deployments_output_dir}/${programId}_realms.json`;
  if (!fs.existsSync(filename)) continue;
  const programRealms = JSON.parse(fs.readFileSync(filename, "utf-8"));
  allRealms.push(...programRealms);
}
console.log("📦 Loaded", allRealms.length, "realms in total");

// 3. filter only missing ones
const missingRealmObjects = allRealms.filter((realm) =>
  missingRealms.includes(realm.owner)
);
console.log(`🎯 Processing ${missingRealmObjects.length} missing realms`);

// 4. fetch proposals for missing realms only
for (const realm of missingRealmObjects) {
  console.log("running", realm.owner, realm.pubkey);
  await getProposalsForRealm(connection, realm.owner, realm.pubkey);
  await new Promise((resolve) => setTimeout(resolve, 60000)); // throttle
}
