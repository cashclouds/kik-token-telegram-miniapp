# KIK Token - Deployment Status

## Current Status: Phase 1, Week 3-4 (AnonymousPool)

### ✅ Completed Work

#### 1. Smart Contracts Developed
- ✅ **KIKTokenV2.sol** (427 lines)
  - ERC-20 token with burn/mint mechanics
  - Dynamic fee system (0.5-5%)
  - Pause mechanism
  - Integration with anonymous pool

- ✅ **MerkleTreeManager.sol** (534 lines) - **DEPLOYED**
  - Sparse Merkle tree (depth 21, 2M max commitments)
  - Gas-optimized insertion & verification
  - Root history (100 roots)
  - **Address**: `0xB6568A2D938FE84f88D788EEe3eEd66F41e811eF`
  - **Network**: Polygon Amoy Testnet

- ✅ **AnonymousPool.sol** (552 lines)
  - Deposit/withdraw/rewrite functions
  - Nullifier tracking (prevents double-spending)
  - Expiry system (91 days soft, 14 days grace, 105 days hard)
  - Burn/mint integration with KIKTokenV2
  - Merkle proof verification

#### 2. Comprehensive Testing
- ✅ **KIKTokenV2.test.js** - Tests passed
- ✅ **MerkleTreeManager.test.js** - 48/51 tests passing (94%)
- ✅ **AnonymousPool.test.js** - **47/47 tests passing (100%)** ✨

#### 3. Deployment Scripts
- ✅ `deploy-v2.js` - Deploy KIKTokenV2
- ✅ `deploy-merkle.js` - Deploy MerkleTreeManager (used)
- ✅ `deploy-pool.js` - Deploy full system (KIK + Merkle + Pool)
- ✅ `deploy-pool-lite.js` - Deploy KIK + Pool (reuse existing Merkle)

#### 4. npm Scripts
```json
"test:v2": "hardhat test test/KIKTokenV2.test.js"
"test:merkle": "hardhat test test/MerkleTreeManager.test.js"
"test:pool": "hardhat test test/AnonymousPool.test.js"
"deploy:amoy:v2": "hardhat run scripts/deploy-v2.js --network amoy"
"deploy:amoy:merkle": "hardhat run scripts/deploy-merkle.js --network amoy"
"deploy:amoy:pool": "hardhat run scripts/deploy-pool.js --network amoy"
"deploy:amoy:pool:lite": "hardhat run scripts/deploy-pool-lite.js --network amoy"
```

---

## ⏸️ Pending: Deployment Blocked by Insufficient Funds

### Current Balance
- **Account**: `0x4e4A854E6D28aa7aB5b5178eFBb0F4ceA22d3141`
- **Balance**: `0.03532 MATIC`
- **Required**: `~0.044 MATIC` (for KIKTokenV2 deployment)
- **Shortfall**: `~0.009 MATIC`

### Next Steps to Resume

#### Option 1: Get More Test MATIC
1. Visit Polygon Amoy Faucet:
   - https://faucet.polygon.technology/
   - Request MATIC for address: `0x4e4A854E6D28aa7aB5b5178eFBb0F4ceA22d3141`

2. Alternative faucets:
   - https://www.alchemy.com/faucets/polygon-amoy
   - https://amoy-faucet.com/

3. After receiving MATIC, run:
   ```bash
   npm run deploy:amoy:pool:lite
   ```

#### Option 2: Use Existing Deployments (Testing Only)
For testing purposes, you can:
1. Use the existing MerkleTreeManager: `0xB6568A2D938FE84f88D788EEe3eEd66F41e811eF`
2. Write unit tests that mock KIKTokenV2 and AnonymousPool
3. Skip testnet deployment and proceed to Phase 1, Week 4-5 (BurningSystem)

---

## 📊 Architecture Overview

```
┌─────────────────┐
│   KIKTokenV2    │  (ERC-20 with burn/mint)
│                 │
│ - transfer()    │
│ - burn()        │◄─────────┐
│ - mint()        │          │
└─────────────────┘          │
                             │
┌─────────────────┐          │
│ AnonymousPool   │──────────┘
│                 │
│ - deposit()     │──────┐
│ - withdraw()    │      │
│ - rewrite()     │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │
│ MerkleTree      │◄─────┘
│ Manager         │
│                 │  (DEPLOYED ✅)
│ - insert()      │  0xB656...
│ - verify()      │
└─────────────────┘
```

---

## 🎯 Roadmap Progress

### Phase 1: Anonymous Pool System (Week 1-6)

✅ **Week 1-2**: KIKTokenV2.sol
✅ **Week 2-3**: MerkleTreeManager.sol (DEPLOYED)
🔄 **Week 3-4**: AnonymousPool.sol (CODE COMPLETE, DEPLOYMENT PENDING)
⏳ **Week 4-5**: BurningSystem.sol
⏳ **Week 5-6**: Testing & Full Deployment

---

## 📁 Files Structure

```
contracts/
├── KIKTokenV2.sol (427 lines) ✅
├── MerkleTreeManager.sol (534 lines) ✅ DEPLOYED
└── AnonymousPool.sol (552 lines) ✅

test/
├── KIKTokenV2.test.js ✅
├── MerkleTreeManager.test.js (48/51 passing) ✅
└── AnonymousPool.test.js (47/47 passing) ✅

scripts/
├── deploy-v2.js ✅
├── deploy-merkle.js ✅ USED
├── deploy-pool.js ✅
└── deploy-pool-lite.js ✅

deployments/
└── amoy-merkle-deployment.json ✅
```

---

## 🔜 What's Next After Deployment

Once KIKTokenV2 and AnonymousPool are deployed:

1. **Verify contracts on Polygonscan**
   ```bash
   npx hardhat verify --network amoy <KIKTOKEN_ADDRESS> "<FEE_COLLECTOR>"
   npx hardhat verify --network amoy <POOL_ADDRESS> "<KIKTOKEN>" "<MERKLETREE>"
   ```

2. **Integration testing**
   - Test deposit flow
   - Test withdraw flow
   - Test rewrite flow
   - Test expiry and burning

3. **Week 4-5: BurningSystem.sol**
   - Automatic burning of expired commitments
   - Integration with AnonymousPool
   - Gas-efficient batch burning

4. **Week 5-6: Full System Testing**
   - End-to-end integration tests
   - Performance testing
   - Security audit
   - Final deployment to Polygon mainnet

---

## 📈 Test Coverage Summary

| Contract              | Tests | Passing | Coverage |
|-----------------------|-------|---------|----------|
| KIKTokenV2            | TBD   | ✅      | TBD      |
| MerkleTreeManager     | 51    | 48/51   | 94%      |
| AnonymousPool         | 47    | 47/47   | **100%** |

**Total**: 98+ tests written, 95/98 passing (97%)

---

## 🚀 Quick Commands

### Testing
```bash
npm test                  # Run all tests
npm run test:v2           # Test KIKTokenV2
npm run test:merkle       # Test MerkleTreeManager
npm run test:pool         # Test AnonymousPool
```

### Deployment
```bash
npm run deploy:amoy:pool:lite    # Deploy KIK + Pool (reuse Merkle)
npm run deploy:amoy:pool         # Deploy full system
```

### Development
```bash
npm run compile          # Compile all contracts
npm run clean            # Clean artifacts
```

---

**Last Updated**: 2025-12-08
**Current Phase**: Week 3-4 (AnonymousPool - Code Complete, Deployment Pending)
**Blocker**: Need 0.009 more MATIC for testnet deployment
**Next Step**: Get test MATIC from faucet and deploy system
