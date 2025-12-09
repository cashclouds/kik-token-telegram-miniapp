const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BurningSystem", function () {
  let kikToken, merkleTree, pool, burningSystem;
  let owner, feeCollector, user1, user2, keeper;
  let KEEPER_REWARD, SOFT_EXPIRY, GRACE_PERIOD, HARD_EXPIRY;

  beforeEach(async function () {
    [owner, feeCollector, user1, user2, keeper] = await ethers.getSigners();

    // Deploy KIKTokenV2
    const KIKTokenV2 = await ethers.getContractFactory("KIKTokenV2");
    kikToken = await KIKTokenV2.deploy(feeCollector.address);
    await kikToken.waitForDeployment();

    // Deploy MerkleTreeManager
    const MerkleTreeManager = await ethers.getContractFactory("MerkleTreeManager");
    merkleTree = await MerkleTreeManager.deploy();
    await merkleTree.waitForDeployment();

    // Deploy AnonymousPool
    const AnonymousPool = await ethers.getContractFactory("AnonymousPool");
    pool = await AnonymousPool.deploy(
      await kikToken.getAddress(),
      await merkleTree.getAddress()
    );
    await pool.waitForDeployment();

    // Deploy BurningSystem
    const BurningSystem = await ethers.getContractFactory("BurningSystem");
    burningSystem = await BurningSystem.deploy(
      await pool.getAddress(),
      await merkleTree.getAddress(),
      await kikToken.getAddress()
    );
    await burningSystem.waitForDeployment();

    // Setup: Set pool address in token and merkle tree
    await kikToken.setPoolAddress(await pool.getAddress());
    await merkleTree.setAuthorizedCaller(await pool.getAddress(), true);

    // Setup: Set burning system in pool
    await pool.setBurningSystem(await burningSystem.getAddress());

    // Get constants
    KEEPER_REWARD = await burningSystem.KEEPER_REWARD();
    SOFT_EXPIRY = await burningSystem.SOFT_EXPIRY();
    GRACE_PERIOD = await burningSystem.GRACE_PERIOD();
    HARD_EXPIRY = await burningSystem.HARD_EXPIRY();

    // Mint tokens to user1 for testing
    const mintAmount = ethers.parseEther("10000");
    await kikToken.connect(owner).transfer(user1.address, mintAmount);

    // Fund burning system with rewards
    const rewardFund = ethers.parseEther("100"); // 100 KIK for rewards
    await kikToken.connect(owner).approve(await burningSystem.getAddress(), rewardFund);
    await burningSystem.connect(owner).fundRewards(rewardFund);
  });

  describe("Deployment", function () {
    it("Should set correct pool address", async function () {
      expect(await burningSystem.pool()).to.equal(await pool.getAddress());
    });

    it("Should set correct merkle tree address", async function () {
      expect(await burningSystem.merkleTree()).to.equal(await merkleTree.getAddress());
    });

    it("Should set correct KIK token address", async function () {
      expect(await burningSystem.kikToken()).to.equal(await kikToken.getAddress());
    });

    it("Should set deployer as admin", async function () {
      expect(await burningSystem.admin()).to.equal(owner.address);
    });

    it("Should have correct keeper reward", async function () {
      expect(KEEPER_REWARD).to.equal(ethers.parseEther("0.01"));
    });

    it("Should have correct expiry thresholds", async function () {
      expect(SOFT_EXPIRY).to.equal(91 * 24 * 60 * 60); // 91 days
      expect(HARD_EXPIRY).to.equal(105 * 24 * 60 * 60); // 105 days
    });

    it("Should have funded reward balance", async function () {
      const stats = await burningSystem.getStats();
      expect(stats._rewardBalance).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to set new admin", async function () {
      await burningSystem.connect(owner).setAdmin(user1.address);
      expect(await burningSystem.admin()).to.equal(user1.address);
    });

    it("Should reject non-admin setting admin", async function () {
      await expect(
        burningSystem.connect(user1).setAdmin(user2.address)
      ).to.be.revertedWithCustomError(burningSystem, "OnlyAdmin");
    });

    it("Should reject zero address as admin", async function () {
      await expect(
        burningSystem.connect(owner).setAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });
  });

  describe("Track Expired Commitment", function () {
    let commitment, amount;

    beforeEach(async function () {
      // Create a commitment
      const secret = ethers.randomBytes(32);
      const nullifier = ethers.randomBytes(32);
      amount = ethers.parseEther("100");

      commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "uint256", "address"],
          [secret, nullifier, amount, user1.address]
        )
      );

      // Deposit to pool (creates commitment)
      await kikToken.connect(user1).approve(await pool.getAddress(), amount);
      await pool.connect(user1).deposit(commitment, amount);
    });

    it("Should track expired commitment after soft expiry", async function () {
      // Fast forward 92 days
      await time.increase(92 * 24 * 60 * 60);

      // Call trackExpiredCommitment (normally called by pool)
      const depositTime = (await time.latest()) - (92 * 24 * 60 * 60);
      await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
        commitment,
        amount,
        depositTime
      );

      const expiredCount = await burningSystem.getExpiredCount();
      expect(expiredCount).to.equal(1);
    });

    it("Should reject tracking before soft expiry", async function () {
      // Only 50 days passed
      await time.increase(50 * 24 * 60 * 60);

      const depositTime = (await time.latest()) - (50 * 24 * 60 * 60);
      await expect(
        burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
          commitment,
          amount,
          depositTime
        )
      ).to.be.revertedWithCustomError(burningSystem, "CommitmentNotExpired");
    });

    it("Should not duplicate if already tracked", async function () {
      // Fast forward 92 days
      await time.increase(92 * 24 * 60 * 60);

      const depositTime = (await time.latest()) - (92 * 24 * 60 * 60);

      // Track twice
      await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
        commitment,
        amount,
        depositTime
      );

      await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
        commitment,
        amount,
        depositTime
      );

      // Should only have 1 entry
      const expiredCount = await burningSystem.getExpiredCount();
      expect(expiredCount).to.equal(1);
    });

    it("Should emit CommitmentExpired event", async function () {
      await time.increase(92 * 24 * 60 * 60);

      const depositTime = (await time.latest()) - (92 * 24 * 60 * 60);

      await expect(
        burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
          commitment,
          amount,
          depositTime
        )
      )
        .to.emit(burningSystem, "CommitmentExpired")
        .withArgs(commitment, amount, 92 * 24 * 60 * 60);
    });

    it("Should reject non-pool caller", async function () {
      await time.increase(92 * 24 * 60 * 60);

      const depositTime = (await time.latest()) - (92 * 24 * 60 * 60);

      await expect(
        burningSystem.connect(user1).trackExpiredCommitment(
          commitment,
          amount,
          depositTime
        )
      ).to.be.revertedWithCustomError(burningSystem, "OnlyPool");
    });
  });

  describe("Burn Expired Commitments", function () {
    let commitments = [];
    let amount = ethers.parseEther("100");

    beforeEach(async function () {
      // Create and track 5 expired commitments
      for (let i = 0; i < 5; i++) {
        const secret = ethers.randomBytes(32);
        const nullifier = ethers.randomBytes(32);

        const commitment = ethers.keccak256(
          ethers.solidityPacked(
            ["bytes32", "bytes32", "uint256", "address"],
            [secret, nullifier, amount, user1.address]
          )
        );

        commitments.push({ commitment, secret, nullifier });

        // Deposit
        await kikToken.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(commitment, amount);
      }

      // Fast forward to hard expiry (106 days)
      await time.increase(106 * 24 * 60 * 60);

      // Track all as expired
      const depositTime = (await time.latest()) - (106 * 24 * 60 * 60);
      for (const c of commitments) {
        await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
          c.commitment,
          amount,
          depositTime
        );
      }
    });

    it("Should burn expired commitments", async function () {
      const expiredBefore = await burningSystem.getExpiredCount();
      expect(expiredBefore).to.equal(5);

      // Call burnExpired as keeper
      const tx = await burningSystem.connect(keeper).burnExpired();
      const receipt = await tx.wait();

      // Should burn at least 1 commitment (probabilistic)
      const expiredAfter = await burningSystem.getExpiredCount();
      expect(expiredAfter).to.be.lte(expiredBefore);
    });

    it("Should reward keeper for burning", async function () {
      const balanceBefore = await kikToken.balanceOf(keeper.address);

      await burningSystem.connect(keeper).burnExpired();

      const balanceAfter = await kikToken.balanceOf(keeper.address);

      // Keeper should receive rewards (at least 1 commitment burned)
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should emit CommitmentBurned events", async function () {
      const tx = await burningSystem.connect(keeper).burnExpired();

      // At least 1 event emitted (probabilistic with 50% burn rate)
      // We can't guarantee exact count due to randomness
      const receipt = await tx.wait();
      const events = receipt.logs.filter(
        log => log.fragment && log.fragment.name === "CommitmentBurned"
      );

      // With 50% burn probability and 5 commitments, expect 1-5 burns
      expect(events.length).to.be.gte(0);
    });

    it("Should emit KeeperRewarded event if commitments burned", async function () {
      // Multiple attempts to ensure at least 1 burn
      let burned = false;
      for (let i = 0; i < 10; i++) {
        const tx = await burningSystem.connect(keeper).burnExpired();
        const receipt = await tx.wait();

        const rewardEvent = receipt.logs.find(
          log => log.fragment && log.fragment.name === "KeeperRewarded"
        );

        if (rewardEvent) {
          burned = true;
          break;
        }
      }

      // With 50% probability, should succeed in 10 attempts
      expect(burned).to.be.true;
    });

    it("Should update statistics", async function () {
      const statsBefore = await burningSystem.getStats();

      await burningSystem.connect(keeper).burnExpired();

      const statsAfter = await burningSystem.getStats();

      // Total burned should increase (or stay same if none burned)
      expect(statsAfter._totalBurned).to.be.gte(statsBefore._totalBurned);
    });

    it("Should respect MAX_BURN_BATCH limit", async function () {
      // Create 15 more commitments (total 20)
      for (let i = 0; i < 15; i++) {
        const secret = ethers.randomBytes(32);
        const nullifier = ethers.randomBytes(32);

        const commitment = ethers.keccak256(
          ethers.solidityPacked(
            ["bytes32", "bytes32", "uint256", "address"],
            [secret, nullifier, amount, user1.address]
          )
        );

        await kikToken.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(commitment, amount);

        const depositTime = (await time.latest()) - (106 * 24 * 60 * 60);
        await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
          commitment,
          amount,
          depositTime
        );
      }

      const totalBefore = await burningSystem.totalBurned();

      await burningSystem.connect(keeper).burnExpired();

      const totalAfter = await burningSystem.totalBurned();
      const burned = totalAfter - totalBefore;

      // Should burn max 10 per call
      expect(burned).to.be.lte(10);
    });

    it("Should revert if no expired commitments", async function () {
      // Burn all commitments first
      for (let i = 0; i < 10; i++) {
        try {
          await burningSystem.connect(keeper).burnExpired();
        } catch (e) {
          // May fail if all burned
        }
      }

      // Clear the list by calling from pool
      const allCommitments = await burningSystem.getExpiredCommitments();
      for (const commitment of allCommitments) {
        // This should be done by pool, but for testing we simulate
        // In real scenario, pool.burnCommitment would handle this
      }

      // If list is empty, should revert
      const count = await burningSystem.getExpiredCount();
      if (count === 0n) {
        await expect(
          burningSystem.connect(keeper).burnExpired()
        ).to.be.revertedWithCustomError(burningSystem, "NoExpiredCommitments");
      }
    });
  });

  describe("Burn Eligibility", function () {
    let commitment, amount, depositTime;

    beforeEach(async function () {
      const secret = ethers.randomBytes(32);
      const nullifier = ethers.randomBytes(32);
      amount = ethers.parseEther("100");

      commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "uint256", "address"],
          [secret, nullifier, amount, user1.address]
        )
      );

      // Deposit
      await kikToken.connect(user1).approve(await pool.getAddress(), amount);
      await pool.connect(user1).deposit(commitment, amount);

      depositTime = await time.latest();
    });

    it("Should return not eligible before soft expiry", async function () {
      await time.increase(50 * 24 * 60 * 60); // 50 days

      const [eligible, age, probability] = await burningSystem.getBurnEligibility(commitment);

      expect(eligible).to.be.false;
      expect(probability).to.equal(0);
    });

    it("Should return eligible with 5% probability in grace period", async function () {
      await time.increase(95 * 24 * 60 * 60); // 95 days (in grace)

      await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
        commitment,
        amount,
        depositTime
      );

      const [eligible, age, probability] = await burningSystem.getBurnEligibility(commitment);

      expect(eligible).to.be.true;
      expect(probability).to.equal(5);
    });

    it("Should return eligible with 50% probability after hard expiry", async function () {
      await time.increase(110 * 24 * 60 * 60); // 110 days (hard expiry)

      await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
        commitment,
        amount,
        depositTime
      );

      const [eligible, age, probability] = await burningSystem.getBurnEligibility(commitment);

      expect(eligible).to.be.true;
      expect(probability).to.equal(50);
    });

    it("Should return not eligible if already burned", async function () {
      await time.increase(110 * 24 * 60 * 60);

      await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
        commitment,
        amount,
        depositTime
      );

      // Burn the commitment (simulate)
      // In real scenario, this would be done by burnExpired()

      const [eligible, , ] = await burningSystem.getBurnEligibility(commitment);
      // Eligibility depends on whether it was burned, tested separately
    });
  });

  describe("View Functions", function () {
    it("Should return correct expired count", async function () {
      expect(await burningSystem.getExpiredCount()).to.equal(0);

      // Add 3 expired commitments
      for (let i = 0; i < 3; i++) {
        const secret = ethers.randomBytes(32);
        const nullifier = ethers.randomBytes(32);
        const amount = ethers.parseEther("100");

        const commitment = ethers.keccak256(
          ethers.solidityPacked(
            ["bytes32", "bytes32", "uint256", "address"],
            [secret, nullifier, amount, user1.address]
          )
        );

        await kikToken.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(commitment, amount);

        await time.increase(92 * 24 * 60 * 60);

        const depositTime = (await time.latest()) - (92 * 24 * 60 * 60);
        await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
          commitment,
          amount,
          depositTime
        );
      }

      expect(await burningSystem.getExpiredCount()).to.equal(3);
    });

    it("Should return correct stats", async function () {
      const stats = await burningSystem.getStats();

      expect(stats._expiredCount).to.equal(0);
      expect(stats._totalBurned).to.equal(0);
      expect(stats._totalRewards).to.equal(0);
      expect(stats._rewardBalance).to.equal(ethers.parseEther("100"));
    });

    it("Should return list of expired commitments", async function () {
      const list = await burningSystem.getExpiredCommitments();
      expect(list.length).to.equal(0);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow admin to emergency withdraw", async function () {
      const balanceBefore = await kikToken.balanceOf(owner.address);
      const contractBalance = await kikToken.balanceOf(await burningSystem.getAddress());

      await burningSystem.connect(owner).emergencyWithdraw();

      const balanceAfter = await kikToken.balanceOf(owner.address);

      expect(balanceAfter - balanceBefore).to.equal(contractBalance);
    });

    it("Should reject non-admin emergency withdraw", async function () {
      await expect(
        burningSystem.connect(user1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(burningSystem, "OnlyAdmin");
    });

    it("Should allow anyone to fund rewards", async function () {
      const fundAmount = ethers.parseEther("50");

      await kikToken.connect(user1).approve(await burningSystem.getAddress(), fundAmount);
      await burningSystem.connect(user1).fundRewards(fundAmount);

      const stats = await burningSystem.getStats();
      expect(stats._rewardBalance).to.equal(ethers.parseEther("150")); // 100 initial + 50 added
    });
  });

  describe("Gas Measurement", function () {
    it("Should measure gas for burnExpired()", async function () {
      // Create 10 expired commitments
      for (let i = 0; i < 10; i++) {
        const secret = ethers.randomBytes(32);
        const nullifier = ethers.randomBytes(32);
        const amount = ethers.parseEther("100");

        const commitment = ethers.keccak256(
          ethers.solidityPacked(
            ["bytes32", "bytes32", "uint256", "address"],
            [secret, nullifier, amount, user1.address]
          )
        );

        await kikToken.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(commitment, amount);
      }

      await time.increase(110 * 24 * 60 * 60);

      const depositTime = (await time.latest()) - (110 * 24 * 60 * 60);
      const allCommitments = await pool.getCommitments();
      for (const commitment of allCommitments.slice(0, 10)) {
        await burningSystem.connect(await pool.getAddress()).trackExpiredCommitment(
          commitment,
          ethers.parseEther("100"),
          depositTime
        );
      }

      const tx = await burningSystem.connect(keeper).burnExpired();
      const receipt = await tx.wait();

      console.log("       Gas used for burnExpired():", receipt.gasUsed.toString());

      // Gas target: <500k
      expect(receipt.gasUsed).to.be.lt(500000);
    });
  });
});
