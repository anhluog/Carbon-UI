import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CarbonCreditModuleV2", (m) => {
  // Triển khai contract CarbonCredit
//   const carbonCredit = m.contract("CarbonCredit");

  // Nếu có hàm khởi tạo (constructor) cần truyền tham số thì:
  const carbonCredit = m.contract("CarbonCredit", [1000]);

  // (Không cần gọi m.call nếu không muốn gọi hàm ngay sau deploy)
  return { carbonCredit };
});
//npx hardhat ignition deploy ./ignition/modules/CarbonCredit.ts --network sepolia