// import { expect } from "chai";
// import hre from "hardhat";
// import "@nomicfoundation/hardhat-ethers";

// describe("CarbonCreditMarketplace", function () {
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

//   async function deployAll() {
//     const [owner, buyer, seller] = await ethers.getSigners();
//     const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
//     const token = await CarbonCredit.deploy(0);
//     const Marketplace = await ethers.getContractFactory("CarbonCreditMarketplace");
//     const market = await Marketplace.deploy(await token.getAddress());
//     const decimals = await token.decimals();
//     const factor = 10n ** BigInt(decimals);
//     const price = await market.getCurrentTokenPrice();
//     return { owner, buyer, seller, token, market, factor, price };
//   }

//   it("owner can deposit tokens and users can buy with exact ETH", async function () {
//     const { owner, buyer, token, market, factor, price } = await deployAll();
//     const depositUnits = 1_000n;

//     await token.issueCredit(owner.address, "Org", depositUnits);
//     await token.approve(await market.getAddress(), depositUnits * factor);
//     await market.depositToken(depositUnits);

//     const buyUnits = 10n;
//     const cost = buyUnits * price;

//     await expect(market.connect(buyer).buyTokens(buyUnits, { value: cost }))
//       .to.emit(market, "TokensPurchased").withArgs(buyer.address, buyUnits, cost);

//     expect(await token.balanceOf(buyer.address)).to.equal(buyUnits * factor);
//     expect(await token.balanceOf(await market.getAddress())).to.equal((depositUnits - buyUnits) * factor);
//   });

//   it("refunds excess ETH on buy", async function () {
//     const { owner, buyer, token, market, factor, price } = await deployAll();
//     const depositUnits = 100n;
//     await token.issueCredit(owner.address, "Org", depositUnits);
//     await token.approve(await market.getAddress(), depositUnits * factor);
//     await market.depositToken(depositUnits);

//     const buyUnits = 5n;
//     const cost = buyUnits * price;
//     const overpay = cost + price; // over by one price unit

//     const balBefore = await ethers.provider.getBalance(buyer.address);
//     const tx = await market.connect(buyer).buyTokens(buyUnits, { value: overpay });
//     const receipt = await tx.wait();
//     const gas = (receipt!.gasUsed ?? 0n) * (receipt!.gasPrice ?? 0n);
//     const balAfter = await ethers.provider.getBalance(buyer.address);

//     // Final balance = before - cost - gas
//     const spent = BigInt(balBefore) - BigInt(balAfter) - BigInt(gas);
//     expect(spent).to.equal(cost);
//   });

//   it("user can sell tokens back when marketplace has ETH liquidity", async function () {
//     const { owner, buyer, seller, token, market, factor, price } = await deployAll();
//     const depositUnits = 200n;
//     await token.issueCredit(owner.address, "Org", depositUnits);
//     await token.approve(await market.getAddress(), depositUnits * factor);
//     await market.depositToken(depositUnits);

//     // Seed ETH liquidity
//     await owner.sendTransaction({ to: await market.getAddress(), value: 10n * price });

//     // Buyer buys some, then sells
//     const buyUnits = 5n;
//     const cost = buyUnits * price;
//     await market.connect(buyer).buyTokens(buyUnits, { value: cost });

//     // approve to sell back
//     await token.connect(buyer).approve(await market.getAddress(), buyUnits * factor);
//     const balBefore = await ethers.provider.getBalance(buyer.address);
//     const tx = await market.connect(buyer).sellTokens(buyUnits);
//     const receipt = await tx.wait();
//     const gas = (receipt!.gasUsed ?? 0n) * (receipt!.gasPrice ?? 0n);
//     const balAfter = await ethers.provider.getBalance(buyer.address);

//     const gained = BigInt(balAfter) - BigInt(balBefore) + BigInt(gas);
//     expect(gained).to.equal(cost);
//     expect(await token.balanceOf(await market.getAddress())).to.equal(depositUnits * factor);
//   });

//   it("owner can withdraw ETH", async function () {
//     const { owner, market, price } = await deployAll();
//     await owner.sendTransaction({ to: await market.getAddress(), value: 5n * price });
//     const before = await ethers.provider.getBalance(owner.address);
//     const tx = await market.withdrawETH(3n * price);
//     const receipt = await tx.wait();
//     const gas = (receipt!.gasUsed ?? 0n) * (receipt!.gasPrice ?? 0n);
//     const after = await ethers.provider.getBalance(owner.address);
//     const net = BigInt(after) - BigInt(before) + BigInt(gas);
//     expect(net).to.equal(3n * price);
//   });
// });


