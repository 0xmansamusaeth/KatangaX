// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title KatangaVault
 * @notice On-chain ROSCA vault for a fixed member set. Holds USDC on Base, collects
 *         per-round contributions, and disburses the pot to the round recipient after
 *         >= 3 member signatures approve the disbursement hash.
 */
contract KatangaVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

  /// @notice Base mainnet USDC (6 decimals).
  address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

  uint256 public constant MIN_APPROVALS = 3;
  uint256 public constant MIN_MEMBERS = 3;
  uint256 public constant MAX_MEMBERS = 20;

  IERC20 public immutable usdc;

  address public organiser;
  string public vaultName;
  uint256 public contributionAmount;
  uint256 public totalMembers;
  uint256 public currentRound;
  uint256 public totalRounds;
  uint256 public roundDeadline;
  uint256 public roundDurationDays;
  bool public isActive;

  address[] public members;

  struct RoundInfo {
    uint256 roundNumber;
    address recipient;
    uint256 amount;
    bool disbursed;
    uint256 approvalCount;
    bytes32 disbursementHash;
    mapping(address => bool) hasApproved;
  }

  mapping(address => bool) public isMember;
  mapping(address => bool) public hasReceivedPayout;
  mapping(uint256 => RoundInfo) private _rounds;

  mapping(address => uint256) public contributionsMade;
  mapping(address => bool) public paidThisRound;

  event VaultCreated(
    string name,
    address indexed organiser,
    uint256 members,
    uint256 amount
  );
  event ContributionMade(
    address indexed member,
    uint256 indexed round,
    uint256 amount
  );
  event RoundFullyFunded(
    uint256 indexed round,
    bytes32 disbursementHash
  );
  event DisbursementApproved(
    address indexed approver,
    uint256 indexed round,
    uint256 approvalCount
  );
  event PayoutDisbursed(
    address indexed recipient,
    uint256 indexed round,
    uint256 amount
  );
  event MemberAdded(address indexed member);
  event RoundAdvanced(
    uint256 indexed newRound,
    address indexed nextRecipient
  );
  event VaultCompleted();

  error NotMember();
  error VaultInactive();
  error AlreadyPaidThisRound();
  error InvalidRound();
  error RoundAlreadyDisbursed();
  error DisbursementNotReady();
  error AlreadyApproved();
  error InvalidSignature();
  error InvalidMemberCount();
  error InvalidContributionAmount();
  error OrganiserNotMember();
  error RoundNotFunded();

  modifier onlyMember() {
    if (!isMember[msg.sender]) revert NotMember();
    _;
  }

  modifier onlyActive() {
    if (!isActive) revert VaultInactive();
    _;
  }

  /**
   * @param _vaultName Human-readable vault label.
   * @param _members Ordered payout list (index 0 receives round 1). Length 3–20.
   * @param _contributionAmount Per-member USDC amount per round (6 decimals).
   * @param _organiser Must be included in `_members`.
   * @param _roundDurationDays Days until each round deadline (from advance / deploy).
   */
  constructor(
    string memory _vaultName,
    address[] memory _members,
    uint256 _contributionAmount,
    address _organiser,
    uint256 _roundDurationDays
  ) {
    uint256 len = _members.length;
    if (len < MIN_MEMBERS || len > MAX_MEMBERS) {
      revert InvalidMemberCount();
    }
    if (_contributionAmount == 0) revert InvalidContributionAmount();

    bool organiserFound;
    for (uint256 i = 0; i < len; ) {
      address m = _members[i];
      if (m == address(0)) revert InvalidMemberCount();
      if (m == _organiser) organiserFound = true;
      isMember[m] = true;
      members.push(m);
      unchecked {
        ++i;
      }
    }
    if (!organiserFound) revert OrganiserNotMember();

    usdc = IERC20(USDC);
    vaultName = _vaultName;
    organiser = _organiser;
    contributionAmount = _contributionAmount;
    totalMembers = len;
    currentRound = 1;
    totalRounds = len;
    roundDurationDays = _roundDurationDays;
    isActive = true;
    roundDeadline = block.timestamp + (_roundDurationDays * 1 days);

    uint256 pot = _contributionAmount * len;
    RoundInfo storage r = _rounds[1];
    r.roundNumber = 1;
    r.recipient = _members[0];
    r.amount = pot;

    emit VaultCreated(_vaultName, _organiser, len, _contributionAmount);
  }

  /**
   * @notice Pay this round's contribution in USDC. Caller must have approved the vault.
   */
  function contribute() external onlyMember onlyActive nonReentrant {
    if (paidThisRound[msg.sender]) revert AlreadyPaidThisRound();

    usdc.safeTransferFrom(msg.sender, address(this), contributionAmount);

    paidThisRound[msg.sender] = true;
    contributionsMade[msg.sender] += contributionAmount;

    emit ContributionMade(msg.sender, currentRound, contributionAmount);

    _checkRoundComplete();
  }

  /**
   * @notice Approve disbursement for a funded round. Sign `disbursementHash` with EIP-191
   *         (e.g. ethers `signMessage(ethers.getBytes(disbursementHash))`).
   */
  function approveDisbursement(
    uint256 _round,
    bytes memory _signature
  ) external onlyMember onlyActive nonReentrant {
    RoundInfo storage round = _rounds[_round];
    if (_round == 0 || _round > totalRounds) revert InvalidRound();
    if (round.disbursed) revert RoundAlreadyDisbursed();
    if (round.disbursementHash == bytes32(0)) revert DisbursementNotReady();
    if (round.hasApproved[msg.sender]) revert AlreadyApproved();

    bytes32 digest = ECDSA.toEthSignedMessageHash(round.disbursementHash);
    address signer = ECDSA.recover(digest, _signature);
    if (signer != msg.sender || !isMember[signer]) revert InvalidSignature();

    round.hasApproved[msg.sender] = true;
    round.approvalCount += 1;

    emit DisbursementApproved(msg.sender, _round, round.approvalCount);

    if (round.approvalCount >= MIN_APPROVALS) {
      _disburse(_round);
    }
  }

  function getVaultStatus()
    external
    view
    returns (
      string memory name,
      address vaultOrganiser,
      bool active,
      uint256 round,
      uint256 roundsTotal,
      uint256 perMemberContribution,
      uint256 memberCount,
      address roundRecipient,
      uint256 roundApprovals,
      bool roundDisbursed,
      uint256 usdcBalance
    )
  {
    RoundInfo storage r = _rounds[currentRound];
    return (
      vaultName,
      organiser,
      isActive,
      currentRound,
      totalRounds,
      contributionAmount,
      totalMembers,
      r.recipient,
      r.approvalCount,
      r.disbursed,
      usdc.balanceOf(address(this))
    );
  }

  function getMemberStatus(
    address _member
  )
    external
    view
    returns (
      bool member,
      bool paid,
      bool receivedPayout,
      uint256 totalContributed,
      bool approvedCurrentRound
    )
  {
    return (
      isMember[_member],
      paidThisRound[_member],
      hasReceivedPayout[_member],
      contributionsMade[_member],
      _rounds[currentRound].hasApproved[_member]
    );
  }

  function getMembers() external view returns (address[] memory) {
    return members;
  }

  function getRoundInfo(
    uint256 _round
  )
    external
    view
    returns (
      address recipient,
      uint256 amount,
      bool disbursed,
      uint256 approvalCount,
      bytes32 disbursementHash
    )
  {
    if (_round == 0 || _round > totalRounds) revert InvalidRound();
    RoundInfo storage r = _rounds[_round];
    return (
      r.recipient,
      r.amount,
      r.disbursed,
      r.approvalCount,
      r.disbursementHash
    );
  }

  function getDisbursementHash(uint256 _round) external view returns (bytes32) {
    if (_round == 0 || _round > totalRounds) revert InvalidRound();
    return _rounds[_round].disbursementHash;
  }

  function _checkRoundComplete() internal {
    uint256 paid;
    uint256 len = members.length;
    for (uint256 i = 0; i < len; ) {
      if (paidThisRound[members[i]]) {
        unchecked {
          ++paid;
        }
      }
      unchecked {
        ++i;
      }
    }

    if (paid != len) return;

    RoundInfo storage round = _rounds[currentRound];
    if (round.disbursementHash != bytes32(0)) return;

    bytes32 hash = keccak256(
      abi.encodePacked(currentRound, round.recipient, address(this))
    );
    round.disbursementHash = hash;

    emit RoundFullyFunded(currentRound, hash);
  }

  function _disburse(uint256 _round) internal {
    RoundInfo storage round = _rounds[_round];
    if (round.disbursed) revert RoundAlreadyDisbursed();

    round.disbursed = true;
    address recipient = round.recipient;
    uint256 amount = round.amount;

    usdc.safeTransfer(recipient, amount);
    hasReceivedPayout[recipient] = true;

    emit PayoutDisbursed(recipient, _round, amount);

    _advanceRound();
  }

  function _advanceRound() internal {
    uint256 len = members.length;
    for (uint256 i = 0; i < len; ) {
      paidThisRound[members[i]] = false;
      unchecked {
        ++i;
      }
    }

    if (currentRound == totalRounds) {
      isActive = false;
      emit VaultCompleted();
      return;
    }

    currentRound += 1;
    roundDeadline = block.timestamp + (roundDurationDays * 1 days);

    address nextRecipient = members[currentRound - 1];
    uint256 pot = contributionAmount * totalMembers;

    RoundInfo storage next = _rounds[currentRound];
    next.roundNumber = currentRound;
    next.recipient = nextRecipient;
    next.amount = pot;

    emit RoundAdvanced(currentRound, nextRecipient);
  }
}
