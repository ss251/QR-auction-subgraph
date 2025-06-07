import {
  AuctionBid as AuctionBidEvent,
  AuctionCreated as AuctionCreatedEvent,
  AuctionSettled as AuctionSettledEvent,
  AuctionWinnerOverridden as AuctionWinnerOverriddenEvent,
  DurationUpdated as DurationUpdatedEvent,
  MinBidIncrementPercentageUpdated as MinBidIncrementPercentageUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  RefundFailed as RefundFailedEvent,
  ReservePriceUpdated as ReservePriceUpdatedEvent,
  SettlerWhitelistUpdated as SettlerWhitelistUpdatedEvent,
  TimeBufferUpdated as TimeBufferUpdatedEvent,
  Unpaused as UnpausedEvent,
} from "../generated/QRAuctionV3/QRAuctionV3"
import {
  QRAuctionV3AuctionBid,
  QRAuctionV3AuctionCreated,
  QRAuctionV3AuctionSettled,
  QRAuctionV3AuctionWinnerOverridden,
  QRAuctionV3DurationUpdated,
  QRAuctionV3MinBidIncrementPercentageUpdated,
  QRAuctionV3OwnershipTransferred,
  QRAuctionV3Paused,
  QRAuctionV3RefundFailed,
  QRAuctionV3ReservePriceUpdated,
  QRAuctionV3SettlerWhitelistUpdated,
  QRAuctionV3TimeBufferUpdated,
  QRAuctionV3Unpaused,
  AuctionMetrics,
  Bidder,
  TrackedAuction,
} from "../generated/schema"
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"

// Helper to convert BigInt to BigDecimal with 18 decimals precision
function convertToDecimal(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigDecimal.fromString("1000000000000000000"))
}

// Helper to safely divide BigDecimals
function safeDiv(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b.equals(BigDecimal.fromString("0"))) {
    return BigDecimal.fromString("0")
  }
  return a.div(b)
}

// Helper function to get or create AuctionMetrics entity
function getOrCreateMetrics(): AuctionMetrics {
  let metrics = AuctionMetrics.load("global")
  if (metrics == null) {
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
    metrics.lastUpdatedTimestamp = BigInt.fromI32(0)
    
    // Initialize new metrics
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
  }
  return metrics as AuctionMetrics
}

// Helper to get or create a tracked auction
function getOrCreateTrackedAuction(tokenId: BigInt, timestamp: BigInt, startTime: BigInt, endTime: BigInt): TrackedAuction {
  const auctionId = tokenId.toString()
  let auction = TrackedAuction.load(auctionId)
  
  if (auction == null) {
    auction = new TrackedAuction(auctionId)
    auction.tokenId = tokenId
    auction.isEthAuction = false
    auction.isQrAuction = false
    auction.isUsdcAuction = true  // V3 uses USDC
    auction.createdAt = timestamp
    auction.startTime = startTime
    auction.endTime = endTime
    auction.hasBiddingWar = false
    auction.totalBids = BigInt.fromI32(0)
    auction.finalMinutesBids = BigInt.fromI32(0)
    auction.save()
    
    // Update total auctions count in metrics
    let metrics = getOrCreateMetrics()
    metrics.totalAuctions = metrics.totalAuctions.plus(BigInt.fromI32(1))
    metrics.save()
  }
  
  return auction as TrackedAuction
}

