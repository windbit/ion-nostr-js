import { test, expect } from 'bun:test'
import { createRequestFunds, createSendNotify, parseBlockchainEvent } from './icip6000.ts'
import { RequestFunds, SendNotify } from './kinds.ts'

test('createRequestFunds: correct kind and tags', () => {
  const t = createRequestFunds({
    recipientPubkey: 'recip',
    network: 'ethereum',
    assetClass: 'ERC20',
  })
  expect(t.kind).toBe(RequestFunds)
  expect(t.tags.find(t => t[0] === 'network')?.[1]).toBe('ethereum')
  expect(t.tags.find(t => t[0] === 'asset_class')?.[1]).toBe('ERC20')
})

test('createSendNotify: correct kind and tags', () => {
  const t = createSendNotify({
    recipientPubkey: 'recip',
    network: 'ion',
    txHash: '0xabc123',
    txUrl: 'https://explorer.ion.io/tx/0xabc123',
  })
  expect(t.kind).toBe(SendNotify)
  expect(t.tags.find(t => t[0] === 'tx_hash')?.[1]).toBe('0xabc123')
  expect(t.tags.find(t => t[0] === 'tx_url')?.[1]).toBe('https://explorer.ion.io/tx/0xabc123')
})

test('parseBlockchainEvent: extracts all fields', () => {
  const t = createSendNotify({
    recipientPubkey: 'recip',
    network: 'ion',
    txHash: '0xdef',
  })
  const event = { ...t, pubkey: 'pk', id: 'id', sig: 'sig' }
  const parsed = parseBlockchainEvent(event as any)
  expect(parsed.recipientPubkey).toBe('recip')
  expect(parsed.network).toBe('ion')
  expect(parsed.txHash).toBe('0xdef')
})
