import fs from 'fs';

const splGovernanceModule = await import('@solana/spl-governance');
const solanaWeb3 = await import('@solana/web3.js');
const { getRealms } = splGovernanceModule;
const { Connection, PublicKey } = solanaWeb3;

// Sleep function to add delays between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// const RPC_URL = 'http://realms-realms-c335.mainnet.rpcpool.com/258d3727-bb96-409d-abea-0b1b4c48af29/';
// const RPC_URL = 'https://api.mainnet-beta.solana.com';
const RPC_URL='https://go.getblock.us/<API-KEY>';
const connection = new Connection(RPC_URL, 'recent');

const getAllProgramProposals = async (connection, programIdString) => {
    var programId = new PublicKey(programIdString);
    // make an output directory based on the date
    const date = new Date(2025, 8, 20);
    const outputDir = `output_deployments_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
    // make the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // get all realms from getRealms, save as a json file
    var realms = await getRealms(connection, programId);
    console.log('REALMS', programId, realms.length);
    // save to json file in output directory
    fs.writeFileSync(`${outputDir}/${programId}_realms.json`, JSON.stringify(realms));
};

// read in lines from program_ids.txt, trim, and filter out empty or invalid lines
const programIds = fs.readFileSync('program_ids.txt', 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
        // skip empty lines
        if (!line) return false;
        // try to construct a PublicKey, skip if invalid
        try {
            new PublicKey(line);
            return true;
        } catch (e) {
            console.warn(`Skipping invalid program id: "${line}"`);
            return false;
        }
    });
console.log('got', programIds.length, 'valid program ids');

// run each with a delay between requests
for (var i = 0; i < programIds.length; i++) {
    const date = new Date(2025, 8, 20);
    const outputDir = `output_deployments_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
    const outputFile = `${outputDir}/${programIds[i]}_realms.json`;
    if (fs.existsSync(outputFile)) {
        console.log('Skipping', programIds[i], 'output already exists');
        continue;
    }
    console.log('running', programIds[i], i)
    try {
        await getAllProgramProposals(connection, programIds[i]);
        // Wait 20 seconds between requests to avoid rate limiting
        if (i < programIds.length - 1) {
            console.log('Waiting 20 seconds before next request...');
            await sleep(20000);
        }
    } catch (error) {
        console.error(`Error processing ${programIds[i]}:`, error.message);
        // Continue with next program ID even if one fails
        if (i < programIds.length - 1) {
            console.log('Waiting 60 seconds before next request...');
            await sleep(60000);
        }
    }
}
