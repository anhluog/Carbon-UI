// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarbonCredit.sol";
import "./CarbonLpToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CarbonCreditAMM {
    CarbonCredit public carbonToken;
    CarbonLpToken public lpToken;
    uint256 public totalLiquidity;
    uint requiredToken;
    uint liquidityMinted;

    event Addlqd( address indexed provider, uint ethAmount, uint tokenAmount, uint lpTokenAmount);

    mapping(address => uint) public liquidity;


    constructor(address _carbonTokenAddress){
        carbonToken = CarbonCredit(_carbonTokenAddress);
        lpToken = new CarbonLpToken(address(this));

    }
    function Addliquidity( uint _tokenAmount ) external payable  {
        require( msg.value > 0, "More many" );
        require(_tokenAmount > 0, "More token ");
        uint ethReserve = address(this).balance - msg.value;
        uint tokenReserve = carbonToken.balanceOf(address(this));
        carbonToken.transferFrom(msg.sender, address(this), _tokenAmount);
        if(totalLiquidity == 0){
            liquidityMinted = msg.value * _tokenAmount;
            totalLiquidity = liquidityMinted;
        }
        else{
           requiredToken = (msg.value * tokenReserve) / ethReserve;
           require(_tokenAmount >= requiredToken, "Wrong ratio");
           liquidityMinted = (msg.value * totalLiquidity) / ethReserve;
           totalLiquidity += liquidityMinted;
           liquidity[msg.sender] += liquidityMinted;
           lpToken.mint(msg.sender, liquidityMinted);
        }
        emit Addlqd(msg.sender, msg.value, _tokenAmount, liquidityMinted );

    }
    





}
