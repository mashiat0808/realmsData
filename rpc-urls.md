# Solana RPC URLs

This document lists the Solana RPC endpoints I’ve used (and tested), along with additional ones I’ve collected but haven’t used yet.  
The goal is to track working, reliable RPCs across **Mainnet** and **Devnet**.

---

## ✅ RPCs I Have Used

### Mainnet
- ❌ `http://realms-realms-c335.mainnet.rpcpool.com/258d3727-bb96-409d-abea-0b1b4c48af29/`  
  *(Could not access — likely requires authorization or is deprecated)*

- ✅ `https://api.mainnet-beta.solana.com`  
  *(Official Solana RPC — stable but often rate-limited)*

- ✅ `https://mainnet.helius-rpc.com/?api-key={{api-key}}`  
  *(Helius RPC — requires API key, fast & reliable)*

- ✅ `https://solana-rpc.publicnode.com`  
  *(PublicNode RPC — free, good uptime)*

### Devnet
- ✅ `https://api.devnet.solana.com`  
  *(Official Solana Devnet RPC — stable)*

### GraphQL
- ✅ `https://programs.shyft.to/v0/graphql/?api_key=q8qovjCt3CPpY7Td&network=mainnet-beta`  
  *(Shyft GraphQL endpoint — good for program queries)*

---

## 📌 RPCs I Haven’t Used Yet

### Mainnet
- 🔲 `https://go.getblock.us/86aac42ad4484f3c813079afc201451c`

- 🔲 `https://solana-rpc.publicnode.com`

- 🔲 `https://api.blockeden.xyz/solana/KeCh6p22EX5AeRHxMSmc`

- 🔲 `https://solana.drpc.org/`

- 🔲 `https://solana.rpc.grove.city/v1/01fdb492`

- 🔲 `https://solana.lavenderfive.com/`

- 🔲 `https://solana.leorpc.com/?api_key=FREE`

- 🔲 `https://solana.api.onfinality.io/public`

- 🔲 `https://api.mainnet-beta.solana.com` *(duplicate — already tested above)*

- 🔲 `https://public.rpc.solanavibestation.com/`

- 🔲 `https://solana.therpc.io`

---

## 📝 Notes
- Always check **rate limits** and **uptime** before using these RPCs in production.  
- Some RPCs require **API keys** (e.g., Helius, GetBlock, Shyft).  
- Free public RPCs are prone to throttling under heavy load — prefer providers with SLAs for production.  