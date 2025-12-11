// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarbonCredit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditMarketplace is Ownable {
    CarbonCredit public token;
    uint256 public pricePerToken;

    event TokensPurchased(address buyer, uint256 units, uint256 cost);
    event TokensSold(address seller, uint256 units, uint256 revenue);
    event ETHWithdrawn(address indexed admin, uint256 amount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = CarbonCredit(_tokenAddress);
        pricePerToken = 0.001 ether; // giá cố định
    }

    function getCurrentTokenPrice() public view returns (uint256) {
        return pricePerToken;
    }

    function buyTokens(uint256 units) public payable {
        require(units > 0, "Nhap so hop le");
        uint256 cost = units * pricePerToken;

        require(msg.value >= cost, "So du khong du de giao dich");

        uint256 amt = units * (10 ** token.decimals());
        require(token.balanceOf(address(this)) >= amt, "Khong du token trong marketplace");

        token.transfer(msg.sender, amt);

        // Refund ETH thua
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit TokensPurchased(msg.sender, units, cost);
    }

    function sellTokens(uint256 units) public {
        require(units > 0, "So luong khong hop le");
        uint256 revenue = units * pricePerToken;

        require(address(this).balance >= revenue, "Marketplace khong du ETH");

        uint256 amt = units * (10 ** token.decimals());
        require(token.allowance(msg.sender, address(this)) >= amt, "Chua approve token");

        token.transferFrom(msg.sender, address(this), amt);
        payable(msg.sender).transfer(revenue);

        emit TokensSold(msg.sender, units, revenue);
    }

    function depositToken(uint256 units) public onlyOwner {
        uint256 amt = units * (10 ** token.decimals());
        require(token.transferFrom(msg.sender, address(this), amt), "Chuyen token that bai");
    }

    function withdrawETH(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Khong du ETH");
        payable(msg.sender).transfer(amount);
        emit ETHWithdrawn(msg.sender, amount);
    }

    receive() external payable {}
}
