import {
  AuctionBid as AuctionBidEvent,
  AuctionCreated as AuctionCreatedEvent,
  AuctionSettled as AuctionSettledEvent,
  AuctionWinnerOverridden as AuctionWinnerOverriddenEvent,
  BidContributionMade as BidContributionMadeEvent,
  RefundFailed as RefundFailedEvent,
  SettlerWhitelistUpdated as SettlerWhitelistUpdatedEvent,
  TimeBufferUpdated as TimeBufferUpdatedEvent,
  CreateBidReservePriceUpdated as CreateBidReservePriceUpdatedEvent,
  ContributeBidReservePriceUpdated as ContributeBidReservePriceUpdatedEvent,
  MaxExtensionTimeUpdated as MaxExtensionTimeUpdatedEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  EmergencyWithdrawal as EmergencyWithdrawalEvent
} from "../generated/QRAuctionV4/QRAuctionV4"

import {
  QRAuctionV4AuctionBid,
  QRAuctionV4AuctionCreated,
  QRAuctionV4AuctionSettled,
  QRAuctionV4AuctionWinnerOverridden,
  QRAuctionV4BidContribution,
  QRAuctionV4RefundFailed,
  QRAuctionV4SettlerWhitelistUpdated,
  QRAuctionV4TimeBufferUpdated,
  QRAuctionV4CreateBidReservePriceUpdated,
  QRAuctionV4ContributeBidReservePriceUpdated,
  QRAuctionV4MaxExtensionTimeUpdated,
  QRAuctionV4Paused,
  QRAuctionV4Unpaused,
  QRAuctionV4OwnershipTransferred,
  QRAuctionV4EmergencyWithdrawal,
  AuctionMetrics,
  Bidder,
  TrackedAuction
} from "../generated/schema"

