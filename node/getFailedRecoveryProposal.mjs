import fs from 'fs';
const splGovernanceModule = await import('@solana/spl-governance');
const { getAllProposals } = splGovernanceModule;
const solanaWeb3 = await import('@solana/web3.js');
const { Connection, PublicKey } = solanaWeb3;

const RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'recent');

// Set the output directory and failed proposals file
const date = new Date(2025, 6, 27); // July is month 6 (0-based)
const outputDir = `output_proposals_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
const failedFile = `${outputDir}/failed_proposals.json`;

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
    if (fs.existsSync(filename)) {
        console.log('  skipping', programId.toString(), realmPubKey.toString());
        return;
    }
    var numTries = 0;
    var timeout = 2000;
    var realmProposals = null;
    let success = false;
    while (numTries < 5) {
        try {
            realmProposals = await getAllProposals(
                connection,
                programId,
                realmPubKey
            );
            success = true;
            break;
        } catch (e) {
            console.log('error', e);
            numTries += 1;
            timeout *= 2;
            await new Promise(resolve => setTimeout(resolve, timeout));
        }
    }
    if (!success) {
        // Append to failed proposals file
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
    // set proposal.account.votingCompletedAt to a date string instead of a BigNumber
    realmProposals.forEach(solanaGovernance => {
        solanaGovernance.forEach(proposal => {
            if (proposal.account.votingCompletedAt) {
                var completedAtNumber = proposal.account.votingCompletedAt.toNumber();
                proposal.account.votingCompletedAt = completedAtNumber;
            }
        });
    });
    fs.writeFileSync(filename, JSON.stringify(realmProposals));
    console.log('  finished', programId.toString(), realmPubKey.toString());
};

// Read failed proposals
if (!fs.existsSync(failedFile)) {
    console.error('No failed proposals file found:', failedFile);
    process.exit(1);
}
const failedProposals = JSON.parse(fs.readFileSync(failedFile, 'utf-8'));
console.log('Retrying', failedProposals.length, 'failed proposals');

for (let i = 0; i < failedProposals.length; i++) {
    const { programId, realmPubKey } = failedProposals[i];
    const filename = `${outputDir}/${programId}_${realmPubKey}_proposals.json`;
    if (fs.existsSync(filename)) {
        console.log('skipping', programId, realmPubKey, 'output already exists');
        continue;
    }
    console.log('running', programId, realmPubKey, i);
    await getProposalsForRealm(
        connection,
        programId,
        realmPubKey
    );
    // Add a delay after each request (e.g., 60 seconds)
    await new Promise(resolve => setTimeout(resolve, 60000));
}
