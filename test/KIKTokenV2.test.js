const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KIKTokenV2", function () {
  let kikToken;
  let owner;
  let feeCollector;
  let anonymousPool;
  let user1;
  let user2;

  const MAX_SUPPLY = ethers.parseEther("10000000000"); // 10 billion
  const INITIAL_BALANCE = MAX_SUPPLY;

  beforeEach(async function () {
    // Get signers
    [owner, feeCollector, anonymousPool, user1, user2] = await ethers.getSigners();

    // Deploy KIKTokenV2
    const KIKTokenV2 = await ethers.getContractFactory("KIKTokenV2");
    kikToken = await KIKTokenV2.deploy(feeCollector.address);
    await kikToken.waitForDeployment();

    // Set anonymous pool
    await kikToken.setAnonymousPool(anonymousPool.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await kikToken.name()).to.equal("KIK Token");
      expect(await kikToken.symbol()).to.equal("KIK");
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await kikToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_BALANCE);
    });

    it("Should set the correct fee collector", async function () {
      expect(await kikToken.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should set the correct anonymous pool", async function () {
      expect(await kikToken.anonymousPool()).to.equal(anonymousPool.address);
    });

    it("Should initialize with correct base fee rate", async function () {
      expect(await kikToken.baseFeeRate()).to.equal(50); // 0.5%
    });

    it("Should initialize with correct pause fee", async function () {
      expect(await kikToken.pauseFee()).to.equal(ethers.parseEther("0.1"));
    });

    it("Should not be paused initially", async function () {
      expect(await kikToken.paused()).to.equal(false);
    });
  });

  describe("Admin Functions", function () {
    describe("setAnonymousPool", function () {
      it("Should allow owner to set pool address", async function () {
        const newPool = user1.address;
        await expect(kikToken.setAnonymousPool(newPool))
          .to.emit(kikToken, "AnonymousPoolSet")
          .withArgs(anonymousPool.address, newPool);

        expect(await kikToken.anonymousPool()).to.equal(newPool);
      });

      it("Should reject zero address", async function () {
        await expect(
          kikToken.setAnonymousPool(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(kikToken, "InvalidAddress");
      });

      it("Should reject non-owner", async function () {
        await expect(
          kikToken.connect(user1).setAnonymousPool(user2.address)
        ).to.be.reverted;
      });
    });

    describe("setFeeCollector", function () {
      it("Should allow owner to set fee collector", async function () {
        const newCollector = user1.address;
        await expect(kikToken.setFeeCollector(newCollector))
          .to.emit(kikToken, "FeeCollectorSet")
          .withArgs(feeCollector.address, newCollector);

        expect(await kikToken.feeCollector()).to.equal(newCollector);
      });

      it("Should reject zero address", async function () {
        await expect(
          kikToken.setFeeCollector(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(kikToken, "InvalidAddress");
      });
    });

    describe("setPauseFee", function () {
      it("Should allow owner to set pause fee", async function () {
        const newFee = ethers.parseEther("0.5");
        await expect(kikToken.setPauseFee(newFee))
          .to.emit(kikToken, "PauseFeeSet")
          .withArgs(ethers.parseEther("0.1"), newFee);

        expect(await kikToken.pauseFee()).to.equal(newFee);
      });
    });

    describe("setBaseFeeRate", function () {
      it("Should allow owner to set base fee rate", async function () {
        const newRate = 100; // 1%
        await expect(kikToken.setBaseFeeRate(newRate))
          .to.emit(kikToken, "BaseFeeRateSet")
          .withArgs(50, newRate);

        expect(await kikToken.baseFeeRate()).to.equal(newRate);
      });

      it("Should reject fee rate below minimum", async function () {
        await expect(
          kikToken.setBaseFeeRate(25) // Below MIN_FEE_RATE (50)
        ).to.be.revertedWithCustomError(kikToken, "InvalidFeeRate");
      });

      it("Should reject fee rate above maximum", async function () {
        await expect(
          kikToken.setBaseFeeRate(600) // Above MAX_FEE_RATE (500)
        ).to.be.revertedWithCustomError(kikToken, "InvalidFeeRate");
      });
    });
  });

  describe("Pause Mechanism", function () {
    it("Should allow owner to pause", async function () {
      await expect(kikToken.pause())
        .to.emit(kikToken, "ContractPaused")
        .withArgs(owner.address);

      expect(await kikToken.paused()).to.equal(true);
    });

    it("Should allow anyone to unpause with fee", async function () {
      // Pause first
      await kikToken.pause();

      // Unpause with fee
      const pauseFee = await kikToken.pauseFee();
      await expect(kikToken.connect(user1).unpause({ value: pauseFee }))
        .to.emit(kikToken, "ContractUnpaused")
        .withArgs(user1.address, pauseFee);

      expect(await kikToken.paused()).to.equal(false);
    });

    it("Should reject unpause with insufficient fee", async function () {
      await kikToken.pause();

      const pauseFee = await kikToken.pauseFee();
      const insufficientFee = pauseFee - BigInt(1);

      await expect(
        kikToken.connect(user1).unpause({ value: insufficientFee })
      ).to.be.revertedWithCustomError(kikToken, "InsufficientPauseFee");
    });

    it("Should block transfers when paused", async function () {
      // Transfer some tokens to user1
      await kikToken.transfer(user1.address, ethers.parseEther("1000"));

      // Pause
      await kikToken.pause();

      // Try to transfer
      await expect(
        kikToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(kikToken, "ContractPaused");
    });
  });

  describe("Burn & Mint (Pool Functions)", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 for testing
      await kikToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    describe("burn", function () {
      it("Should allow pool to burn tokens", async function () {
        const burnAmount = ethers.parseEther("1000");
        const initialBalance = await kikToken.balanceOf(user1.address);

        // Approve pool to burn
        await kikToken.connect(user1).approve(anonymousPool.address, burnAmount);

        // Burn from pool
        await expect(kikToken.connect(anonymousPool).burn(user1.address, burnAmount))
          .to.emit(kikToken, "TokensBurned")
          .withArgs(user1.address, burnAmount);

        const finalBalance = await kikToken.balanceOf(user1.address);
        expect(finalBalance).to.equal(initialBalance - burnAmount);
      });

      it("Should reject burn from non-pool", async function () {
        await expect(
          kikToken.connect(user1).burn(user2.address, ethers.parseEther("100"))
        ).to.be.revertedWithCustomError(kikToken, "UnauthorizedMinter");
      });

      it("Should reject burn of zero amount", async function () {
        await expect(
          kikToken.connect(anonymousPool).burn(user1.address, 0)
        ).to.be.revertedWithCustomError(kikToken, "InvalidAmount");
      });
    });

    describe("mint", function () {
      it("Should allow pool to mint tokens", async function () {
        const mintAmount = ethers.parseEther("1000");
        const initialBalance = await kikToken.balanceOf(user1.address);
        const initialSupply = await kikToken.totalSupply();

        await expect(kikToken.connect(anonymousPool).mint(user1.address, mintAmount))
          .to.emit(kikToken, "TokensMinted")
          .withArgs(user1.address, mintAmount);

        const finalBalance = await kikToken.balanceOf(user1.address);
        const finalSupply = await kikToken.totalSupply();

        expect(finalBalance).to.equal(initialBalance + mintAmount);
        expect(finalSupply).to.equal(initialSupply + mintAmount);
      });

      it("Should reject mint from non-pool", async function () {
        await expect(
          kikToken.connect(user1).mint(user2.address, ethers.parseEther("100"))
        ).to.be.revertedWithCustomError(kikToken, "UnauthorizedMinter");
      });

      it("Should reject mint exceeding max supply", async function () {
        // Try to mint more than MAX_SUPPLY
        const excessAmount = ethers.parseEther("1");

        await expect(
          kikToken.connect(anonymousPool).mint(user1.address, excessAmount)
        ).to.be.revertedWithCustomError(kikToken, "MaxSupplyExceeded");
      });

      it("Should reject mint of zero amount", async function () {
        await expect(
          kikToken.connect(anonymousPool).mint(user1.address, 0)
        ).to.be.revertedWithCustomError(kikToken, "InvalidAmount");
      });
    });
  });

  describe("Fee Calculation", function () {
    it("Should calculate base fee correctly", async function () {
      const amount = ethers.parseEther("1000");
      const fee = await kikToken.calculateFee(amount);

      // Base fee is 0.5% = 5 KIK for 1000 KIK
      const expectedFee = ethers.parseEther("5"); // 0.5% of 1000
      expect(fee).to.equal(expectedFee);
    });

    it("Should increase fee with congestion", async function () {
      const amount = ethers.parseEther("1000");

      // Make several transfers to increase congestion
      await kikToken.transfer(user1.address, ethers.parseEther("100"));
      await kikToken.transfer(user1.address, ethers.parseEther("100"));
      await kikToken.transfer(user1.address, ethers.parseEther("100"));

      const fee = await kikToken.calculateFee(amount);

      // Fee should be higher than base fee due to congestion
      const baseFee = ethers.parseEther("5"); // 0.5% of 1000
      expect(fee).to.be.greaterThan(baseFee);
    });

    it("Should respect maximum fee rate", async function () {
      // Set base fee to max
      await kikToken.setBaseFeeRate(500); // 5%

      const amount = ethers.parseEther("1000");
      const fee = await kikToken.calculateFee(amount);

      // Fee should not exceed 5% (50 KIK for 1000 KIK)
      const maxFee = ethers.parseEther("50");
      expect(fee).to.be.lessThanOrEqual(maxFee);
    });
  });

  describe("Transfers with Fees", function () {
    beforeEach(async function () {
      // Transfer initial balance to user1
      await kikToken.transfer(user1.address, ethers.parseEther("100000"));
    });

    it("Should transfer with fee deduction", async function () {
      const transferAmount = ethers.parseEther("1000");
      const fee = await kikToken.calculateFee(transferAmount);

      const initialUser1Balance = await kikToken.balanceOf(user1.address);
      const initialUser2Balance = await kikToken.balanceOf(user2.address);
      const initialFeeCollectorBalance = await kikToken.balanceOf(feeCollector.address);

      await kikToken.connect(user1).transfer(user2.address, transferAmount);

      const finalUser1Balance = await kikToken.balanceOf(user1.address);
      const finalUser2Balance = await kikToken.balanceOf(user2.address);
      const finalFeeCollectorBalance = await kikToken.balanceOf(feeCollector.address);

      // User1 should lose full amount
      expect(finalUser1Balance).to.equal(initialUser1Balance - transferAmount);

      // User2 should receive amount minus fee
      const amountAfterFee = transferAmount - fee;
      expect(finalUser2Balance).to.equal(initialUser2Balance + amountAfterFee);

      // Fee collector should receive 70% of fee
      const feeToCollector = (fee * BigInt(70)) / BigInt(100);
      expect(finalFeeCollectorBalance).to.be.greaterThan(initialFeeCollectorBalance);
    });

    it("Should emit FeeCollected event", async function () {
      const transferAmount = ethers.parseEther("1000");

      await expect(kikToken.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(kikToken, "FeeCollected");
    });

    it("Should update total fees collected", async function () {
      const transferAmount = ethers.parseEther("1000");
      const initialTotalFees = await kikToken.totalFeesCollected();

      await kikToken.connect(user1).transfer(user2.address, transferAmount);

      const finalTotalFees = await kikToken.totalFeesCollected();
      expect(finalTotalFees).to.be.greaterThan(initialTotalFees);
    });

    it("Should work with transferFrom", async function () {
      const transferAmount = ethers.parseEther("1000");

      // Approve user2 to spend user1's tokens
      await kikToken.connect(user1).approve(user2.address, transferAmount);

      const initialUser1Balance = await kikToken.balanceOf(user1.address);

      // User2 transfers from user1 to themselves
      await kikToken.connect(user2).transferFrom(user1.address, user2.address, transferAmount);

      const finalUser1Balance = await kikToken.balanceOf(user1.address);
      expect(finalUser1Balance).to.equal(initialUser1Balance - transferAmount);
    });

    it("Should reject zero amount transfer", async function () {
      await expect(
        kikToken.connect(user1).transfer(user2.address, 0)
      ).to.be.revertedWithCustomError(kikToken, "InvalidAmount");
    });
  });

  describe("View Functions", function () {
    it("Should return congestion metrics", async function () {
      const [txCount, windowStart] = await kikToken.getCongestionMetrics();
      expect(txCount).to.be.a("bigint");
      expect(windowStart).to.be.a("bigint");
    });

    it("Should correctly identify pool address", async function () {
      expect(await kikToken.isPool(anonymousPool.address)).to.equal(true);
      expect(await kikToken.isPool(user1.address)).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should reject direct MATIC transfers", async function () {
      await expect(
        owner.sendTransaction({
          to: await kikToken.getAddress(),
          value: ethers.parseEther("1")
        })
      ).to.be.reverted;
    });

    it("Should handle multiple rapid transfers", async function () {
      await kikToken.transfer(user1.address, ethers.parseEther("10000"));

      // Rapid transfers
      for (let i = 0; i < 5; i++) {
        await kikToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      }

      // Should complete without errors
      expect(await kikToken.balanceOf(user2.address)).to.be.greaterThan(0);
    });
  });
});
