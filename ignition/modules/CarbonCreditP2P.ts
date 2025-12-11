import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CarbonCreditModule from "./CarbonCreditV2.js";

export default buildModule("CarbonCreditP2PModule", (m) => {
  const { carbonCredit } = m.useModule(CarbonCreditModule);

  const p2p = m.contract("CarbonCreditP2P", [carbonCredit]);

  return { p2p, carbonCredit };
});



