# KIK TOKEN - TECHNICAL SPECIFICATION

**Version:** 1.0
**Date:** 2025-12-07
**Status:** ✅ Approved for Development

---

## 🎯 EXECUTIVE SUMMARY

**KIK Token** is a privacy-focused cryptocurrency built on Polygon blockchain with a unique anonymous pool system and burn & mint mechanics.

### Key Features:
- ✅ **Hybrid Transparency**: Public wallets + Anonymous pool
- ✅ **Burn & Mint Mechanics**: Tokens are burned and minted during rewriting
- ✅ **Time-Limited Commitments**: Expire after 13-15 weeks
- ✅ **ZK-Proofs**: Full anonymity in pool
- ✅ **Mobile-First**: Optimized for mobile devices
- ✅ **Public Auditability**: Transparent supply while maintaining privacy

---

## 📊 CORE PARAMETERS

```solidity
// Token
Name: "KIK Token"
Symbol: "KIK"
Decimals: 18
Initial Supply: 10,000,000,000 KIK (10 billion)
Max Supply: Infinite (burn & mint)
Circulating at any moment: ≤ 10 billion

// Network
Blockchain: Polygon (EVM-compatible)
Testnet: Polygon Amoy (Chain ID: 80002)
Mainnet: Polygon (Chain ID: 137)

// Pool Parameters
Soft Expiry: 13 weeks (91 days)
Grace Period: 2 weeks (14 days)
Hard Expiry: 15 weeks (105 days)
Merkle Tree Depth: 21 (2,097,152 commitments)
```

---

## 💰 ECONOMIC MODEL

### 1. Dynamic Fees

```javascript
Base Rate: 1.5%

Modifiers:
+ Network congestion (gas >150% avg): +0.5%
+ Large amount (>100k KIK): +0.3%
+ Pool overflow (>80% full): +0.5%
+ Pool operation (vs regular transfer): +0.5%
- Low activity (<100 tx/24h): -0.3%
- Small amount (<100 KIK): -0.2%
- Pool nearly empty (<20%): -0.3%

Limits: 0.5% (min) - 5% (max)
```

### 2. Fee Distribution

#### **KIK Token Fees:**
```
Total Fee (e.g., 2%):
├─ 50% (1%) → Creator
│  ├─ 70% accumulated (withdrawable)
│  └─ 30% to pool liquidity
└─ 50% (1%) → Miners/Validators (priority fee)
```

#### **MATIC Network Fees:**
```
Dynamic (depends on gas price):
Base fee = current_gas_price × estimated_gas × 1.5

Min: 0.0001 MATIC
Max: 0.01 MATIC

Distribution:
├─ 70% → Creator (accumulated)
└─ 30% → Pool liquidity
```

### 3. Pool Liquidity Usage (30%)

```solidity
Burn Rewards:
- 0.0001 MATIC per burned commitment
- Paid from pool liquidity

Staking (future):
- Stake KIK → earn % from liquidity
```

---

## 🔐 CRYPTOGRAPHY & SECURITY

### 1. Message Encryption

**Scheme**: X25519 (ECDH) + ChaCha20-Poly1305

```javascript
// Key derivation
const keyPair = nacl.box.keyPair(); // X25519
const encryptionPublicKey = keyPair.publicKey;
const encryptionPrivateKey = keyPair.secretKey;

// Encryption
const nonce = nacl.randomBytes(24);
const encrypted = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderPrivateKey
);

// Format: [version 1B][algorithm 1B][nonce 24B][encrypted][poly1305 tag 16B]
// Total size: ~120-150 bytes
```

**Why X25519 + ChaCha20:**
- ✅ 3-4x faster than AES on mobile (ARM)
- ✅ Smaller size (120 vs 209 bytes)
- ✅ Protection against timing attacks
- ✅ Modern standard (Signal, WhatsApp, TLS 1.3)

### 2. ZK-Proofs (Groth16)

**What is proven:**
```circom
// Circuit for rewriting proof
inputs:
  PUBLIC:
    - merkleRoot (current pool root)
    - oldCommitment (hash to be burned)
    - newCommitment (hash to be created)

  PRIVATE:
    - oldSecret, oldNullifier
    - newSecret, newNullifier
    - amount
    - merkleProof[21] (path in tree)

proof:
  1. oldCommitment = hash(oldSecret, oldNullifier, amount) ✓
  2. oldCommitment is in Merkle Tree ✓
  3. newCommitment = hash(newSecret, newNullifier, amount) ✓
```

