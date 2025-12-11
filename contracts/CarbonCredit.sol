// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCredit is ERC20, Ownable {
    struct Organization {
        string name;
        address wallet;
        bool active;
    }
    struct Project {
        string name;
        string ipfsHash;
        uint256 totalCredits;
    }

    mapping(address => Organization) public organizations;
    address[] public organizationList;

    mapping(uint256 => Project) public projects;
    uint256 public nextProjectId = 1;

    event CreditAdded(address indexed org, string name, uint256 amount, uint256 time);
    event CreditIssued(address indexed to, string orgName, string ipfsHash, uint256 amount, uint256 time);
    event CreditTransferred(address indexed from, address indexed to, uint256 amount, uint256 time);
    event OrganizationAdded(string name, address wallet);
    event OrganizationRemoved(address wallet);

    constructor(uint256 initialSupply) ERC20("CarbonCredit", "CO2") Ownable(msg.sender) {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * 10 ** decimals());
        }
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be > 0");
        _;
    }

    modifier onlyActiveOrg(address wallet) {
        require(organizations[wallet].active, "Organization not active");
        _;
    }

    function addCredit(string memory orgName, uint256 amount) external onlyOwner validAmount(amount) {
        _mint(msg.sender, amount * 10 ** decimals());
        emit CreditAdded(msg.sender, orgName, amount, block.timestamp);
    }

    function issueCredit(address to, string memory name, string memory ipfsHash , uint256 totalCredits) external onlyOwner validAmount(totalCredits) {
        // Thêm kiểm tra này để loại trừ lỗi Revert không có thông báo
        require(to != address(0), "Receiver address cannot be zero"); 

        projects[nextProjectId]=Project({
            name : name,
            ipfsHash: ipfsHash,
            totalCredits: totalCredits
        });
        
        _mint(to, totalCredits * 10 ** decimals());

        nextProjectId++;
        emit CreditIssued(to, name, ipfsHash, totalCredits, block.timestamp);
    }

    function transferCredit(address to, uint256 amount) external validAmount(amount) returns (bool) {
        _transfer(msg.sender, to, amount * 10 ** decimals());
        emit CreditTransferred(msg.sender, to, amount, block.timestamp);
        return true;
    }

    function addOrganization(string memory _name, address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        require(!organizations[_wallet].active, "Already registered");

        organizations[_wallet] = Organization({name: _name, wallet: _wallet, active: true});
        organizationList.push(_wallet);

        emit OrganizationAdded(_name, _wallet);
    }

    function removeOrganization(address _wallet) external onlyOwner onlyActiveOrg(_wallet) {
        organizations[_wallet].active = false;
        emit OrganizationRemoved(_wallet);
    }

    function getAllOrganizations() external view returns (Organization[] memory) {
        Organization[] memory result = new Organization[](organizationList.length);
        for (uint256 i = 0; i < organizationList.length; i++) {
            result[i] = organizations[organizationList[i]];
        }
        return result;
    }

    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory result = new Project[](nextProjectId - 1);
        for (uint256 i = 1; i < nextProjectId; i++) {
            result[i - 1] = projects[i];
        }
        return result;
    }
}