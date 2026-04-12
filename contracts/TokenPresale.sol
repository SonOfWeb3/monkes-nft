// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TokenPresale
/// @notice Presale contract for 6 tokens: APEX(0), NOVA(1), FLUX(2), IRIS(3), CORE(4), ECHO(5).
///         Users pay USDC or PATHUSD (1:1 USD assumed) and receive a token allocation
///         that can be claimed after TGE when the owner enables claiming.
contract TokenPresale is Ownable, Pausable, ReentrancyGuard {
    // ─── Types ────────────────────────────────────────────────────────────────

    uint256 public constant NUM_TOKENS = 6;

    struct PresaleConfig {
        address tokenAddress;
        uint256 presalePrice; // tokens received per 1 USDC (6-decimal units)
        uint256 hardCap;      // max USDC raised (6 decimals)
        uint256 endTime;      // unix timestamp
        bool    active;
    }

    struct UserAllocation {
        uint256 usdcPaid;      // total payment in 6-decimal USD
        uint256 tokenAmount;   // allocated token amount (token decimals)
        bool    claimed;
    }

    // ─── State ───────────────────────────────────────────────────────────────

    address public usdcAddress;
    address public pathUsdAddress;
    address public treasury;

    // tokenId (0-5) => config
    mapping(uint256 => PresaleConfig) public presales;
    // tokenId => amount raised in USD (6 decimals)
    uint256[NUM_TOKENS] private _raisedAmounts;
    // user => tokenId => allocation
    mapping(address => mapping(uint256 => UserAllocation)) private _allocations;
    // tokenId => claiming enabled
    mapping(uint256 => bool) public claimEnabled;

    // ─── Events ──────────────────────────────────────────────────────────────

    event Purchased(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 usdcAmount,
        uint256 tokenAmount,
        address paymentToken
    );
    event Claimed(
        address indexed claimer,
        uint256 indexed tokenId,
        uint256 tokenAmount
    );
    event PresaleAdded(uint256 indexed tokenId, address tokenAddress, uint256 price, uint256 hardCap, uint256 endTime);
    event ClaimEnabled(uint256 indexed tokenId, bool enabled);
    event FundsWithdrawn(address indexed token, uint256 amount, address indexed to);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _pathUsd,
        address _treasury
    ) Ownable(msg.sender) {
        require(_usdc     != address(0), "USDC zero address");
        require(_pathUsd  != address(0), "PATHUSD zero address");
        require(_treasury != address(0), "Treasury zero address");
        usdcAddress   = _usdc;
        pathUsdAddress = _pathUsd;
        treasury      = _treasury;
    }

    // ─── User Functions ──────────────────────────────────────────────────────

    /// @notice Buy a presale allocation.
    /// @param tokenId    0-5 (APEX, NOVA, FLUX, IRIS, CORE, ECHO)
    /// @param usdcAmount Amount of USD to pay (6 decimals)
    /// @param usePathusd If true pay with PATHUSD, otherwise USDC
    function buy(
        uint256 tokenId,
        uint256 usdcAmount,
        bool    usePathusd
    ) external whenNotPaused nonReentrant {
        require(tokenId < NUM_TOKENS, "Invalid token id");
        PresaleConfig storage cfg = presales[tokenId];
        require(cfg.active,                   "Presale not active");
        require(block.timestamp <= cfg.endTime, "Presale ended");
        require(usdcAmount > 0,               "Zero amount");

        uint256 newRaised = _raisedAmounts[tokenId] + usdcAmount;
        require(newRaised <= cfg.hardCap,     "Exceeds hard cap");

        address paymentToken = usePathusd ? pathUsdAddress : usdcAddress;
        IERC20(paymentToken).transferFrom(msg.sender, address(this), usdcAmount);

        // Calculate token allocation: tokenAmount = usdcAmount / presalePrice * 10^tokenDecimals
        // presalePrice is expressed as: number of token units (with token decimals) per 1e6 USD units
        // i.e., if presalePrice = 1e18 means 1 full token per 1 USDC
        uint256 tokenAmount = (usdcAmount * cfg.presalePrice) / 1e6;

        _raisedAmounts[tokenId] = newRaised;

        UserAllocation storage alloc = _allocations[msg.sender][tokenId];
        alloc.usdcPaid    += usdcAmount;
        alloc.tokenAmount += tokenAmount;

        emit Purchased(msg.sender, tokenId, usdcAmount, tokenAmount, paymentToken);
    }

    /// @notice Claim purchased tokens after TGE.
    /// @param tokenId 0-5
    function claim(uint256 tokenId) external nonReentrant {
        require(tokenId < NUM_TOKENS,        "Invalid token id");
        require(claimEnabled[tokenId],       "Claiming not enabled");

        UserAllocation storage alloc = _allocations[msg.sender][tokenId];
        require(alloc.tokenAmount > 0,       "No allocation");
        require(!alloc.claimed,              "Already claimed");

        alloc.claimed = true;
        uint256 amount = alloc.tokenAmount;

        IERC20(presales[tokenId].tokenAddress).transfer(msg.sender, amount);

        emit Claimed(msg.sender, tokenId, amount);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /// @notice Aggregate presale info for a token.
    function getPresaleInfo(uint256 tokenId)
        external
        view
        returns (
            address token,
            uint256 price,
            uint256 raised,
            uint256 cap,
            uint256 endTime,
            bool    active
        )
    {
        require(tokenId < NUM_TOKENS, "Invalid token id");
        PresaleConfig storage cfg = presales[tokenId];
        return (
            cfg.tokenAddress,
            cfg.presalePrice,
            _raisedAmounts[tokenId],
            cfg.hardCap,
            cfg.endTime,
            cfg.active
        );
    }

    /// @notice User's allocation for a specific presale token.
    function getUserAllocation(address user, uint256 tokenId)
        external
        view
        returns (uint256 usdcPaid, uint256 tokenAmount)
    {
        require(tokenId < NUM_TOKENS, "Invalid token id");
        UserAllocation storage alloc = _allocations[user][tokenId];
        return (alloc.usdcPaid, alloc.tokenAmount);
    }

    /// @notice Total USD raised per token (6 decimals each).
    function getRaisedAmounts() external view returns (uint256[6] memory) {
        return _raisedAmounts;
    }

    // ─── Owner Admin ─────────────────────────────────────────────────────────

    /// @notice Register or update a presale configuration.
    function addPresale(
        uint256 tokenId,
        address tokenAddress,
        uint256 presalePrice,
        uint256 hardCap,
        uint256 endTime
    ) external onlyOwner {
        require(tokenId < NUM_TOKENS,     "Invalid token id");
        require(tokenAddress != address(0), "Zero token address");
        require(presalePrice > 0,         "Zero price");
        require(hardCap > 0,              "Zero hard cap");
        require(endTime > block.timestamp, "End time in past");

        presales[tokenId] = PresaleConfig({
            tokenAddress: tokenAddress,
            presalePrice: presalePrice,
            hardCap:      hardCap,
            endTime:      endTime,
            active:       true
        });

        emit PresaleAdded(tokenId, tokenAddress, presalePrice, hardCap, endTime);
    }

    /// @notice Toggle presale active flag without full reconfiguration.
    function setPresaleActive(uint256 tokenId, bool active) external onlyOwner {
        require(tokenId < NUM_TOKENS, "Invalid token id");
        presales[tokenId].active = active;
    }

    /// @notice Enable or disable claiming for a token after TGE.
    function setClaimEnabled(uint256 tokenId, bool enabled) external onlyOwner {
        require(tokenId < NUM_TOKENS, "Invalid token id");
        claimEnabled[tokenId] = enabled;
        emit ClaimEnabled(tokenId, enabled);
    }

    /// @notice Withdraw raised funds to treasury.
    function withdrawFunds(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Zero token");
        require(amount > 0,          "Zero amount");
        IERC20(token).transfer(treasury, amount);
        emit FundsWithdrawn(token, amount, treasury);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }

    function setUsdcAddress(address _usdc) external onlyOwner {
        require(_usdc != address(0), "Zero address");
        usdcAddress = _usdc;
    }

    function setPathUsdAddress(address _pathUsd) external onlyOwner {
        require(_pathUsd != address(0), "Zero address");
        pathUsdAddress = _pathUsd;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
