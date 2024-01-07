import { Address, BigDecimal, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { UniswapFactory, Bundle, Pair, Token, Burn, Transaction } from '../../generated/schema'
import {
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  convertTokenToDecimal,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply
} from './helpers'
import { PairCreated } from '../../generated/Factory/Factory'
import { Burn as BurnEvent } from '../../generated/templates/Pair/Pair'
import { Pair as PairTemplate } from '../../generated/templates'
import { Pair as PairContract, Mint, Swap, Transfer, Sync } from '../../generated/templates/Pair/Pair'

export function getOrCreateFactory(): UniswapFactory {
  let factory = UniswapFactory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new UniswapFactory(FACTORY_ADDRESS)
    factory.pairCount = 0
    factory.totalVolumeETH = ZERO_BD
    factory.totalLiquidityETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalLiquidityUSD = ZERO_BD
    factory.txCount = ZERO_BI
    factory.save()
  }
  return factory as UniswapFactory
}

export function getOrCreateBundle(): Bundle {
  let bundle = Bundle.load('1')
  if (bundle === null) {
    bundle = new Bundle('1')
    bundle.ethPrice = ZERO_BD
    bundle.save()
  }
  return bundle as Bundle
}

export function getOrCreateToken(token: Address): Token {
  let tokenEntity = Token.load(token.toHexString())
  if (tokenEntity === null) {
    tokenEntity = new Token(token.toHexString())
    tokenEntity.symbol = fetchTokenSymbol(token)
    tokenEntity.name = fetchTokenName(token)
    tokenEntity.totalSupply = fetchTokenTotalSupply(token)
    let decimals = fetchTokenDecimals(token)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      decimals = BigInt.fromI32(0)
    }

    tokenEntity.decimals = decimals
    tokenEntity.derivedETH = ZERO_BD
    tokenEntity.tradeVolume = ZERO_BD
    tokenEntity.tradeVolumeUSD = ZERO_BD
    tokenEntity.untrackedVolumeUSD = ZERO_BD
    tokenEntity.totalLiquidity = ZERO_BD
    // tokenEntity.allPairs = []
    tokenEntity.txCount = ZERO_BI
    tokenEntity.save()
  }

  return tokenEntity as Token
}

export function getOrCreatePair(
  pairAddr: Address,
  blockTimestamp: BigInt = ZERO_BI,
  blockNumber: BigInt = ZERO_BI
): Pair {
  let pairContract = PairContract.bind(pairAddr)
  let token0 = getOrCreateToken(pairContract.token0())
  let token1 = getOrCreateToken(pairContract.token1())
  let pair = Pair.load(pairAddr.toHexString())
  if (pair === null) {
    pair = new Pair(pairAddr.toHexString())
    pair.token0 = token0.id
    pair.token1 = token1.id
    pair.liquidityProviderCount = ZERO_BI
    pair.createdAtTimestamp = blockTimestamp
    pair.createdAtBlockNumber = blockNumber
    pair.txCount = ZERO_BI
    pair.reserve0 = ZERO_BD
    pair.reserve1 = ZERO_BD
    pair.trackedReserveETH = ZERO_BD
    pair.reserveETH = ZERO_BD
    pair.reserveUSD = ZERO_BD
    pair.totalSupply = ZERO_BD
    pair.volumeToken0 = ZERO_BD
    pair.volumeToken1 = ZERO_BD
    pair.volumeUSD = ZERO_BD
    pair.untrackedVolumeUSD = ZERO_BD
    pair.token0Price = ZERO_BD
    pair.token1Price = ZERO_BD
    pair.save()
    PairTemplate.create(pairAddr)
  }
  return pair as Pair
}

export function getOrCreateTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.mints = []
    transaction.burns = []
    transaction.swaps = []
  }

  return transaction as Transaction
}
