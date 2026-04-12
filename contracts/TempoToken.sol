// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TempoToken
/// @notice Standard ERC20 with capped supply and owner-controlled minting.
///         Deployed once per trading token (APEX, NOVA, FLUX, IRIS, CORE, ECHO).
///         The presale contract (TokenPresale) should be set as owner after deployment.
contract TempoToken is ERC20, Ownable {
    // ─── State ───────────────────────────────────────────────────────────────

    uint256 public immutable maxSupply;

    // ─── Events ──────────────────────────────────────────────────────────────

    event Minted(address indexed to, uint256 amount);

    // ─── Constructor ─────────────────────────────────────────────────────────

    /// @param name_      Token name (e.g. "Apex Protocol")
    /// @param symbol_    Token symbol (e.g. "APEX")
    /// @param _maxSupply Maximum total supply (in wei, 18 decimals recommended)
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 _maxSupply
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(_maxSupply > 0, "Zero max supply");
        maxSupply = _maxSupply;
    }

    // ─── Minting ─────────────────────────────────────────────────────────────

    /// @notice Mint tokens to a recipient. Only callable by owner (presale contract).
    /// @param to     Recipient address
    /// @param amount Amount to mint (18 decimals)
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0),                        "Mint to zero address");
        require(totalSupply() + amount <= maxSupply,     "Exceeds max supply");
        _mint(to, amount);
        emit Minted(to, amount);
    }
}
