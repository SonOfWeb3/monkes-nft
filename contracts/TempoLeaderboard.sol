// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TempoLeaderboard
/// @notice On-chain leaderboard tracking per-agent performance.
///         Stats are pushed by a trusted keeper address (off-chain aggregator).
contract TempoLeaderboard is Ownable {
    // ─── Types ────────────────────────────────────────────────────────────────

    struct AgentStats {
        uint256 agentId;
        address owner;
        int256  pnlUsd;       // 6 decimals, can be negative
        uint256 pnlBps;       // absolute P&L in basis points
        uint256 tradeCount;
        uint256 winCount;
        uint256 tvl;          // current vault TVL in USD (6 decimals)
        uint256 lastUpdated;
    }

    // ─── State ───────────────────────────────────────────────────────────────

    address public keeper;

    // agentId => stats
    mapping(uint256 => AgentStats) private _stats;
    // list of all agent IDs that have ever been submitted
    uint256[] private _agentIds;
    // agentId => index in _agentIds + 1 (0 = not present)
    mapping(uint256 => uint256) private _agentIndex;

    // ─── Events ──────────────────────────────────────────────────────────────

    event StatsUpdated(
        uint256 indexed agentId,
        address indexed owner,
        int256  pnlUsd,
        uint256 pnlBps,
        uint256 tradeCount,
        uint256 winCount,
        uint256 tvl,
        uint256 updatedAt
    );
    event KeeperUpdated(address indexed newKeeper);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _keeper) Ownable(msg.sender) {
        require(_keeper != address(0), "Keeper zero address");
        keeper = _keeper;
    }

    // ─── Keeper Functions ────────────────────────────────────────────────────

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    /// @notice Push updated stats for an agent.
    function updateStats(
        uint256 agentId,
        address agentOwner,
        int256  pnlUsd,
        uint256 pnlBps,
        uint256 tradeCount,
        uint256 winCount,
        uint256 tvl
    ) external onlyKeeper {
        require(agentOwner != address(0), "Zero owner");

        if (_agentIndex[agentId] == 0) {
            _agentIds.push(agentId);
            _agentIndex[agentId] = _agentIds.length; // store 1-based index
        }

        _stats[agentId] = AgentStats({
            agentId:     agentId,
            owner:       agentOwner,
            pnlUsd:      pnlUsd,
            pnlBps:      pnlBps,
            tradeCount:  tradeCount,
            winCount:    winCount,
            tvl:         tvl,
            lastUpdated: block.timestamp
        });

        emit StatsUpdated(agentId, agentOwner, pnlUsd, pnlBps, tradeCount, winCount, tvl, block.timestamp);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /// @notice Returns up to `count` top agents sorted by pnlUsd descending.
    ///         Sorting is O(n^2) — suitable for small leaderboards (≤ a few hundred).
    function getTopAgents(uint256 count)
        external
        view
        returns (AgentStats[] memory)
    {
        uint256 total = _agentIds.length;
        if (count > total) count = total;

        // Copy all stats into a memory array
        AgentStats[] memory all = new AgentStats[](total);
        for (uint256 i = 0; i < total; i++) {
            all[i] = _stats[_agentIds[i]];
        }

        // Bubble sort descending by pnlUsd
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < total; j++) {
                if (all[j].pnlUsd > all[i].pnlUsd) {
                    AgentStats memory tmp = all[i];
                    all[i] = all[j];
                    all[j] = tmp;
                }
            }
        }

        // Slice to requested count
        AgentStats[] memory result = new AgentStats[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = all[i];
        }
        return result;
    }

    /// @notice Returns stats for a specific agent.
    function getAgentStats(uint256 agentId)
        external
        view
        returns (AgentStats memory)
    {
        return _stats[agentId];
    }

    /// @notice Aggregate platform statistics.
    function getTotalStats()
        external
        view
        returns (uint256 totalTvl, uint256 totalTrades, uint256 uniqueAgents)
    {
        uniqueAgents = _agentIds.length;
        for (uint256 i = 0; i < uniqueAgents; i++) {
            AgentStats storage s = _stats[_agentIds[i]];
            totalTvl    += s.tvl;
            totalTrades += s.tradeCount;
        }
    }

    // ─── Owner Admin ─────────────────────────────────────────────────────────

    /// @notice Assign a new keeper address.
    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "Zero address");
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }
}
