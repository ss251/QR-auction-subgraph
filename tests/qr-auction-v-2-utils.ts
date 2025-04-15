import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AuctionBid,
  AuctionCreated,
  AuctionSettled,
  AuctionWinnerOverridden,
  DurationUpdated,
  MinBidIncrementPercentageUpdated,
  OwnershipTransferred,
  Paused,
  RefundFailed,
  ReservePriceUpdated,
  SettlerWhitelistUpdated,
  TimeBufferUpdated,
  Unpaused
} from "../generated/QRAuctionV2/QRAuctionV2"

export function createAuctionBidEvent(
  tokenId: BigInt,
  bidder: Address,
  amount: BigInt,
  extended: boolean,
  endTime: BigInt,
  urlString: string
): AuctionBid {
  let auctionBidEvent = changetype<AuctionBid>(newMockEvent())

  auctionBidEvent.parameters = new Array()

  auctionBidEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  auctionBidEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  auctionBidEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  auctionBidEvent.parameters.push(
    new ethereum.EventParam("extended", ethereum.Value.fromBoolean(extended))
  )
  auctionBidEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )
  auctionBidEvent.parameters.push(
    new ethereum.EventParam("urlString", ethereum.Value.fromString(urlString))
  )

  return auctionBidEvent
}

export function createAuctionCreatedEvent(
  tokenId: BigInt,
  startTime: BigInt,
  endTime: BigInt
): AuctionCreated {
  let auctionCreatedEvent = changetype<AuctionCreated>(newMockEvent())

  auctionCreatedEvent.parameters = new Array()

  auctionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  auctionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "startTime",
      ethereum.Value.fromUnsignedBigInt(startTime)
    )
  )
  auctionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )

  return auctionCreatedEvent
}

export function createAuctionSettledEvent(
  tokenId: BigInt,
  winner: Address,
  amount: BigInt,
  urlString: string
): AuctionSettled {
  let auctionSettledEvent = changetype<AuctionSettled>(newMockEvent())

  auctionSettledEvent.parameters = new Array()

  auctionSettledEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  auctionSettledEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner))
  )
  auctionSettledEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  auctionSettledEvent.parameters.push(
    new ethereum.EventParam("urlString", ethereum.Value.fromString(urlString))
  )

  return auctionSettledEvent
}

export function createAuctionWinnerOverriddenEvent(
  tokenId: BigInt,
  originalWinner: Address,
  newWinner: Address,
  amount: BigInt,
  refunded: boolean
): AuctionWinnerOverridden {
  let auctionWinnerOverriddenEvent =
    changetype<AuctionWinnerOverridden>(newMockEvent())

  auctionWinnerOverriddenEvent.parameters = new Array()

  auctionWinnerOverriddenEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  auctionWinnerOverriddenEvent.parameters.push(
    new ethereum.EventParam(
      "originalWinner",
      ethereum.Value.fromAddress(originalWinner)
    )
  )
  auctionWinnerOverriddenEvent.parameters.push(
    new ethereum.EventParam("newWinner", ethereum.Value.fromAddress(newWinner))
  )
  auctionWinnerOverriddenEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  auctionWinnerOverriddenEvent.parameters.push(
    new ethereum.EventParam("refunded", ethereum.Value.fromBoolean(refunded))
  )

  return auctionWinnerOverriddenEvent
}

export function createDurationUpdatedEvent(duration: BigInt): DurationUpdated {
  let durationUpdatedEvent = changetype<DurationUpdated>(newMockEvent())

  durationUpdatedEvent.parameters = new Array()

  durationUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "duration",
      ethereum.Value.fromUnsignedBigInt(duration)
    )
  )

  return durationUpdatedEvent
}

export function createMinBidIncrementPercentageUpdatedEvent(
  minBidIncrementPercentage: BigInt
): MinBidIncrementPercentageUpdated {
  let minBidIncrementPercentageUpdatedEvent =
    changetype<MinBidIncrementPercentageUpdated>(newMockEvent())

  minBidIncrementPercentageUpdatedEvent.parameters = new Array()

  minBidIncrementPercentageUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "minBidIncrementPercentage",
      ethereum.Value.fromUnsignedBigInt(minBidIncrementPercentage)
    )
  )

  return minBidIncrementPercentageUpdatedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createRefundFailedEvent(
  to: Address,
  amount: BigInt,
  reason: string
): RefundFailed {
  let refundFailedEvent = changetype<RefundFailed>(newMockEvent())

  refundFailedEvent.parameters = new Array()

  refundFailedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  refundFailedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  refundFailedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return refundFailedEvent
}

export function createReservePriceUpdatedEvent(
  reservePrice: BigInt
): ReservePriceUpdated {
  let reservePriceUpdatedEvent = changetype<ReservePriceUpdated>(newMockEvent())

  reservePriceUpdatedEvent.parameters = new Array()

  reservePriceUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "reservePrice",
      ethereum.Value.fromUnsignedBigInt(reservePrice)
    )
  )

  return reservePriceUpdatedEvent
}

export function createSettlerWhitelistUpdatedEvent(
  settler: Address,
  status: boolean
): SettlerWhitelistUpdated {
  let settlerWhitelistUpdatedEvent =
    changetype<SettlerWhitelistUpdated>(newMockEvent())

  settlerWhitelistUpdatedEvent.parameters = new Array()

  settlerWhitelistUpdatedEvent.parameters.push(
    new ethereum.EventParam("settler", ethereum.Value.fromAddress(settler))
  )
  settlerWhitelistUpdatedEvent.parameters.push(
    new ethereum.EventParam("status", ethereum.Value.fromBoolean(status))
  )

  return settlerWhitelistUpdatedEvent
}

export function createTimeBufferUpdatedEvent(
  timeBuffer: BigInt
): TimeBufferUpdated {
  let timeBufferUpdatedEvent = changetype<TimeBufferUpdated>(newMockEvent())

  timeBufferUpdatedEvent.parameters = new Array()

  timeBufferUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timeBuffer",
      ethereum.Value.fromUnsignedBigInt(timeBuffer)
    )
  )

  return timeBufferUpdatedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