import { Address, log, BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { QRAuctionV4 } from "../generated/QRAuctionV4/QRAuctionV4"

// V4 AuctionBid event handler - maps to V3 compatible format
export function handleAuctionBid(event: AuctionBidEvent): void {
  let entity = new QRAuctionV4AuctionBid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.tokenId = event.params.tokenId
  entity.bidder = event.params.bidder
  entity.amount = event.params.amount
  entity.extended = event.params.extended
  entity.endTime = event.params.endTime
  entity.urlString = event.params.urlString
  entity.name = event.params.name
  
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  // Update metrics (compatible with existing V3 metrics)
  updateAuctionMetrics(
    event.params.tokenId,
    event.params.bidder,
    event.params.amount,
    true, // isUsdcAuction for V4
    false, // isWinningBid - only true in settlement
    event.block.timestamp
  )
  
  log.info("V4 AuctionBid: tokenId={}, bidder={}, amount={}, urlString={}", [
    event.params.tokenId.toString(),
    event.params.bidder.toHexString(),
    event.params.amount.toString(),
    event.params.urlString
  ])
}

// V4 BidContribution event handler - NEW for group bidding
export function handleBidContributionMade(event: BidContributionMadeEvent): void {
  let entity = new QRAuctionV4BidContribution(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.tokenId = event.params.tokenId
  entity.urlString = event.params.urlString
  entity.contributor = event.params.contributor
  entity.amount = event.params.amount
  entity.totalAmount = event.params.totalAmount
  entity.extended = event.params.extended
  entity.endTime = event.params.endTime
  entity.name = event.params.name
  
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  // Update metrics for contribution
  updateAuctionMetrics(
    event.params.tokenId,
    event.params.contributor,
    event.params.amount,
    true, // isUsdcAuction
    false, // isWinningBid
    event.block.timestamp
  )
  
  log.info("V4 BidContribution: tokenId={}, contributor={}, amount={}, totalAmount={}, urlString={}", [
    event.params.tokenId.toString(),
    event.params.contributor.toHexString(),
    event.params.amount.toString(),
    event.params.totalAmount.toString(),
    event.params.urlString
  ])
}

// V4 AuctionSettled event handler - handles complex Bid struct
export function handleAuctionSettled(event: AuctionSettledEvent): void {
  let entity = new QRAuctionV4AuctionSettled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // V4 emits complex Bid struct - careful parsing required!
  const winningBid = event.params.winningBid
  
  // Debug logging for struct parsing
  log.info("V4 AuctionSettled - tokenId: {}, totalAmount: {}, urlString: {}, contributions: {}", [
    event.params.tokenId.toString(),
    winningBid.totalAmount.toString(),
    winningBid.urlString,
    winningBid.contributions.length.toString()
  ])
  
  entity.tokenId = event.params.tokenId
  entity.amount = winningBid.totalAmount
  entity.urlString = winningBid.urlString
  
  // Handle empty auction case
  if (winningBid.contributions.length == 0) {
    log.warning("V4 Auction {} settled with no contributions", [event.params.tokenId.toString()])
    entity.winner = Address.zero()
    entity.name = ""
  } else {
    // Map first contributor as winner (V3 compatibility)
    entity.winner = winningBid.contributions[0].contributor
    
    // Get contributor name from contract
    let contract = QRAuctionV4.bind(event.address)
    let nameResult = contract.try_getBidderName(Address.fromBytes(entity.winner))
    if (nameResult.reverted) {
      log.warning("Failed to get bidder name for {}", [entity.winner.toHexString()])
      entity.name = ""
    } else {
      entity.name = nameResult.value
    }
  }
  
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  // Update winning bid metrics
  if (entity.amount.gt(entity.amount.minus(entity.amount))) { // if amount > 0
    updateAuctionMetrics(
      event.params.tokenId,
      Address.fromBytes(entity.winner),
      entity.amount,
      true, // isUsdcAuction
      true, // isWinningBid
      event.block.timestamp
    )
  }
  
  log.info("V4 AuctionSettled: tokenId={}, winner={}, amount={}, urlString={}", [
    event.params.tokenId.toString(),
    entity.winner.toHexString(),
    entity.amount.toString(),
    entity.urlString
  ])
}

// V4 AuctionWinnerOverridden event handler
export function handleAuctionWinnerOverridden(event: AuctionWinnerOverriddenEvent): void {
  let entity = new QRAuctionV4AuctionWinnerOverridden(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // V4 emits complex Bid structs for both original and new winners
  const originalWinner = event.params.originalWinner
  const newWinner = event.params.newWinner
  
  entity.tokenId = event.params.tokenId
  entity.refunded = event.params.refunded
  
  // Extract first contributor addresses (V3 compatibility)
  entity.originalWinner = originalWinner.contributions.length > 0 
    ? originalWinner.contributions[0].contributor 
    : Address.zero()
  
  entity.newWinner = newWinner.contributions.length > 0 
    ? newWinner.contributions[0].contributor 
    : Address.zero()
    
  entity.amount = newWinner.totalAmount
  
  // Get new winner name from contract
  let contract = QRAuctionV4.bind(event.address)
  let nameResult = contract.try_getBidderName(Address.fromBytes(entity.newWinner))
  if (nameResult.reverted) {
    log.warning("Failed to get bidder name for new winner {}", [entity.newWinner.toHexString()])
    entity.name = ""
  } else {
    entity.name = nameResult.value
  }
  
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  log.info("V4 AuctionWinnerOverridden: tokenId={}, originalWinner={}, newWinner={}, amount={}, refunded={}", [
    event.params.tokenId.toString(),
    entity.originalWinner.toHexString(),
    entity.newWinner.toHexString(),
    entity.amount.toString(),
    entity.refunded.toString()
  ])
}

// V4 RefundFailed event handler
export function handleRefundFailed(event: RefundFailedEvent): void {
  let entity = new QRAuctionV4RefundFailed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.reason = event.params.reason
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  // Alert: Log refund failures
  log.error("REFUND FAILED: {} USDC to {} - Reason: {}", [
    event.params.amount.toString(),
    event.params.to.toHexString(),
    event.params.reason
  ])
}

// V4 AuctionCreated event handler
export function handleAuctionCreated(event: AuctionCreatedEvent): void {
  let entity = new QRAuctionV4AuctionCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.tokenId = event.params.tokenId
  entity.startTime = event.params.startTime
  entity.endTime = event.params.endTime
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  // Track new auction
  let trackedAuction = new TrackedAuction(event.params.tokenId.toString())
  trackedAuction.tokenId = event.params.tokenId
  trackedAuction.isEthAuction = false
  trackedAuction.isQrAuction = false
  trackedAuction.isUsdcAuction = true // V4 uses USDC
  trackedAuction.createdAt = event.block.timestamp
  trackedAuction.startTime = event.params.startTime
  trackedAuction.endTime = event.params.endTime
  trackedAuction.hasBiddingWar = false
  trackedAuction.totalBids = BigInt.fromI32(0)
  trackedAuction.finalMinutesBids = BigInt.fromI32(0)
  trackedAuction.save()
  
  log.info("V4 AuctionCreated: tokenId={}, startTime={}, endTime={}", [
    event.params.tokenId.toString(),
    event.params.startTime.toString(),
    event.params.endTime.toString()
  ])
}

// Standard event handlers (same as V3)
export function handleSettlerWhitelistUpdated(event: SettlerWhitelistUpdatedEvent): void {
  let entity = new QRAuctionV4SettlerWhitelistUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.settler = event.params.settler
  entity.status = event.params.status
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleTimeBufferUpdated(event: TimeBufferUpdatedEvent): void {
  let entity = new QRAuctionV4TimeBufferUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.timeBuffer = event.params.timeBuffer
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleCreateBidReservePriceUpdated(event: CreateBidReservePriceUpdatedEvent): void {
  let entity = new QRAuctionV4CreateBidReservePriceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.createBidReservePrice = event.params.createBidReservePrice
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleContributeBidReservePriceUpdated(event: ContributeBidReservePriceUpdatedEvent): void {
  let entity = new QRAuctionV4ContributeBidReservePriceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.contributeBidReservePrice = event.params.contributeBidReservePrice
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleMaxExtensionTimeUpdated(event: MaxExtensionTimeUpdatedEvent): void {
  let entity = new QRAuctionV4MaxExtensionTimeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.maxExtensionTime = event.params.maxExtensionTime
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new QRAuctionV4Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.account = event.params.account
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new QRAuctionV4Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.account = event.params.account
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let entity = new QRAuctionV4OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}

export function handleEmergencyWithdrawal(event: EmergencyWithdrawalEvent): void {
  let entity = new QRAuctionV4EmergencyWithdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  log.warning("V4 Emergency Withdrawal: {} tokens of {} to {}", [
    event.params.amount.toString(),
    event.params.token.toHexString(),
    event.params.to.toHexString()
  ])
}

// Metrics update function (compatible with existing V3 metrics)
function updateAuctionMetrics(
  tokenId: BigInt,
  bidder: Address,
  amount: BigInt,
  isUsdcAuction: boolean,
  isWinningBid: boolean,
  timestamp: BigInt
): void {
  // Load or create metrics
  let metrics = AuctionMetrics.load("global")
  if (!metrics) {
    metrics = new AuctionMetrics("global")
    metrics.totalETHBidVolume = BigInt.fromI32(0)
    metrics.totalQRBidVolume = BigInt.fromI32(0) 
    metrics.totalUSDCBidVolume = BigInt.fromI32(0)
    metrics.totalETHBidCount = BigInt.fromI32(0)
    metrics.totalQRBidCount = BigInt.fromI32(0)
    metrics.totalUSDCBidCount = BigInt.fromI32(0)
    metrics.uniqueETHBidders = BigInt.fromI32(0)
    metrics.uniqueQRBidders = BigInt.fromI32(0)
    metrics.uniqueUSDCBidders = BigInt.fromI32(0)
    metrics.totalAuctions = BigInt.fromI32(0)
    metrics.totalBids = BigInt.fromI32(0)
    metrics.bidsPerAuction = BigDecimal.fromString("0")
    metrics.totalBidsValue = BigInt.fromI32(0)
    metrics.totalUniqueBidders = BigInt.fromI32(0)
    metrics.totalETHWinningBidsValue = BigInt.fromI32(0)
    metrics.averageETHWinningBidValue = BigDecimal.fromString("0")
    metrics.totalQRWinningBidsValue = BigInt.fromI32(0)
    metrics.averageQRWinningBidValue = BigDecimal.fromString("0")
    metrics.totalUSDCWinningBidsValue = BigInt.fromI32(0)
    metrics.averageUSDCWinningBidValue = BigDecimal.fromString("0")
    metrics.biddingWarsCount = BigInt.fromI32(0)
    metrics.biddingWarsPercentage = BigDecimal.fromString("0")
    metrics.totalFinalMinutesBids = BigInt.fromI32(0)
    metrics.finalMinutesBidsPercentage = BigDecimal.fromString("0")
    metrics.lastUpdatedTimestamp = timestamp
  }
  
  if (isUsdcAuction) {
    metrics.totalUSDCBidVolume = metrics.totalUSDCBidVolume.plus(amount)
    metrics.totalUSDCBidCount = metrics.totalUSDCBidCount.plus(BigInt.fromI32(1))
    
    if (isWinningBid) {
      metrics.totalUSDCWinningBidsValue = metrics.totalUSDCWinningBidsValue.plus(amount)
      // Recalculate average (simplified)
      if (metrics.totalUSDCBidCount.gt(BigInt.fromI32(0))) {
        metrics.averageUSDCWinningBidValue = metrics.totalUSDCWinningBidsValue.divDecimal(metrics.totalUSDCBidCount.toBigDecimal())
      }
    }
  }
  
  // Update bidder tracking
  let bidderId = bidder.toHexString()
  let bidderEntity = Bidder.load(bidderId)
  if (!bidderEntity) {
    bidderEntity = new Bidder(bidderId)
    bidderEntity.address = bidder
    bidderEntity.ethBids = false
    bidderEntity.qrBids = false
    bidderEntity.usdcBids = false
    bidderEntity.firstBidTimestamp = timestamp
    bidderEntity.lastBidTimestamp = timestamp
    bidderEntity.bidCount = BigInt.fromI32(0)
  }
  
  if (isUsdcAuction) {
    if (!bidderEntity.usdcBids) {
      bidderEntity.usdcBids = true
      metrics.uniqueUSDCBidders = metrics.uniqueUSDCBidders.plus(BigInt.fromI32(1))
    }
  }
  
  bidderEntity.bidCount = bidderEntity.bidCount.plus(BigInt.fromI32(1))
  bidderEntity.lastBidTimestamp = timestamp
  bidderEntity.save()
  
  metrics.totalBids = metrics.totalBids.plus(BigInt.fromI32(1))
  metrics.totalBidsValue = metrics.totalBidsValue.plus(amount)
  metrics.lastUpdatedTimestamp = timestamp
  
  metrics.save()
}