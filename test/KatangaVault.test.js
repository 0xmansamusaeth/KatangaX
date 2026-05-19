const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const CONTRIBUTION = 100n * 10n ** 6n; // 100 USDC
const ROUND_DAYS = 30n;

async function signDisbursement(signer, hash) {
  return signer.signMessage(ethers.getBytes(hash));
}

async function deployVaultFixture() {
  const [organiser, m1, m2, m3, m4, outsider] =
    await ethers.getSigners();

  const members = [
    organiser.address,
    m1.address,
    m2.address,
    m3.address,
    m4.address,
  ];

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const mockCode = await ethers.provider.getCode(await usdc.getAddress());
  await ethers.provider.send("hardhat_setCode", [USDC_ADDRESS, mockCode]);
  const usdcAtBase = MockUSDC.attach(USDC_ADDRESS);

  const factory = await (
    await ethers.getContractFactory("KatangaVaultFactory")
  ).deploy();
  await factory.waitForDeployment();

  const tx = await factory
    .connect(organiser)
    .createVault("Chama Test", members, CONTRIBUTION, ROUND_DAYS);
  const receipt = await tx.wait();
  const created = receipt.logs.find(
    (l) => l.fragment && l.fragment.name === "VaultCreated",
  );
  const vaultAddress = created.args.vault;

  const vault = await ethers.getContractAt("KatangaVault", vaultAddress);

  const pot = CONTRIBUTION * BigInt(members.length);

  for (const signer of [organiser, m1, m2, m3, m4]) {
    await usdcAtBase.mint(signer.address, pot * 10n);
    await usdcAtBase
      .connect(signer)
      .approve(vaultAddress, ethers.MaxUint256);
  }

  return {
    vault,
    vaultAddress,
    factory,
    usdc: usdcAtBase,
    organiser,
    m1,
    m2,
    m3,
    m4,
    outsider,
    members,
    pot,
  };
}

