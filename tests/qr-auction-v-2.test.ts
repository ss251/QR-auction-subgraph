import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AuctionBid } from "../generated/schema"
import { AuctionBid as AuctionBidEvent } from "../generated/QRAuctionV2/QRAuctionV2"
import { handleAuctionBid } from "../src/qr-auction-v-2"
import { createAuctionBidEvent } from "./qr-auction-v-2-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let tokenId = BigInt.fromI32(234)
    let bidder = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let extended = true
    let endTime = BigInt.fromI32(234)
    let urlString = "Example string value"
    let newAuctionBidEvent = createAuctionBidEvent(
      tokenId,
      bidder,
      amount,
      extended,
      endTime,
      urlString
    )
    handleAuctionBid(newAuctionBidEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AuctionBid created and stored", () => {
    assert.entityCount("AuctionBid", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AuctionBid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tokenId",
      "234"
    )
    assert.fieldEquals(
      "AuctionBid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "bidder",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "AuctionBid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "AuctionBid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "extended",
      "boolean Not implemented"
    )
    assert.fieldEquals(
      "AuctionBid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "endTime",
      "234"
    )
    assert.fieldEquals(
      "AuctionBid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "urlString",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