**Parameters:**
- System: Groth16
- Proof size: ~200 bytes
- Gas cost: ~150k gas
- Generation time: 1-2 seconds (mobile)

### 3. Merkle Tree

```solidity
Depth: 21 levels
Max entries: 2^21 = 2,097,152
Proof size: 21 × 32 = 672 bytes
Gas cost: ~5,250 gas

Hash function: Poseidon (ZK-friendly)

Multi-tree strategy:
- Tree ID 0: first 2M commitments
- Tree ID 1: next 2M (when full)
- ... and so on
```

---

## 🏊 POOL SYSTEM

### 1. Pool Entry Structure

```solidity
struct PoolEntry {
    bytes32 commitment;      // hash(secret, nullifier, amount, recipient)
    uint256 timestamp;       // when created
    uint256 amount;          // how many tokens (hidden from public)
    uint256 treeId;          // which Merkle Tree
    bool exists;             // exists or not
}

mapping(uint256 => PoolEntry) public entries;
uint256 public nextEntryId = 1;
```

### 2. Commitment Lifecycle

```
Day 0: Creation
├─ Alice sends 1000 KIK → Bob
├─ Generate commitment = hash(secret, nullifier, 1000, bobPubKey)
├─ Save to pool: Entry #123
└─ 1000 KIK burned from Alice's wallet

Day 1-90: Safe period
├─ Commitment lives in pool
├─ Bob can rewrite anytime
└─ Burn probability: 0%

Day 91-104: Grace period
├─ Burn probability grows linearly 0% → 100%
├─ Day 91: 0%
├─ Day 98: 50%
└─ Day 104: 99%

Day 105+: Hard expiry
├─ Burn probability: 100%
└─ Will burn on first check

Rewriting (anytime):
├─ Old commitment burns
├─ 1000 KIK destroyed
├─ New commitment created
├─ 1000 KIK minted again
└─ Timestamp reset → another 105 days of life
```

### 3. Burning (Random Weighted)

```solidity
function burnExpiredRandom(uint256 maxAttempts) external returns (uint256) {
    uint256 seed = uint256(blockhash(block.number - 1));
    uint256 burned = 0;

    for (uint i = 0; i < maxAttempts; i++) {
        // Random entry
        uint256 randomId = ((seed + i * 7919) % nextEntryId) + 1;

        if (!entries[randomId].exists) continue;

        uint256 age = block.timestamp - entries[randomId].timestamp;

        if (age >= 15 weeks) {
            // Hard expiry → 100% burn
            burnEntry(randomId);
            burned++;
        } else if (age >= 13 weeks) {
            // Grace period → probabilistic
            uint256 gracePeriodAge = age - 13 weeks;
            uint256 probability = (gracePeriodAge * 100) / 2 weeks;
            uint256 roll = uint256(keccak256(...)) % 100;

            if (roll < probability) {
                burnEntry(randomId);
                burned++;
            }
        }
    }

    // Bounty reward
    if (burned > 0 && msg.sender != owner) {
        payable(msg.sender).transfer(burned * 0.0001 ether);
    }

    return burned;
}
```

**Burn Triggers:**
- Public bounty hunters (get rewards)
- Keeper bot (yours, no reward)
- Automatically during other operations (optional)

### 4. Burned Tracking

```solidity
// Merkle Tree of burned commitments
bytes32 public burnedMerkleRoot;
bytes32[] public burnedCommitments;

event CommitmentBurned(
    bytes32 indexed commitment,
    uint256 indexed burnTime,
    uint256 age,
    bool wasExpired
);

// Proof that commitment was burned
function wasBurned(
    bytes32 commitment,
    bytes32[] calldata merkleProof
) external view returns (bool) {
    return verifyMerkleProof(commitment, merkleProof, burnedMerkleRoot);
}
```

---

## 🔍 TRANSPARENCY & AUDITABILITY

### **PUBLIC Information (visible to everyone):**

```solidity
// ✅ PUBLIC metrics

1. Total supply at any moment
   totalSupply() → 9,500,000,000 KIK

2. Pool contract balance
   balanceOf(poolContract) → 500,000,000 KIK

3. Number of active commitments in pool
   totalActiveCommitments → 156,234

4. Burn/mint event history
   event TokensBurned(amount)
   event TokensMinted(amount)

5. Burned merkle root
   burnedMerkleRoot → 0xABCD...

6. Proof of solvency
   verifyPoolSolvency() → true ✅
```

