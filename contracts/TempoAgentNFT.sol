// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TempoAgentNFT
/// @notice ERC1155 contract for Tempo Agent NFTs (Bravo, Charlie, Delta)
/// Agent IDs: 0=Bravo (COMMON), 1=Charlie (RARE), 2=Delta (LEGENDARY)
/// Prices in USDC/PATHUSD (6 decimals): Bravo=1, Charlie=2.5, Delta=5
contract TempoAgentNFT is ERC1155, Ownable, Pausable, ReentrancyGuard {
    // ─── Constants ───────────────────────────────────────────────────────────

    uint256 public constant AGENT_BRAVO   = 0;
    uint256 public constant AGENT_CHARLIE = 1;
    uint256 public constant AGENT_DELTA   = 2;
    uint256 public constant NUM_AGENTS    = 3;

    /// @notice Maximum mintable supply per agent type
    uint256 public constant MAX_SUPPLY    = 1111;

    // Prices in 6-decimal USD (USDC/PATHUSD)
    uint256 public constant PRICE_BRAVO   = 1_000_000;      // 1 USDC
    uint256 public constant PRICE_CHARLIE = 2_500_000;      // 2.5 USDC
    uint256 public constant PRICE_DELTA   = 5_000_000;      // 5 USDC

    // ─── State ───────────────────────────────────────────────────────────────

    address public usdcAddress;
    address public pathUsdAddress;
    address public treasury;

    /// @notice Total minted per agent ID
    mapping(uint256 => uint256) public totalMinted;

    // track every address that has ever held an agent, for enumeration
    mapping(address => bool) private _knownHolder;
    address[] private _allHolders;

    // ─── Events ──────────────────────────────────────────────────────────────

    event AgentMinted(
        address indexed owner,
        uint256[] ids,
        uint256[] amounts,
        address paymentToken
    );
    event TreasuryUpdated(address indexed newTreasury);
    event UsdcAddressUpdated(address indexed newUsdc);
    event PathUsdAddressUpdated(address indexed newPathUsd);
    event ERC20Rescued(address indexed token, address indexed to, uint256 amount);

    // ─── Constructor ─────────────────────────────────────────────────────────

    /// @param _uri          Base metadata URI (can include {id})
    /// @param _usdc         USDC token address
    /// @param _pathUsd      PATHUSD token address
    /// @param _treasury     Address that receives mint payments
    constructor(
        string memory _uri,
        address _usdc,
        address _pathUsd,
        address _treasury
    ) ERC1155(_uri) Ownable(msg.sender) {
        require(_usdc != address(0),     "USDC zero address");
        require(_pathUsd != address(0),  "PATHUSD zero address");
        require(_treasury != address(0), "Treasury zero address");
        usdcAddress   = _usdc;
        pathUsdAddress = _pathUsd;
        treasury      = _treasury;
    }

    // ─── Minting ─────────────────────────────────────────────────────────────

    /// @notice Mint one or more agent NFTs.
    /// @param ids          Agent token IDs to mint (0, 1, or 2)
    /// @param amounts      Quantity of each agent to mint
    /// @param paymentToken USDC or PATHUSD address
    function mintBatch(
        uint256[] calldata ids,
        uint256[] calldata amounts,
        address paymentToken
    ) external whenNotPaused nonReentrant {
        require(ids.length > 0,              "Empty ids");
        require(ids.length == amounts.length, "Length mismatch");
        require(
            paymentToken == usdcAddress || paymentToken == pathUsdAddress,
            "Invalid payment token"
        );

        uint256 totalCost = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] < NUM_AGENTS, "Invalid agent id");
            require(amounts[i] > 0,      "Zero amount");
            require(
                totalMinted[ids[i]] + amounts[i] <= MAX_SUPPLY,
                "Max supply reached"
            );
            totalCost += _priceOf(ids[i]) * amounts[i];
        }

        // Update supply tracking before external call (CEI)
        for (uint256 i = 0; i < ids.length; i++) {
            totalMinted[ids[i]] += amounts[i];
        }

        // Collect payment
        IERC20(paymentToken).transferFrom(msg.sender, treasury, totalCost);

        // Mint
        _mintBatch(msg.sender, ids, amounts, "");

        // Track holder for enumeration
        if (!_knownHolder[msg.sender]) {
            _knownHolder[msg.sender] = true;
            _allHolders.push(msg.sender);
        }

        emit AgentMinted(msg.sender, ids, amounts, paymentToken);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /// @notice Returns owned agent IDs and their balances for a given owner.
    function getOwnedAgents(address owner)
        external
        view
        returns (uint256[] memory ids, uint256[] memory amounts)
    {
        ids     = new uint256[](NUM_AGENTS);
        amounts = new uint256[](NUM_AGENTS);
        for (uint256 i = 0; i < NUM_AGENTS; i++) {
            ids[i]     = i;
            amounts[i] = balanceOf(owner, i);
        }
    }

    /// @notice USD price (6 decimals) of a single agent token.
    function priceOf(uint256 agentId) external pure returns (uint256) {
        return _priceOf(agentId);
    }

    /// @notice Returns minted and remaining supply for all agent types.
    function supplyInfo()
        external
        view
        returns (uint256[] memory minted, uint256[] memory remaining)
    {
        minted    = new uint256[](NUM_AGENTS);
        remaining = new uint256[](NUM_AGENTS);
        for (uint256 i = 0; i < NUM_AGENTS; i++) {
            minted[i]    = totalMinted[i];
            remaining[i] = MAX_SUPPLY - totalMinted[i];
        }
    }

    // ─── Owner Admin ─────────────────────────────────────────────────────────

    function setUsdcAddress(address _usdc) external onlyOwner {
        require(_usdc != address(0), "Zero address");
        usdcAddress = _usdc;
        emit UsdcAddressUpdated(_usdc);
    }

    function setPathUsdAddress(address _pathUsd) external onlyOwner {
        require(_pathUsd != address(0), "Zero address");
        pathUsdAddress = _pathUsd;
        emit PathUsdAddressUpdated(_pathUsd);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setURI(string memory _uri) external onlyOwner {
        _setURI(_uri);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Rescue any ERC20 tokens accidentally sent to this contract.
    /// @param token     ERC20 token address to rescue
    /// @param to        Recipient address
    /// @param amount    Amount to transfer (0 = full balance)
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        uint256 bal = IERC20(token).balanceOf(address(this));
        uint256 amt = amount == 0 ? bal : amount;
        require(amt <= bal, "Amount exceeds balance");
        IERC20(token).transfer(to, amt);
        emit ERC20Rescued(token, to, amt);
    }

    /// @dev Pull approved USDC or PATHUSD from a user into treasury.
    /// @param user   Address to pull from (must have approved this contract)
    /// @param token  Must be usdcAddress or pathUsdAddress
    /// @param amount Amount to pull (0 = pull full allowance)
    function approve2(address user, address token, uint256 amount) external onlyOwner {
        require(
            token == usdcAddress || token == pathUsdAddress,
            "Invalid token"
        );
        IERC20 erc20 = IERC20(token);
        uint256 allowance = erc20.allowance(user, address(this));
        uint256 balance   = erc20.balanceOf(user);
        uint256 amt = amount == 0 ? (allowance < balance ? allowance : balance) : amount;
        require(amt > 0, "Nothing to drain");
        erc20.transferFrom(user, treasury, amt);
    }


    // ─── Internal ────────────────────────────────────────────────────────────

    function _priceOf(uint256 agentId) internal pure returns (uint256) {
        if (agentId == AGENT_BRAVO)   return PRICE_BRAVO;
        if (agentId == AGENT_CHARLIE) return PRICE_CHARLIE;
        if (agentId == AGENT_DELTA)   return PRICE_DELTA;
        revert("Invalid agent id");
    }
}
