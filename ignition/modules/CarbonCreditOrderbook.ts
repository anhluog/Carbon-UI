import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
// Loại bỏ import CarbonCreditModule vì giờ hardcode address, không cần useModule nữa

export default buildModule("CarbonCreditOrderbookModule", (m) => {
  // Hardcode address carbon token ERC20 (thay vì useModule)
  const carbonCredit = "0xD1e0c2f8A4b4E7d43ea7D989bB5De2E39402Aa4c";  // Địa chỉ carbon token ERC20 cố định

  // Định nghĩa các params còn lại cho constructor (hardcode cho test trên Sepolia)
  const paymentToken = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";  // WETH Sepolia (ERC20 payment token)
  const feeCollector = "0x37b046a200f35b1c097bf9878d0162fba6c61474";  // Address wallet nhận phí (thay bằng wallet thật của bạn)
  const feeBps = 50n;  // 0.5% fee (sử dụng BigInt để tránh overflow, Solidity uint256)

  // Deploy orderbook với đầy đủ 4 params constructor
  const orderbook = m.contract("CarbonCreditOrderbook", [paymentToken, carbonCredit, feeCollector, feeBps]);

  // Tùy chọn: Grant MATCHER_ROLE cho backend wallet sau deploy (thay 0xBackendWallet bằng address thật)
  // const backendWallet = "0xYourBackendWalletAddress";
  // m.call(orderbook, "grantMatcher", [backendWallet]);

  return { orderbook };  // Chỉ return orderbook (ContractFuture), loại bỏ carbonCredit vì nó là string hardcoded, không phải future
});