describe("KatangaVault", function () {
  describe("Factory & deployment", function () {
    it("deploys factory and creates a vault", async function () {
      const { factory, vault, organiser, members } =
        await loadFixture(deployVaultFixture);

      expect(await vault.vaultName()).to.equal("Chama Test");
      expect(await vault.organiser()).to.equal(organiser.address);
      expect(await vault.totalMembers()).to.equal(members.length);
      expect(await vault.currentRound()).to.equal(1);
      expect(await vault.isActive()).to.equal(true);

      const byOrganiser = await factory.getVaultsByOrganiser(
        organiser.address,
      );
      expect(byOrganiser.length).to.equal(1);
      expect(byOrganiser[0]).to.equal(await vault.getAddress());

      const byMember = await factory.getVaultsByMember(members[1]);
      expect(byMember.length).to.equal(1);
    });
  });

  describe("Contributions", function () {
    it("allows all members to contribute", async function () {
      const { vault, organiser, m1, m2, m3, m4, usdc, vaultAddress, pot } =
        await loadFixture(deployVaultFixture);

      const signers = [organiser, m1, m2, m3, m4];
      for (const s of signers) {
        await expect(vault.connect(s).contribute())
          .to.emit(vault, "ContributionMade")
          .withArgs(s.address, 1, CONTRIBUTION);
      }

      expect(await usdc.balanceOf(vaultAddress)).to.equal(pot);
      const [, , , , , , , , , roundDisbursed] =
        await vault.getVaultStatus();
      expect(roundDisbursed).to.equal(false);

      const hash = await vault.getDisbursementHash(1);
      expect(hash).to.not.equal(ethers.ZeroHash);
    });

    it("reverts duplicate contribution", async function () {
      const { vault, organiser } = await loadFixture(deployVaultFixture);
      await vault.connect(organiser).contribute();
      await expect(vault.connect(organiser).contribute()).to.be.revertedWithCustomError(
        vault,
        "AlreadyPaidThisRound",
      );
    });

    it("reverts non-member contribution", async function () {
      const { vault, outsider } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(outsider).contribute(),
      ).to.be.revertedWithCustomError(vault, "NotMember");
    });
  });

  describe("Disbursement approvals", function () {
    async function fullyFundedFixture() {
      const base = await loadFixture(deployVaultFixture);
      const { vault, organiser, m1, m2, m3, m4 } = base;
      for (const s of [organiser, m1, m2, m3, m4]) {
        await vault.connect(s).contribute();
      }
      return base;
    }

    it("accepts three valid signatures and disburses", async function () {
      const {
        vault,
        organiser,
        m1,
        m2,
        usdc,
        members,
        pot,
      } = await fullyFundedFixture();

      const round = 1;
      const hash = await vault.getDisbursementHash(round);
      const recipient = members[0];

      await expect(
        vault
          .connect(organiser)
          .approveDisbursement(round, await signDisbursement(organiser, hash)),
      )
        .to.emit(vault, "DisbursementApproved")
        .withArgs(organiser.address, round, 1);

      await expect(
        vault
          .connect(m1)
          .approveDisbursement(round, await signDisbursement(m1, hash)),
      )
        .to.emit(vault, "DisbursementApproved")
        .withArgs(m1.address, round, 2);

      const balBefore = await usdc.balanceOf(recipient);
      await expect(
        vault
          .connect(m2)
          .approveDisbursement(round, await signDisbursement(m2, hash)),
      )
        .to.emit(vault, "PayoutDisbursed")
        .withArgs(recipient, round, pot);

      expect(await usdc.balanceOf(recipient) - balBefore).to.equal(pot);

      const roundInfo = await vault.getRoundInfo(1);
      expect(roundInfo.disbursed).to.equal(true);
      expect(roundInfo.approvalCount).to.equal(3);
      expect(await vault.currentRound()).to.equal(2);
    });

    it("reverts invalid signature", async function () {
      const { vault, organiser, m1, m2, outsider } =
        await fullyFundedFixture();
      const round = 1;
      const hash = await vault.getDisbursementHash(round);

      await vault
        .connect(organiser)
        .approveDisbursement(round, await signDisbursement(organiser, hash));

      const badSig = await signDisbursement(outsider, hash);
      await expect(
        vault.connect(m1).approveDisbursement(round, badSig),
      ).to.be.revertedWithCustomError(vault, "InvalidSignature");
    });
  });

  describe("Round progression & completion", function () {
    it("advances rounds and completes vault after final payout", async function () {
      const {
        vault,
        organiser,
        m1,
        m2,
        m3,
        m4,
        members,
        pot,
        usdc,
      } = await loadFixture(deployVaultFixture);

      const signers = [organiser, m1, m2, m3, m4];
      const totalRounds = members.length;

      for (let round = 1; round <= totalRounds; round++) {
        for (const s of signers) {
          await vault.connect(s).contribute();
        }

        const hash = await vault.getDisbursementHash(round);
        const approvers = [organiser, m1, m2];
        for (const a of approvers) {
          await vault
            .connect(a)
            .approveDisbursement(round, await signDisbursement(a, hash));
        }

        const recipient = members[round - 1];
        expect(await usdc.balanceOf(recipient)).to.be.gte(pot);

        if (round < totalRounds) {
          expect(await vault.currentRound()).to.equal(round + 1);
          expect(await vault.isActive()).to.equal(true);
        }
      }

      expect(await vault.isActive()).to.equal(false);
      await expect(vault.connect(organiser).contribute()).to.be.revertedWithCustomError(
        vault,
        "VaultInactive",
      );
    });
  });

  describe("Views", function () {
    it("getVaultStatus returns expected fields", async function () {
      const { vault, organiser, members, pot } =
        await loadFixture(deployVaultFixture);

      const status = await vault.getVaultStatus();
      expect(status[0]).to.equal("Chama Test");
      expect(status[1]).to.equal(organiser.address);
      expect(status[2]).to.equal(true);
      expect(status[3]).to.equal(1);
      expect(status[4]).to.equal(members.length);
      expect(status[5]).to.equal(CONTRIBUTION);
      expect(status[6]).to.equal(members.length);
      expect(status[7]).to.equal(members[0]);
      expect(status[9]).to.equal(false);
      expect(status[10]).to.equal(0);

      await vault.connect(organiser).contribute();
      const statusAfter = await vault.getVaultStatus();
      expect(statusAfter[10]).to.equal(CONTRIBUTION);
    });

    it("getMemberStatus returns per-member data", async function () {
      const { vault, m1 } = await loadFixture(deployVaultFixture);

      let s = await vault.getMemberStatus(m1.address);
      expect(s[0]).to.equal(true);
      expect(s[1]).to.equal(false);
      expect(s[2]).to.equal(false);
      expect(s[3]).to.equal(0);
      expect(s[4]).to.equal(false);

      await vault.connect(m1).contribute();
      s = await vault.getMemberStatus(m1.address);
      expect(s[1]).to.equal(true);
      expect(s[3]).to.equal(CONTRIBUTION);
    });

    it("getRoundInfo returns round metadata", async function () {
      const { vault, members, pot } = await loadFixture(deployVaultFixture);
      const [recipient, amount, disbursed, approvals, hash] =
        await vault.getRoundInfo(1);
      expect(recipient).to.equal(members[0]);
      expect(amount).to.equal(pot);
      expect(disbursed).to.equal(false);
      expect(approvals).to.equal(0);
      expect(hash).to.equal(ethers.ZeroHash);
    });
  });

  describe("Reentrancy", function () {
    it("blocks reentrancy on contribute", async function () {
      const [organiser, m1, m2, m3] = await ethers.getSigners();
      const members = [
        organiser.address,
        m1.address,
        m2.address,
        m3.address,
      ];

      const ReentrancyUSDC = await ethers.getContractFactory("ReentrancyUSDC");
      const usdcImpl = await ReentrancyUSDC.deploy();
      await usdcImpl.waitForDeployment();
      const code = await ethers.provider.getCode(await usdcImpl.getAddress());
      await ethers.provider.send("hardhat_setCode", [USDC_ADDRESS, code]);
      const usdc = ReentrancyUSDC.attach(USDC_ADDRESS);

      const factory = await (
        await ethers.getContractFactory("KatangaVaultFactory")
      ).deploy();
      const tx = await factory
        .connect(organiser)
        .createVault("Reentrant", members, CONTRIBUTION, ROUND_DAYS);
      const receipt = await tx.wait();
      const vaultAddress = receipt.logs.find(
        (l) => l.fragment?.name === "VaultCreated",
      ).args.vault;
      const vault = await ethers.getContractAt("KatangaVault", vaultAddress);

      await usdc.configure(vaultAddress, organiser.address);
      await usdc.setReenterEnabled(true);
      await usdc.mint(organiser.address, CONTRIBUTION * 10n);
      await usdc.connect(organiser).approve(vaultAddress, CONTRIBUTION * 10n);

      await expect(vault.connect(organiser).contribute()).to.be.reverted;
    });
  });
});
