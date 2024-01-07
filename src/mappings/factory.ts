/* eslint-disable prefer-const */

import { PairCreated } from '../../generated/Factory/Factory'

import { getOrCreateBundle, getOrCreateFactory, getOrCreatePair, getOrCreateToken } from './getters'

export function handleNewPair(event: PairCreated): void {
  // load factory (create if first exchange)
  let factory = getOrCreateFactory()
  factory.pairCount = factory.pairCount + 1
  factory.save()

  getOrCreateBundle()

  // create the tokens
  getOrCreateToken(event.params.token0)
  getOrCreateToken(event.params.token1)
  getOrCreatePair(event.params.pair, event.block.timestamp, event.block.number)
}