export function handleAuctionBid(event: AuctionBidEvent): void {
  let entity = new QRAuctionV3AuctionBid(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.tokenId = event.params.tokenId
  entity.bidder = event.params.bidder
  entity.amount = event.params.amount
  entity.extended = event.params.extended
  entity.endTime = event.params.endTime
  entity.urlString = event.params.urlString
  entity.name = event.params.name  // V3 specific field

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update metrics - V3 uses USDC, so we'll track it as USDC volume
  let metrics = getOrCreateMetrics()
  
  // For V3, we'll track USDC bids in the QR metrics for consistency
  // since V3 replaced QR tokens with USDC
  metrics.totalUSDCBidVolume = metrics.totalUSDCBidVolume.plus(event.params.amount)
  metrics.totalUSDCBidCount = metrics.totalUSDCBidCount.plus(BigInt.fromI32(1))
  
  // Update total bids and total bids value
  metrics.totalBids = metrics.totalBids.plus(BigInt.fromI32(1))
  metrics.totalBidsValue = metrics.totalBidsValue.plus(event.params.amount)
  
  // Track unique bidders using persistent entity
  const bidderAddress = event.params.bidder.toHexString()
  let bidder = Bidder.load(bidderAddress)
  
  if (bidder == null) {
    // New bidder
    bidder = new Bidder(bidderAddress)
    bidder.address = event.params.bidder
    bidder.ethBids = false
    bidder.qrBids = false
    bidder.usdcBids = true
    bidder.firstBidTimestamp = event.block.timestamp
    bidder.lastBidTimestamp = event.block.timestamp
    bidder.bidCount = BigInt.fromI32(1)
    
    // Update metrics for unique bidders
    metrics.uniqueUSDCBidders = metrics.uniqueUSDCBidders.plus(BigInt.fromI32(1))
    metrics.totalUniqueBidders = metrics.totalUniqueBidders.plus(BigInt.fromI32(1))
  } else {
    // Existing bidder
    bidder.lastBidTimestamp = event.block.timestamp
    bidder.bidCount = bidder.bidCount.plus(BigInt.fromI32(1))
    
    // If this is the first USDC bid from this bidder
    if (!bidder.usdcBids) {
      bidder.usdcBids = true
      metrics.uniqueUSDCBidders = metrics.uniqueUSDCBidders.plus(BigInt.fromI32(1))
    }
  }
  
  bidder.save()
  
  // Update auction tracking with persistent entity
  const auctionId = event.params.tokenId.toString()
  let auction = TrackedAuction.load(auctionId)
  
  if (auction == null) {
    // This should not happen normally as auction should be created in handleAuctionCreated
    // But handle it just in case (data consistency)
    auction = new TrackedAuction(auctionId)
    auction.tokenId = event.params.tokenId
    auction.isEthAuction = false
    auction.isQrAuction = false
    auction.isUsdcAuction = true  // V3 uses USDC
    auction.createdAt = event.block.timestamp
    auction.startTime = BigInt.fromI32(0) // We don't know the start time here
    auction.endTime = event.params.endTime
    auction.hasBiddingWar = false
    auction.totalBids = BigInt.fromI32(0)
    auction.finalMinutesBids = BigInt.fromI32(0)
    
    // Update total auctions count in metrics
    metrics.totalAuctions = metrics.totalAuctions.plus(BigInt.fromI32(1))
  }
  
  // Update auction bid count
  auction.totalBids = auction.totalBids.plus(BigInt.fromI32(1))
  
  // Check if this is a bid in the final 5 minutes of an auction
  // Final 5 minutes = 300 seconds
  const FIVE_MINUTES = BigInt.fromI32(300)
  
  if (event.params.endTime.minus(event.block.timestamp).le(FIVE_MINUTES)) {
    metrics.totalFinalMinutesBids = metrics.totalFinalMinutesBids.plus(BigInt.fromI32(1))
    auction.finalMinutesBids = auction.finalMinutesBids.plus(BigInt.fromI32(1))
    
    // If this auction hasn't been counted as a bidding war yet, add it
    if (!auction.hasBiddingWar) {
      auction.hasBiddingWar = true
      metrics.biddingWarsCount = metrics.biddingWarsCount.plus(BigInt.fromI32(1))
    }
  }
  
  auction.save()
  
  // Calculate percentages and ratios
  if (!metrics.totalAuctions.isZero()) {
    metrics.biddingWarsPercentage = metrics.biddingWarsCount.toBigDecimal()
      .times(BigDecimal.fromString("100"))
      .div(metrics.totalAuctions.toBigDecimal())
    
    metrics.bidsPerAuction = metrics.totalBids.toBigDecimal()
      .div(metrics.totalAuctions.toBigDecimal())
  }
  
  if (!metrics.totalBids.isZero()) {
    metrics.finalMinutesBidsPercentage = metrics.totalFinalMinutesBids.toBigDecimal()
      .times(BigDecimal.fromString("100"))
      .div(metrics.totalBids.toBigDecimal())
  }
  
  metrics.lastUpdatedTimestamp = event.block.timestamp
  metrics.save()
}

export function handleAuctionCreated(event: AuctionCreatedEvent): void {
  let entity = new QRAuctionV3AuctionCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.tokenId = event.params.tokenId
  entity.startTime = event.params.startTime
  entity.endTime = event.params.endTime

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
  
  // Create tracked auction entity
  getOrCreateTrackedAuction(
    event.params.tokenId,
    event.block.timestamp,
    event.params.startTime,
    event.params.endTime
  )
}

export function handleAuctionSettled(event: AuctionSettledEvent): void {
  let entity = new QRAuctionV3AuctionSettled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.winner = event.params.winner
  entity.amount = event.params.amount
  entity.urlString = event.params.urlString
  entity.name = event.params.name  // V3 specific field

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
  
  // Update winning bid metrics - V3 USDC auctions
  let metrics = getOrCreateMetrics()
  
  // Get auction
  const auctionId = event.params.tokenId.toString()
  let auction = TrackedAuction.load(auctionId)
  
  if (auction) {
    // V3 uses USDC, so we'll track in QR metrics for consistency
    metrics.totalUSDCWinningBidsValue = metrics.totalUSDCWinningBidsValue.plus(event.params.amount)
    
    // For V3 auctions, we need to calculate the count based on actual V3 auctions
    // Since V3 starts from a specific token ID, we need to track this properly
    // For now, we'll use a simple approach - count all USDC auction wins
    let usdcAuctionCount = BigInt.fromI32(1)  // Start with 1 for this auction
    
    if (!usdcAuctionCount.isZero()) {
      metrics.averageUSDCWinningBidValue = metrics.totalUSDCWinningBidsValue.toBigDecimal()
        .div(usdcAuctionCount.toBigDecimal())
    }
  }
  
  metrics.lastUpdatedTimestamp = event.block.timestamp
  metrics.save()
}

export function handleAuctionWinnerOverridden(
  event: AuctionWinnerOverriddenEvent,
): void {
  let entity = new QRAuctionV3AuctionWinnerOverridden(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.tokenId = event.params.tokenId
  entity.originalWinner = event.params.originalWinner
  entity.newWinner = event.params.newWinner
  entity.amount = event.params.amount
  entity.refunded = event.params.refunded
  entity.name = event.params.name  // V3 specific field

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDurationUpdated(event: DurationUpdatedEvent): void {
  let entity = new QRAuctionV3DurationUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.duration = event.params.duration

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinBidIncrementPercentageUpdated(
  event: MinBidIncrementPercentageUpdatedEvent,
): void {
  let entity = new QRAuctionV3MinBidIncrementPercentageUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.minBidIncrementPercentage = event.params.minBidIncrementPercentage

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new QRAuctionV3OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new QRAuctionV3Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRefundFailed(event: RefundFailedEvent): void {
  let entity = new QRAuctionV3RefundFailed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReservePriceUpdated(
  event: ReservePriceUpdatedEvent,
): void {
  let entity = new QRAuctionV3ReservePriceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.reservePrice = event.params.reservePrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSettlerWhitelistUpdated(
  event: SettlerWhitelistUpdatedEvent,
): void {
  let entity = new QRAuctionV3SettlerWhitelistUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.settler = event.params.settler
  entity.status = event.params.status

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTimeBufferUpdated(event: TimeBufferUpdatedEvent): void {
  let entity = new QRAuctionV3TimeBufferUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.timeBuffer = event.params.timeBuffer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new QRAuctionV3Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
} 