import fs from 'fs';
const splGovernanceModule = await import('@solana/spl-governance');
const { getGovernanceAccounts, pubkeyFilter, VoteRecord } = splGovernanceModule;

const solanaWeb3 = await import('@solana/web3.js');
const { Connection, PublicKey } = solanaWeb3;

const RPC_URL = 'https://solana-rpc.publicnode.com';
const connection = new Connection(RPC_URL, 'recent');

// make an output directory based on today's date
const date = new Date(2025, 8, 22);
const outputDir = `output_votes_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// path to proposals dir (adjust date!)
const proposalsOutputDir = 'output_proposals_2025_10_20';

// collect all proposals with non-null votingCompletedAt
const allProposals = [];
const proposalFiles = fs.readdirSync(proposalsOutputDir);

for (const proposalFile of proposalFiles) {
    const proposalFilename = `${proposalsOutputDir}/${proposalFile}`;
    const proposalListOfLists = JSON.parse(fs.readFileSync(proposalFilename));

    for (const proposalList of proposalListOfLists) {
        if (Array.isArray(proposalList)) {
            for (const proposal of proposalList) {
                console.log(proposal);
                // <programId>_<realmId>_proposals.json
                const [programId, realmId] = proposalFile.split('_');
                if (programId !== proposal.owner) {
                    console.error('ERROR: programId != proposal.owner');
                    process.exit(1);
                }

                if (proposal.account.votingCompletedAt != null) {
                    allProposals.push({
                        pubkeyString: proposal.pubkey,
                        programString: proposal.owner,
                        realmIdString: realmId
                    });
                }
            }
        } else {
            console.warn('proposalList is not an array:', proposalList);
        }
    }
}
console.log('Collected proposals with completed voting:', allProposals.length);

const getVotesForProposal = async (connection, programIdAsString, proposalPubKeyAsString, realmIdAsString) => {
    const proposalPk = new PublicKey(proposalPubKeyAsString);
    const programId = new PublicKey(programIdAsString);

    const outFilename = `${outputDir}/${programId}_${realmIdAsString}_${proposalPk}_votes.json`;

    if (fs.existsSync(outFilename)) {
        console.log('  skipping', proposalPk.toString());
        return;
    }

    // delay to avoid rate limiting (e.g., 10s)
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // retry loop with exponential backoff
    let numTries = 0;
    let timeout = 2000;
    let proposalVotes = null;
    let success = false;

    while (numTries < 5) {
        try {
            proposalVotes = await getGovernanceAccounts(
                connection,
                programId,
                VoteRecord,
                [pubkeyFilter(1, proposalPk)]
            );
            success = true;
            break;
        } catch (e) {
            console.log(`Error fetching votes for ${proposalPk}:`, e.message || e);
            numTries++;
            timeout *= 2;
            console.log(`Retry ${numTries} in ${timeout/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, timeout));
        }
    }

    if (!success) {
        // append to failed_votes.json
        const failedFile = `${outputDir}/failed_votes.json`;
        let failedList = [];
        if (fs.existsSync(failedFile)) {
            try {
                failedList = JSON.parse(fs.readFileSync(failedFile, 'utf-8'));
            } catch {}
        }
        failedList.push({ programId: programIdAsString, proposalPk: proposalPubKeyAsString, realmId: realmIdAsString });
        fs.writeFileSync(failedFile, JSON.stringify(failedList, null, 2));
        console.log('  FAILED', programId.toString(), proposalPk.toString());
        return;
    }

    // normalize BN fields
    proposalVotes.forEach(vote => {
        if (vote.account.voterWeight) {
            vote.account.voterWeight = vote.account.voterWeight.toString();
        } else if (vote.account.voteWeight) {
            Object.keys(vote.account.voteWeight).forEach(key => {
                if (vote.account.voteWeight[key]) {
                    vote.account.voteWeight[key] = vote.account.voteWeight[key].toString();
                }
            });
        } else {
            console.warn('No voterWeight or voteWeight found:', vote);
        }
    });

    fs.writeFileSync(outFilename, JSON.stringify(proposalVotes, null, 2));
    console.log('  finished', proposalVotes.length, 'votes for proposal', proposalPk.toString());
};

// fetch votes sequentially with delay
for (let i = 0; i < allProposals.length; i++) {
    const proposal = allProposals[i];
    console.log(`Fetching votes for proposal ${i+1}/${allProposals.length}:`, proposal.pubkeyString);

    await getVotesForProposal(
        connection,
        proposal.programString,
        proposal.pubkeyString,
        proposal.realmIdString,
    );
}
