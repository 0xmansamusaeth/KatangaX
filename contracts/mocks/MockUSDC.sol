// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev 6-decimal mock USDC for local / testnet Hardhat runs.
contract MockUSDC is ERC20 {
  uint8 private constant _DECIMALS = 6;

  constructor() ERC20("Mock USDC", "USDC") {}

  function decimals() public pure override returns (uint8) {
    return _DECIMALS;
  }

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }
}
