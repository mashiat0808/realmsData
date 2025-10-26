const splGovernanceModule = await import('@solana/spl-governance');
import fs from 'fs';
const { getAllProposals } = splGovernanceModule;

const solanaWeb3 = await import('@solana/web3.js');
const { Connection, PublicKey } = solanaWeb3;

// const RPC_URL = 'http://realms-realms-c335.mainnet.rpcpool.com/258d3727-bb96-409d-abea-0b1b4c48af29/';
const RPC_URL = 'https://solana-rpc.publicnode.com';
const connection = new Connection(RPC_URL, 'recent');

// make an output directory based on the date
const date = new Date(2025, 9, 20); // July is month 6 (0-based)
const outputDir = `output_proposals_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
// make the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const getProposalsForRealm = async (
    connection,
    programIdAsString,
    realmPublicKeyAsString
) => {
    var programId = new PublicKey(programIdAsString);
    var realmPubKey = new PublicKey(realmPublicKeyAsString);

    var filename = `${outputDir}/${programId}_${realmPubKey}_proposals.json`;
    // if file already exists, skip
    if (fs.existsSync(filename)) {
        // console.log('PROPOSALS...', programId.toString(), realmPubKey.toString());
        console.log('  skipping', programId.toString(), realmPubKey.toString());
        return;
    }
    // try this 5 times with an increasing timeout before giving up
    var numTries = 0;
    var timeout = 2000; // Start with 2 seconds
    var realmProposals = null;
    let success = false;
    while (numTries < 5) {
        try {
            realmProposals = await getAllProposals(
                connection,
                programId,
                realmPubKey
            )
            success = true;
            break;
        } catch (e) {
            console.log('error', e);
            numTries += 1;
            timeout *= 2; // Exponential backoff (2s, 4s, 8s, 16s, 32s)
            await new Promise(resolve => setTimeout(resolve, timeout));
        }
    }

    if (!success) {
        // Append to failed proposals file
        const failedFile = `${outputDir}/failed_proposals.json`;
        let failedList = [];
        if (fs.existsSync(failedFile)) {
            try {
                failedList = JSON.parse(fs.readFileSync(failedFile, 'utf-8'));
            } catch {}
        }
        failedList.push({ programId: programIdAsString, realmPubKey: realmPublicKeyAsString });
        fs.writeFileSync(failedFile, JSON.stringify(failedList, null, 2));
        console.log('  FAILED', programId.toString(), realmPubKey.toString());
        return;
    }

    // set proposal.account.votingCompletedAt to a date string
    // instead of a BigNumber
    realmProposals.forEach(solanaGovernance => {
        solanaGovernance.forEach(proposal => {
            if (proposal.account.votingCompletedAt) {
                var completedAtNumber = proposal.account.votingCompletedAt.toNumber();
                proposal.account.votingCompletedAt = completedAtNumber;
            }
        });
    });

    // write to file
    fs.writeFileSync(filename, JSON.stringify(realmProposals));


    console.log('  finished', programId.toString(), realmPubKey.toString());
}


// 1. get all of the program ids from program_ids.txt
const programIds = fs.readFileSync('program_ids.txt', 'utf-8')
    .split('\n')
    .map(id => id.trim())
    .filter(id => id.length > 0);

// 2. get all of the realms for each program id from the output dir
const allRealms = [];
const deployments_output_dir = 'output_deployments_2025_9_20';
for (let i = programIds.length - 1 ; i >= 0; i--) {
    var programId = programIds[i];
    var filename = `${deployments_output_dir}/${programId}_realms.json`;
    if (!fs.existsSync(filename)) {
        console.warn('Warning: file not found', filename);
        continue;
    }
    var programRealms = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    // append to realms
    allRealms.push(...programRealms);
}
console.log('got', allRealms.length, 'realms in total');

// 3. get all of the proposals for each realm async
for (let i = allRealms.length - 1 ; i >= 0; i--) {
    var realm = allRealms[i];
    var programId = realm.owner;
    var realmPubKeyString = realm.pubkey;

    // If account field is missing, just skip (safeguard)
    if (!realm.account) {
        console.log('skipping (no account data)', programId, realmPubKeyString);
        continue;
    }
    
   

    var filename = `${outputDir}/${programId}_${realmPubKeyString}_proposals.json`;
    if (fs.existsSync(filename)) {
        console.log('skipping', programId, realmPubKeyString, 'output already exists');
        continue;
    }
    console.log('running', programId, realmPubKeyString, i);
    await getProposalsForRealm(
        connection,
        programId,
        realmPubKeyString
    );
    // Add a delay after each request (e.g., 60 seconds)
    await new Promise(resolve => setTimeout(resolve, 60000));
}
