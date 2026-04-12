// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentStrategy
/// @notice On-chain strategy configuration stored per agent.
///         Only the owner of the agent NFT may set/update the strategy.
contract AgentStrategy is Ownable {
    // ─── Types ────────────────────────────────────────────────────────────────

    /// @param strategyType  0=DCA, 1=Grid, 2=Momentum, 3=Arbitrage
    /// @param tokenIds      Which token IDs (0-5) this strategy trades
    /// @param maxPosition   Max position size in USD (6 decimals)
    /// @param stopLoss      Stop-loss in basis points (e.g. 500 = 5%)
    /// @param takeProfit    Take-profit in basis points (e.g. 1500 = 15%)
    /// @param frequency     Execution cadence: 0=5m,1=15m,2=30m,3=1h,4=4h,5=1d
    /// @param usePathusd    true = fund from PATHUSD vault, false = USDC vault
    /// @param active        Whether the strategy is currently running
    /// @param updatedAt     Block timestamp of last update
    struct Strategy {
        uint8   strategyType;
        uint8[] tokenIds;
        uint256 maxPosition;
        uint256 stopLoss;
        uint256 takeProfit;
        uint8   frequency;
        bool    usePathusd;
        bool    active;
        uint256 updatedAt;
    }

    // ─── State ───────────────────────────────────────────────────────────────

    IERC1155 public agentNFT;

    // agentId => Strategy
    mapping(uint256 => Strategy) private _strategies;
    // agentId => whether a strategy has ever been set
    mapping(uint256 => bool) private _hasStrategy;

    // ─── Events ──────────────────────────────────────────────────────────────

    event StrategyUpdated(
        uint256 indexed agentId,
        address indexed owner,
        uint8   strategyType,
        bool    active,
        uint256 updatedAt
    );
    event AgentNFTUpdated(address indexed newAgentNFT);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _agentNFT) Ownable(msg.sender) {
        require(_agentNFT != address(0), "AgentNFT zero address");
        agentNFT = IERC1155(_agentNFT);
    }

    // ─── Strategy Management ─────────────────────────────────────────────────

    /// @notice Set or update the strategy for an agent.
    ///         Caller must own at least 1 of the specified agent NFT.
    /// @param agentId  Agent token ID (0, 1, or 2)
    /// @param strategy Strategy configuration
    function setStrategy(uint256 agentId, Strategy calldata strategy) external {
        require(
            agentNFT.balanceOf(msg.sender, agentId) > 0,
            "Caller does not own this agent"
        );
        require(strategy.strategyType <= 3, "Invalid strategy type");
        require(strategy.frequency    <= 5, "Invalid frequency");
        require(strategy.tokenIds.length > 0, "No tokens selected");
        require(strategy.maxPosition > 0,     "Zero max position");

        // Validate token IDs
        for (uint256 i = 0; i < strategy.tokenIds.length; i++) {
            require(strategy.tokenIds[i] <= 5, "Invalid token id");
        }

        Strategy storage s = _strategies[agentId];
        s.strategyType = strategy.strategyType;
        s.tokenIds     = strategy.tokenIds;
        s.maxPosition  = strategy.maxPosition;
        s.stopLoss     = strategy.stopLoss;
        s.takeProfit   = strategy.takeProfit;
        s.frequency    = strategy.frequency;
        s.usePathusd   = strategy.usePathusd;
        s.active       = strategy.active;
        s.updatedAt    = block.timestamp;

        _hasStrategy[agentId] = true;

        emit StrategyUpdated(
            agentId,
            msg.sender,
            strategy.strategyType,
            strategy.active,
            block.timestamp
        );
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /// @notice Returns the stored strategy for an agent.
    function getStrategy(uint256 agentId)
        external
        view
        returns (Strategy memory)
    {
        return _strategies[agentId];
    }

    /// @notice Returns true if a strategy has been configured for the agent.
    function hasStrategy(uint256 agentId) external view returns (bool) {
        return _hasStrategy[agentId];
    }

    // ─── Owner Admin ─────────────────────────────────────────────────────────

    function setAgentNFT(address _agentNFT) external onlyOwner {
        require(_agentNFT != address(0), "Zero address");
        agentNFT = IERC1155(_agentNFT);
        emit AgentNFTUpdated(_agentNFT);
    }
}
