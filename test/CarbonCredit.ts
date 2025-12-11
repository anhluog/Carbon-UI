// import { expect } from "chai";
// import hre from "hardhat";
// import "@nomicfoundation/hardhat-ethers";
// import { ZeroAddress } from "ethers";

// describe("CarbonCredit", function () {
//   let ethers: any;

//   before(async () => {
//     const g: any = globalThis as any;
//     if (g.ethers) {
//       ethers = g.ethers;
//       return;
//     }
//     if (g.hre && g.hre.ethers) {
//       ethers = g.hre.ethers;
//       return;
//     }
//     const hardhatMod: any = await import("hardhat");
//     ethers = hardhatMod.ethers;
//   });
//   it("deploys with initial supply to owner", async function () {
//     const [owner] = await ethers.getSigners();
//     const initialSupplyUnits = 1_000n;
//     const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
//     const token = await CarbonCredit.deploy(initialSupplyUnits);
//     const decimals = await token.decimals();
//     const factor = 10n ** BigInt(decimals);

//     expect(await token.totalSupply()).to.equal(initialSupplyUnits * factor);
//     expect(await token.balanceOf(owner.address)).to.equal(initialSupplyUnits * factor);
//   });

//   it("owner can add credit to themselves and emit history", async function () {
//     const [owner] = await ethers.getSigners();
//     const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
//     const token = await CarbonCredit.deploy(0);
//     const decimals = await token.decimals();
//     const factor = 10n ** BigInt(decimals);

//     const addUnits = 500n;
//     await expect(token.addCredit("Owner Org", addUnits))
//       .to.emit(token, "CreditAdded");

//     expect(await token.balanceOf(owner.address)).to.equal(addUnits * factor);

//     const history = await token.getCreditHistory(owner.address);
//     expect(history.length).to.equal(1);
//     expect(history[0].from).to.equal(ZeroAddress);
//     expect(history[0].to).to.equal(owner.address);
//     expect(history[0].amount).to.equal(addUnits);
//     expect(history[0].action).to.equal("ADD");
//   });

//   it("owner can issue credit to recipient and transfer between users", async function () {
//     const [owner, alice, bob] = await ethers.getSigners();
//     const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
//     const token = await CarbonCredit.deploy(0);
//     const decimals = await token.decimals();
//     const factor = 10n ** BigInt(decimals);

//     const issueUnits = 200n;
//     await expect(token.issueCredit(alice.address, "Alice Org", issueUnits))
//       .to.emit(token, "CreditIssued");

//     expect(await token.balanceOf(alice.address)).to.equal(issueUnits * factor);

//     const transferUnits = 50n;
//     await expect(token.connect(alice).transferCredit(bob.address, transferUnits))
//       .to.emit(token, "CreditTransferred");

//     expect(await token.balanceOf(alice.address)).to.equal((issueUnits - transferUnits) * factor);
//     expect(await token.balanceOf(bob.address)).to.equal(transferUnits * factor);

//     const aliceHist = await token.getCreditHistory(alice.address);
//     // Alice history only records ISSUE when she received; TRANSFER is recorded under receiver per contract
//     expect(aliceHist.length).to.equal(1);
//     expect(aliceHist[0].action).to.equal("ISSUE");

//     const bobHist = await token.getCreditHistory(bob.address);
//     expect(bobHist.length).to.equal(1);
//     expect(bobHist[0].action).to.equal("TRANSFER");
//     expect(bobHist[0].from).to.equal(alice.address);
//   });

//   it("manages organizations add and remove", async function () {
//     const [owner] = await ethers.getSigners();
//     const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
//     const token = await CarbonCredit.deploy(0);

//     await expect(token.addOrganization("Org A", owner.address))
//       .to.emit(token, "OrganizationAdded").withArgs("Org A", owner.address);

//     let all = await token.getAllOrganizations();
//     expect(all.length).to.equal(1);
//     expect(all[0].name).to.equal("Org A");
//     expect(all[0].wallet).to.equal(owner.address);
//     expect(all[0].active).to.equal(true);

//     await expect(token.removeOrganization(owner.address))
//       .to.emit(token, "OrganizationRemoved").withArgs(owner.address);

//     all = await token.getAllOrganizations();
//     expect(all[0].active).to.equal(false);
//   });
// });

// // no helpers needed


