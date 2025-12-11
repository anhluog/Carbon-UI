// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CarbonCreditOrderbookERC20.sol
 * - Phiên bản ERC20-only: Escrow + Settlement cho mô hình Off-chain matching (Spring) + On-chain settlement
 * - Cả payment (WETH/USDC) và carbon (ERC20) đều dùng ERC20 để đơn giản hóa.
 * - Comment bằng tiếng Việt để dễ hiểu
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CarbonCreditOrderbook is AccessControl, ReentrancyGuard {
    // ============================
    // Roles
    // ============================
    bytes32 public constant MATCHER_ROLE = keccak256("MATCHER_ROLE");

    // ============================
    // Token & fee state
    // ============================
    IERC20 public paymentToken;   // ERC20 dùng để thanh toán (WETH / USDC...)
    IERC20 public carbonToken;    // ERC20 cho carbon credits (1 loại duy nhất)
    address public feeCollector;  // địa chỉ nhận phí
    uint256 public feeBps;        // fee theo basis points (1% = 100 bps)

    // ============================
    // Escrow mappings
    // ============================
    // Số dư ERC20 payment mà người dùng đã deposit
    mapping(address => uint256) public paymentEscrow;

    // Số dư ERC20 carbon mà người dùng đã deposit
    mapping(address => uint256) public carbonEscrow;

    // ============================
    // Events
    // ============================
    event DepositedPayment(address indexed who, uint256 amount);
    event WithdrawnPayment(address indexed who, uint256 amount);

    event DepositedCarbon(address indexed who, uint256 amount);
    event WithdrawnCarbon(address indexed who, uint256 amount);

    event TradeSettled(
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 price,
        uint256 fee
    );

    event FeeBpsUpdated(uint256 newFeeBps);
    event FeeCollectorUpdated(address newCollector);
    event MatcherRoleGranted(address indexed matcher);
    event MatcherRoleRevoked(address indexed matcher);

    // ============================
    // Constructor
    // ============================
    constructor(
        address _paymentToken,
        address _carbonToken,
        address _feeCollector,
        uint256 _feeBps
    ) {
        require(_paymentToken != address(0), "payment token 0");
        require(_carbonToken != address(0), "carbon token 0");
        require(_feeCollector != address(0), "feeCollector 0");
        require(_feeBps <= 1000, "fee too high");  // Tối đa 10%

        paymentToken = IERC20(_paymentToken);
        carbonToken = IERC20(_carbonToken);
        feeCollector = _feeCollector;
        feeBps = _feeBps;

        // Cấp quyền admin mặc định cho deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============================
    // Admin functions (chỉ admin)
    // ============================
    /// @notice Cập nhật fee (bps). Chỉ admin
    function setFeeBps(uint256 _feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBps <= 1000, "fee too high");
        feeBps = _feeBps;
        emit FeeBpsUpdated(_feeBps);
    }

    /// @notice Cập nhật địa chỉ fee collector. Chỉ admin
    function setFeeCollector(address _collector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_collector != address(0), "invalid address");
        feeCollector = _collector;
        emit FeeCollectorUpdated(_collector);
    }

    /// @notice Grant MATCHER_ROLE cho backend (chỉ admin)
    function grantMatcher(address matcher) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MATCHER_ROLE, matcher);
        emit MatcherRoleGranted(matcher);
    }

    /// @notice Revoke MATCHER_ROLE (chỉ admin)
    function revokeMatcher(address matcher) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MATCHER_ROLE, matcher);
        emit MatcherRoleRevoked(matcher);
    }

    // ============================
    // Deposit / Withdraw ERC20 (payment)
    // ============================
    /// @notice Deposit ERC20 payment token vào escrow (user phải approve trước)
    function depositPayment(uint256 amount) external nonReentrant {
        require(amount > 0, "amount = 0");
        bool ok = paymentToken.transferFrom(msg.sender, address(this), amount);
        require(ok, "payment transferFrom failed");

        paymentEscrow[msg.sender] += amount;
        emit DepositedPayment(msg.sender, amount);
    }

    /// @notice Withdraw ERC20 payment (rút phần dư chưa dùng)
    function withdrawPayment(uint256 amount) external nonReentrant {
        require(amount > 0, "amount = 0");
        require(paymentEscrow[msg.sender] >= amount, "insufficient balance");
        paymentEscrow[msg.sender] -= amount;
        bool ok = paymentToken.transfer(msg.sender, amount);
        require(ok, "payment transfer failed");
        emit WithdrawnPayment(msg.sender, amount);
    }

    // ============================
    // Deposit / Withdraw ERC20 (carbon)
    // ============================
    /// @notice Deposit ERC20 carbon token vào escrow (user phải approve trước)
    function depositCarbon(uint256 amount) external nonReentrant {
        require(amount > 0, "amount = 0");
        bool ok = carbonToken.transferFrom(msg.sender, address(this), amount);
        require(ok, "carbon transferFrom failed");

        carbonEscrow[msg.sender] += amount;
        emit DepositedCarbon(msg.sender, amount);
    }

    /// @notice Withdraw ERC20 carbon từ escrow (phần chưa dùng)
    function withdrawCarbon(uint256 amount) external nonReentrant {
        require(amount > 0, "amount = 0");
        require(carbonEscrow[msg.sender] >= amount, "insufficient balance");
        carbonEscrow[msg.sender] -= amount;
        bool ok = carbonToken.transfer(msg.sender, amount);
        require(ok, "carbon transfer failed");
        emit WithdrawnCarbon(msg.sender, amount);
    }

    // ============================
    // Settlement: gọi bởi backend (MATCHER_ROLE)
    // ============================
    /// @notice Thực hiện settlement cho một trade đã match off-chain
    /// @param buyer địa chỉ buyer (phải đã deposit đủ payment)
    /// @param seller địa chỉ seller (phải đã deposit đủ carbon)
    /// @param amount số lượng carbon units
    /// @param price price per unit (đơn vị: paymentToken smallest unit)
    function settleTrade(
        address buyer,
        address seller,
        uint256 amount,
        uint256 price
    ) external nonReentrant onlyRole(MATCHER_ROLE) {
        require(buyer != address(0) && seller != address(0), "invalid parties");
        require(buyer != seller, "buyer == seller");
        require(amount > 0, "amount = 0");
        require(price > 0, "price = 0");

        // Tính tổng thanh toán (price * amount)
        uint256 total = price * amount;

        // Kiểm tra escrow buyer và seller
        require(paymentEscrow[buyer] >= total, "buyer payment insufficient");
        require(carbonEscrow[seller] >= amount, "seller carbon insufficient");

        // Trừ escrow
        paymentEscrow[buyer] -= total;
        carbonEscrow[seller] -= amount;

        // Tính fee (basis points)
        uint256 fee = 0;
        if (feeBps > 0) {
            fee = (total * feeBps) / 10000;
        }
        uint256 sellerReceive = total - fee;

        // Chuyển payment cho seller
        bool ok1 = paymentToken.transfer(seller, sellerReceive);
        require(ok1, "payment->seller failed");

        // Chuyển fee cho feeCollector
        if (fee > 0) {
            bool ok2 = paymentToken.transfer(feeCollector, fee);
            require(ok2, "fee transfer failed");
        }

        // Chuyển carbon token từ contract -> buyer
        bool ok3 = carbonToken.transfer(buyer, amount);
        require(ok3, "carbon->buyer failed");

        emit TradeSettled(buyer, seller, amount, price, fee);
    }

    // Override supportsInterface chỉ cho AccessControl
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}