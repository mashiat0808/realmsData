# 🧩 Realms Data Retrieval (Solana DAO Governance)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-blue.svg)
![Status](https://img.shields.io/badge/Status-Active-lightgreen.svg)

---

## 📘 Overview

This repository provides scripts and utilities to **retrieve governance data from Realms (Solana)** — one of the major DAO platforms in the decentralized governance ecosystem.  
It is part of the **DAO Governance Census 2025** project, which integrates data from six DAO platforms — *Aragon, DAOstack, DAOhaus, Snapshot, Tally, and Realms* — into a unified research dataset.

The repository enables the collection of **deployment**, **proposal**, and **vote** data from Realms using RPC endpoints.

---

## ⚙️ Features

- Retrieve **DAO deployments**, **proposals**, and **votes** from the Realms protocol on Solana  
- Uses the **DRPC endpoint** for reliable RPC access  
- Generates JSON datasets ready for downstream analysis  
- Modular design — each script can be executed independently  

---

## 🧩 Prerequisites

- **Node.js v18+**
- **npm** or **yarn**
- A **DRPC API key** (free keys available at [https://drpc.org](https://drpc.org))

---

## 📦 Installation

Clone this repository and install dependencies:

```
git clone https://github.com/mashiat0808/realmsData.git
cd realmsData/node
npm install
```

🚀 Usage
The data retrieval process happens in three sequential steps.
Each script outputs structured JSON files in the /data directory.

1️⃣ Retrieve DAO Deployments
Fetch all Realms deployments from Solana:

```
node deployments.js

```
Output:

deployments.json — metadata for ~4,200 DAOs (Realms)

Includes fields like pubkey, name, communityMint, and governance configuration.

2️⃣ Retrieve Proposals
Once deployments.json is available, run:
```
node proposals.js
```

Output:

proposals.json — ~25,000 proposals linked to governance accounts

Includes state, thresholds, and vote counts.

3️⃣ Retrieve Votes
Finally, fetch all voting records:

```
node votes.js
```

Output:

votes.json — over 1 million individual vote records

Each record links a proposal, voter, voteType, and voterWeight.

## 🗂 Example Data Structure
**Deployment Example**

```
{
  "pubkey": "4BNkheiMATVVcyJnGpjPbbPvFuKMx3C...",
  "account": {
    "name": "Phantasia",
    "communityMint": "FANTafPFBAt93BNJVpdu25pGPmca3RfwdsDsRrT3LX1r",
    "votingProposalCount": 1
  }
}
```


**Proposal Example**

```
{
  "pubkey": "2PhgWqv97kAs9YgCUC5wE7kxj9CmVcqG9eirizFPXP2Z",
  "account": {
    "state": 5,
    "name": "Upgrade Program Borsh",
    "yesVotesCount": "45d964b800",
    "noVotesCount": "00"
  }
}
```

**Vote Example**

```
{
  "pubkey": "7d1uoxa5DSQy2v9k1VxeETvbc89xJVSdByWTBNUfqvQp",
  "account": {
    "proposal": "2MsSy3mn7Creg5M75UR3oQJ4vKqHtAkGbLAm4GYiTwtM",
    "governingTokenOwner": "AEL8CwbYfiAhkqui1NF2bbv5DX9mgSNGcxenpTdpsyY4",
    "vote": {
      "voteType": 0,
      "approveChoices": [{"rank": 0, "weightPercentage": 100}]
    }
  }
}
```


### 🔧 Configuration
Before running the scripts, create a .env file in the node directory and add your DRPC endpoint:

```
RPC_URL=https://lb.drpc.live/solana/<YOUR_API_KEY>
```
You can modify batch sizes and output paths inside each .js file if needed.

### 🧠 Notes
Run order matters: Always execute in this sequence →
deployments.js → proposals.js → votes.js

Data volume: The resulting JSON files can be very large (multiple GBs)

Free-tier limits: DRPC may throttle requests; retry mechanisms are built-in

For analysis: Process the generated data using the RealmsData.ipynb notebook

### 🔗 Integration
The generated data is used in the DAO Governance Census project to:

Clean and normalize data

Integrate with five other DAO platforms

Produce the unified datasets:
deployment.csv, proposals.csv, and votes.csv

For the analysis and unified schema, visit:
➡️ [DAO Governance Census 2025 Repository](https://github.com/mashiat0808/DAOGovernance/)


### 🙌 Acknowledgments
This project is part of the DAO Governance Census 2025, conducted under the supervision of:
Prof. Samer Hassan (Harvard University / UCM) and Prof. Javier Arroyo (UAH).

### 🧭 Workflow Summary
deployments.js  →  proposals.js  →  votes.js  →  RealmsData.ipynb  →  Unified Census Dataset

