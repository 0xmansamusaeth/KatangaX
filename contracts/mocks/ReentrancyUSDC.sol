// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IVaultContribute {
  function contribute() external;
}

/// @dev ERC20 that attempts reentrancy on transferFrom (for tests only).
contract ReentrancyUSDC is ERC20 {
  address public vault;
  address public attacker;
  bool public reenterEnabled;
  bool private _entered;

  constructor() ERC20("Reentrancy USDC", "RUSDC") {}

  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function configure(address _vault, address _attacker) external {
    vault = _vault;
    attacker = _attacker;
  }

  function setReenterEnabled(bool enabled) external {
    reenterEnabled = enabled;
  }

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public override returns (bool) {
    bool ok = super.transferFrom(from, to, amount);
    if (
      reenterEnabled &&
      !_entered &&
      msg.sender == vault &&
      from == attacker
    ) {
      _entered = true;
      IVaultContribute(vault).contribute();
      _entered = false;
    }
    return ok;
  }
}