### **PRIVATE Information (only owner knows):**

```solidity
// ❌ PRIVATE information

1. Which commitment belongs to whom
   commitment 0xABCD... → ??? (unknown)

2. How many tokens in specific commitment
   commitment 0xABCD... → ??? KIK (unknown)

3. Who is sender/recipient
   commitment created by whom? → ??? (unknown)

4. Rewriting history
   commitment_old → commitment_new → link unknown
```

### Public Dashboard Metrics:

```jsx
// https://kiktoken.com/transparency

<MetricsGrid>
    <Metric
        title="Total Supply"
        value="9,500,000,000 KIK"
        change="-0.5% (24h)"
    />
    <Metric
        title="Pool Balance"
        value="500,000,000 KIK"
        subtitle="5.26% of supply"
    />
    <Metric
        title="Active Commitments"
        value="156,234"
    />
    <Metric
        title="Burned (24h)"
        value="1,234,567 KIK"
    />
</MetricsGrid>
```

---

## 🔄 OPERATIONS

### 1. Deposit to Pool

```javascript
// OFF-CHAIN (browser)
const secret = randomBytes(32);
const nullifier = randomBytes(32);
const commitment = poseidon([secret, nullifier, amount, recipientPubKey]);

const encryptedMessage = encrypt(recipientPubKey, {
    secret,
    nullifier,
    amount
});

// ON-CHAIN
await contract.depositToPool(
    commitment,
    encryptedMessage,
    amount,
    { value: maticFee }
);

// Result:
// - amount KIK burned from wallet
// - commitment added to pool
// - amount KIK minted to pool reserve
```

### 2. Rewrite Proof

```javascript
// OFF-CHAIN
const newSecret = randomBytes(32);
const newNullifier = randomBytes(32);
const newCommitment = poseidon([newSecret, newNullifier, amount, myPubKey]);

const zkProof = await generateProof({
    merkleRoot,
    oldCommitment,
    newCommitment,
    oldSecret,
    oldNullifier,
    newSecret,
    newNullifier,
    amount,
    merkleProof: getMerkleProof(oldCommitment)
});

// ON-CHAIN (via relayer for anonymity)
await relayer.submitProof(zkProof, newCommitment);

// Result:
// - oldCommitment burned
// - amount KIK destroyed
// - newCommitment created
// - amount KIK minted again
```

### 3. Withdraw from Pool

```javascript
// OFF-CHAIN
const withdrawProof = await generateWithdrawProof({
    merkleRoot,
    nullifierHash: poseidon([nullifier]),
    recipient: myAddress,
    withdrawAmount,
    secret,
    nullifier,
    totalAmount,
    merkleProof
});

// ON-CHAIN
await contract.withdrawFromPool(
    withdrawProof,
    myAddress,
    withdrawAmount
);

// Result:
// - withdrawAmount KIK transferred to wallet
// - Remainder created as new commitment (optional)
// - nullifier marked as used (double-spend protection)
```

---

## 🌐 RELAYER (Anonymity)

### Problem:
When Bob calls `rewriteProof()`, his address is visible on-chain → can be linked to commitment

### Solution: Relayer

```
Bob → [signed proof] → Relayer → [rewriteProof tx] → Blockchain
     (off-chain)      (server)                        (Relayer address visible)
```

```solidity
function rewriteProofViaRelayer(
    bytes calldata zkProof,
    bytes32 newCommitment,
    bytes calldata signature  // Bob's signature
) external {
    // Verify signature
    address signer = recoverSigner(
        keccak256(abi.encode(zkProof, newCommitment)),
        signature
    );

    require(!blacklisted[signer], "Blacklisted");

    // Normal logic
    require(verifyProof(zkProof, ...));
    // ...
}
```

**Economics:**
- User pays 0.0001 MATIC fee (payable)
- Relayer receives fee for service
- Or: decentralized relayer network

---

## 📱 WALLET APPLICATION

### Tech Stack:
```
Frontend: Next.js 14 (App Router)
Styling: Tailwind CSS
Blockchain: ethers.js v6
ZK: snarkjs + circom
Encryption: tweetnacl (X25519 + ChaCha20)
State: React hooks
Wallet: MetaMask SDK
```

