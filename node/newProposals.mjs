const splGovernanceModule = await import('@solana/spl-governance');
import fs from 'fs';
const { getAllProposals } = splGovernanceModule;

const solanaWeb3 = await import('@solana/web3.js');
const { Connection, PublicKey } = solanaWeb3;

const RPC_URL = 'https://lb.drpc.org/solana/AnB81nqFRk-OvTFykc2CC9gEj9iXiPoR8IlRqhnKxixj';
const connection = new Connection(RPC_URL, 'recent');

const FAILED_FILE = "failed_realms.json";

// make an output directory based on the date
const date = new Date(2025, 7, 27);
const outputDir = `output_proposals_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
// make the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// helper: append failed realm to file
function recordFailedRealm(programId, realmPubKey) {
    let failed = [];
    if (fs.existsSync(FAILED_FILE)) {
        try {
            failed = JSON.parse(fs.readFileSync(FAILED_FILE, "utf-8"));
        } catch (e) {
            console.error("⚠️ Could not parse failed_realms.json, overwriting.");
            failed = [];
        }
    }
    failed.push({ programId: programId.toString(), realmPubKey: realmPubKey.toString() });
    fs.writeFileSync(FAILED_FILE, JSON.stringify(failed, null, 2));
}

const getProposalsForRealm = async (
    connection,
    programIdAsString,
    realmPublicKeyAsString
) => {
    const programId = new PublicKey(programIdAsString);
    const realmPubKey = new PublicKey(realmPublicKeyAsString);

    const filename = `${outputDir}/${programId}_${realmPubKey}_proposals.json`;
    if (fs.existsSync(filename)) {
        console.log('  skipping', programId.toString(), realmPubKey.toString());
        return;
    }

    // Increase delay to 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Increase delay to 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Increase delay to 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    let realmProposals = null;
    let numTries = 0;
    const maxRetries = 10;

    while (numTries < maxRetries) {
        try {
            realmProposals = await getAllProposals(connection, programId, realmPubKey);
            console.log(realmProposals);
            break; // success
        } catch (e) {
            numTries++;
            const baseDelay = Math.pow(2, numTries) * 500;
            const jitter = Math.floor(Math.random() * 500);
            const delay = baseDelay + jitter;

            console.log(
                `error fetching proposals (try ${numTries}/${maxRetries})`,
                e.message || e,
                `→ retrying after ${delay}ms`
            );

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    if (!realmProposals) {
        console.log('❌ failed to fetch proposals for', programId.toString(), realmPubKey.toString());
        recordFailedRealm(programId, realmPubKey); // 🔥 record failure
        return;
    }

    // convert BigNumber to number
    realmProposals.forEach(solanaGovernance => {
        solanaGovernance.forEach(proposal => {
            if (proposal.account.votingCompletedAt) {
                proposal.account.votingCompletedAt = proposal.account.votingCompletedAt.toNumber();
            }
        });
    });

    fs.writeFileSync(filename, JSON.stringify(realmProposals, null, 2));
    console.log('✅ finished', programId.toString(), realmPubKey.toString());
};


// 1. get all of the program ids from program_ids.txt
const programIds = fs.readFileSync('program_ids.txt', 'utf-8')
    .split('\n')
    .map(id => id.trim())
    .filter(id => id.length > 0);

// 2. get all of the realms for each program id from the output dir
const allRealms = [];
const deployments_output_dir = 'output_deployments_2025_7_22';
for (let i = 0; i < programIds.length; i++) {
    var programId = programIds[i];
    var filename = `${deployments_output_dir}/${programId}_realms.json`;
    var programRealms = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    // append to realms
    allRealms.push(...programRealms);
}
console.log('got', allRealms.length, 'realms in total');

// 3. get all of the proposals for each realm async
for (let i = 0; i < allRealms.length; i++) {
    var realm = allRealms[i];
    var programId = realm.owner;
    var realmPubKeyString = realm.pubkey;
    console.log('running', programId, realmPubKeyString, i);
    try {
        await getProposalsForRealm(
            connection,
            programId,
            realmPubKeyString
        );
    } catch (e) {
        console.log('Failed for realm', realmPubKeyString, 'Error:', e);
    }
    // Increase delay to 2 seconds
    // await new Promise(resolve => setTimeout(resolve, 2000));
}