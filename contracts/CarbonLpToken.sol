// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CarbonLpToken is ERC20 {
    address public amm;

    modifier onlyAMM() {
        require(msg.sender == amm, "Only AMM can call this");
        _;
    }

    constructor(address _amm) ERC20("Carbon LP Token", "CLP") {
        amm = _amm;
    }

    function mint(address to, uint256 amount) external onlyAMM {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyAMM {
        _burn(from, amount);
    }
}
