import {
  AuctionBid as AuctionBidEvent,
  AuctionCreated as AuctionCreatedEvent,
  AuctionSettled as AuctionSettledEvent,
  DurationUpdated as DurationUpdatedEvent,
  MinBidIncrementPercentageUpdated as MinBidIncrementPercentageUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  ReservePriceUpdated as ReservePriceUpdatedEvent,
  TimeBufferUpdated as TimeBufferUpdatedEvent,
  Unpaused as UnpausedEvent
} from "../generated/QRAuction/QRAuction"
import {
  AuctionBid,
  AuctionCreated,
  AuctionSettled,
  DurationUpdated,
  MinBidIncrementPercentageUpdated,
  OwnershipTransferred,
  Paused,
  ReservePriceUpdated,
  TimeBufferUpdated,
  Unpaused
} from "../generated/schema"

export function handleAuctionBid(event: AuctionBidEvent): void {
  let entity = new AuctionBid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.bidder = event.params.bidder
  entity.amount = event.params.amount
  entity.extended = event.params.extended
  entity.endTime = event.params.endTime
  entity.urlString = event.params.urlString

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuctionCreated(event: AuctionCreatedEvent): void {
  let entity = new AuctionCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.startTime = event.params.startTime
  entity.endTime = event.params.endTime

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuctionSettled(event: AuctionSettledEvent): void {
  let entity = new AuctionSettled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.winner = event.params.winner
  entity.amount = event.params.amount
  entity.urlString = event.params.urlString

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDurationUpdated(event: DurationUpdatedEvent): void {
  let entity = new DurationUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.duration = event.params.duration

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinBidIncrementPercentageUpdated(
  event: MinBidIncrementPercentageUpdatedEvent
): void {
  let entity = new MinBidIncrementPercentageUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.minBidIncrementPercentage = event.params.minBidIncrementPercentage

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReservePriceUpdated(
  event: ReservePriceUpdatedEvent
): void {
  let entity = new ReservePriceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.reservePrice = event.params.reservePrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTimeBufferUpdated(event: TimeBufferUpdatedEvent): void {
  let entity = new TimeBufferUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.timeBuffer = event.params.timeBuffer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
