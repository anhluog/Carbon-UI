import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CarbonCreditModuleV2 from "./CarbonCreditV2.js";

export default buildModule("CarbonCreditMarketplaceModuleV2", (m) => {
  const { carbonCredit } = m.useModule(CarbonCreditModuleV2);

  const marketplace = m.contract("CarbonCreditMarketplace", [carbonCredit]);

  return { marketplace, carbonCredit };
});


