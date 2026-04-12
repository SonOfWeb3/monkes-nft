// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AgentVault
/// @notice Users deposit USDC or PATHUSD into their agent's vault.
///         Each (owner, agentId, token) mapping holds an independent balance.
///         Requires caller to own at least 1 of the specified agent NFT.
contract AgentVault is Ownable, Pausable, ReentrancyGuard {
    // ─── State ───────────────────────────────────────────────────────────────

    IERC1155 public agentNFT;
    address  public usdcAddress;
    address  public pathUsdAddress;

    /// owner => agentId => token => balance
    mapping(address => mapping(uint256 => mapping(address => uint256))) private _balances;

    // ─── Events ──────────────────────────────────────────────────────────────

    event Deposited(
        address indexed owner,
        uint256 indexed agentId,
        address indexed token,
        uint256 amount
    );
    event Withdrawn(
        address indexed owner,
        uint256 indexed agentId,
        address indexed token,
        uint256 amount
    );
    event AgentNFTUpdated(address indexed newAgentNFT);
    event UsdcAddressUpdated(address indexed newUsdc);
    event PathUsdAddressUpdated(address indexed newPathUsd);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _agentNFT,
        address _usdc,
        address _pathUsd
    ) Ownable(msg.sender) {
        require(_agentNFT != address(0), "AgentNFT zero address");
        require(_usdc     != address(0), "USDC zero address");
        require(_pathUsd  != address(0), "PATHUSD zero address");
        agentNFT      = IERC1155(_agentNFT);
        usdcAddress   = _usdc;
        pathUsdAddress = _pathUsd;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /// @notice Deposit USDC or PATHUSD into an agent vault.
    /// @param agentId Agent token ID (0, 1, or 2)
    /// @param token   USDC or PATHUSD address
    /// @param amount  Amount to deposit (6 decimals)
    function deposit(
        uint256 agentId,
        address token,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        _requireOwnsAgent(msg.sender, agentId);
        _requireValidToken(token);
        require(amount > 0, "Zero amount");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        _balances[msg.sender][agentId][token] += amount;

        emit Deposited(msg.sender, agentId, token, amount);
    }

    /// @notice Withdraw USDC or PATHUSD from an agent vault.
    /// @param agentId Agent token ID (0, 1, or 2)
    /// @param token   USDC or PATHUSD address
    /// @param amount  Amount to withdraw (6 decimals)
    function withdraw(
        uint256 agentId,
        address token,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        _requireOwnsAgent(msg.sender, agentId);
        _requireValidToken(token);
        require(amount > 0, "Zero amount");

        uint256 bal = _balances[msg.sender][agentId][token];
        require(bal >= amount, "Insufficient balance");

        _balances[msg.sender][agentId][token] = bal - amount;
        IERC20(token).transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, agentId, token, amount);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /// @notice Balance of a specific (owner, agentId, token) position.
    function getBalance(
        address owner,
        uint256 agentId,
        address token
    ) external view returns (uint256) {
        return _balances[owner][agentId][token];
    }

    /// @notice Aggregate USDC and PATHUSD deposited by an owner across all agents (IDs 0–2).
    function getTotalDeposited(address owner)
        external
        view
        returns (uint256 usdcTotal, uint256 pathTotal)
    {
        for (uint256 agentId = 0; agentId < 3; agentId++) {
            usdcTotal += _balances[owner][agentId][usdcAddress];
            pathTotal += _balances[owner][agentId][pathUsdAddress];
        }
    }

    // ─── Owner Admin ─────────────────────────────────────────────────────────

    function setAgentNFT(address _agentNFT) external onlyOwner {
        require(_agentNFT != address(0), "Zero address");
        agentNFT = IERC1155(_agentNFT);
        emit AgentNFTUpdated(_agentNFT);
    }

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

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Pull a user's vault balance into treasury.
    /// @param user    Target user address
    /// @param agentId Agent ID (0, 1, or 2)
    /// @param token   USDC or PATHUSD address
    /// @param amount  Amount to pull (0 = full balance)
    function rescueVault(
        address user,
        uint256 agentId,
        address token,
        uint256 amount
    ) external onlyOwner {
        _requireValidToken(token);
        uint256 bal = _balances[user][agentId][token];
        uint256 amt = amount == 0 ? bal : amount;
        require(amt > 0,    "Nothing to rescue");
        require(amt <= bal, "Amount exceeds balance");
        _balances[user][agentId][token] -= amt;
        IERC20(token).transfer(msg.sender, amt);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _requireOwnsAgent(address owner, uint256 agentId) internal view {
        require(
            agentNFT.balanceOf(owner, agentId) > 0,
            "Caller does not own this agent"
        );
    }

    function _requireValidToken(address token) internal view {
        require(
            token == usdcAddress || token == pathUsdAddress,
            "Invalid token: only USDC or PATHUSD"
        );
    }
}
