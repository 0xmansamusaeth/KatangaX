// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {KatangaVault} from "./KatangaVault.sol";

/**
 * @title KatangaVaultFactory
 * @notice Deploys KatangaVault instances and indexes them by organiser and member.
 */
contract KatangaVaultFactory {
  mapping(address => address[]) public vaultsByOrganiser;
  mapping(address => address[]) public vaultsByMember;
  address[] public allVaults;

  event VaultCreated(
    address indexed vault,
    address indexed organiser,
    string vaultName
  );

  error InvalidMemberCount();
  error InvalidContributionAmount();

  /**
   * @notice Create a new vault with `msg.sender` as organiser (must be in `_members`).
   */
  function createVault(
    string memory _vaultName,
    address[] memory _members,
    uint256 _contributionAmount,
    uint256 _roundDurationDays
  ) external returns (address vault) {
    uint256 len = _members.length;
    if (len < 3 || len > 20) revert InvalidMemberCount();
    if (_contributionAmount == 0) revert InvalidContributionAmount();

    KatangaVault deployed = new KatangaVault(
      _vaultName,
      _members,
      _contributionAmount,
      msg.sender,
      _roundDurationDays
    );
    vault = address(deployed);

    vaultsByOrganiser[msg.sender].push(vault);
    allVaults.push(vault);

    for (uint256 i = 0; i < len; ) {
      vaultsByMember[_members[i]].push(vault);
      unchecked {
        ++i;
      }
    }

    emit VaultCreated(vault, msg.sender, _vaultName);
  }

  function getVaultsByMember(
    address _member
  ) external view returns (address[] memory) {
    return vaultsByMember[_member];
  }

  function getVaultsByOrganiser(
    address _organiser
  ) external view returns (address[] memory) {
    return vaultsByOrganiser[_organiser];
  }

  function getAllVaults() external view returns (address[] memory) {
    return allVaults;
  }

  function getAllVaultsLength() external view returns (uint256) {
    return allVaults.length;
  }
}