### Key Features:

**1. Dashboard**
```
- Wallet balance (public)
- Pool balance (private for user, but total is public)
- List of active commitments with timers
- Expiration warnings
```

**2. Pool Operations**
```
- Send to pool
- Rewrite commitment
- Withdraw from pool
- View history (encrypted)
```

**3. Warnings**
```jsx
{commitments.map(c => {
    const daysLeft = 105 - c.ageDays;

    if (daysLeft <= 0) {
        return <Alert severity="error">
            🔥 CRITICAL! Will burn any moment! Rewrite URGENTLY!
        </Alert>
    } else if (daysLeft <= 14) {
        return <Alert severity="warning">
            ⚠️ {daysLeft} days left. Burn probability: {c.burnProb}%
        </Alert>
    } else if (daysLeft <= 30) {
        return <Alert severity="info">
            ℹ️ Recommend rewriting in {daysLeft - 14} days
        </Alert>
    }
})}
```

---

## 🚀 DEVELOPMENT ROADMAP

### Phase 1: MVP (2-3 months)
```
✅ Smart contracts:
   - Basic ERC-20 token
   - Pool system (without ZK)
   - Dynamic fees
   - Random burning

✅ Frontend:
   - Wallet connection
   - Basic transfers
   - Pool deposit/withdraw (simplified)

✅ Testnet deploy (Polygon Amoy)
```

### Phase 2: ZK Integration (2-3 months)
```
✅ ZK-proofs:
   - Circom circuits
   - Groth16 setup
   - Merkle Tree integration

✅ Encryption:
   - X25519 + ChaCha20
   - Key management

✅ Relayer:
   - Backend server
   - Anonymous transactions
```

### Phase 3: Mainnet (1-2 months)
```
✅ Security audit
✅ Gas optimization
✅ Mainnet deploy (Polygon)
✅ Liquidity mining
✅ CEX listings
```

### Phase 4: Expansion (ongoing)
```
✅ Multi-chain (Ethereum, BSC, Arbitrum)
✅ Mobile apps (iOS/Android)
✅ Governance (DAO)
✅ Quantum-resistant upgrade (Kyber)
```

---

## 📊 GAS ANALYSIS

```
Operation                    Gas Cost    @ 30 gwei MATIC
────────────────────────────────────────────────────────
Transfer (wallet→wallet)    ~65k        ~$0.0016
Deposit to pool             ~200k       ~$0.0048
Rewrite proof               ~225k       ~$0.0054
Withdraw from pool          ~180k       ~$0.0043
Burn expired (1 entry)      ~30k        ~$0.0007
Burn expired (batch 10)     ~250k       ~$0.0060
```

---

## 🎯 TARGET AUDIENCE

**Primary:**
- Monero users (migration to EVM)
- Privacy-focused crypto enthusiasts
- DeFi users (anonymous swaps)

**Secondary:**
- Traders (anonymous OTC deals)
- Citizens of countries with capital controls
- Business (confidential payments)

---

## ⚖️ LEGAL CONSIDERATIONS

**Compliance:**
- ✅ Public wallets comply with AML/KYC (if needed)
- ⚠️ Pool operations are anonymous (may be issue in some jurisdictions)
- ✅ Technical ability to freeze/blacklist (governance)

**Recommendations:**
- Geo-blocking for sanctioned countries
- KYC for CEX listings
- Transparent communication with regulators

---

## 📋 APPROVED SPECIFICATIONS SUMMARY

| Component | Solution |
|-----------|---------|
| **Blockchain** | Polygon (Amoy testnet → Mainnet) |
| **Supply** | 10B initial, infinite theoretical |
| **Fees** | Dynamic 0.5%-5% |
| **Encryption** | X25519 + ChaCha20-Poly1305 |
| **ZK-Proofs** | Groth16 |
| **Merkle Tree** | Depth 21 (2M entries) |
| **Expiry** | 13 weeks soft, 15 weeks hard |
| **Burning** | Random Weighted with grace period |
| **Relayer** | Yes, for anonymity |
| **Burned tracking** | Merkle Root |
| **Transparency** | Public supply, private ownership |

---

## ✅ READY FOR DEVELOPMENT

This specification has been fully discussed and approved.

**Date:** 2025-12-07
**Status:** 🚀 Ready to build

---

*Generated with Claude Code*
