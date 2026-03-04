import { test, expect } from 'bun:test'
import { createFiatPaymentProof, parseFiatPaymentProof } from './icip9000.ts'
import { finalizeEvent, generateSecretKey, getPublicKey } from './pure.ts'
import { FiatPaymentProof } from './kinds.ts'

test('createFiatPaymentProof: correct kind and tags', () => {
  const t = createFiatPaymentProof({
    payerPubkey: 'payer-pk',
    paymentUrl: 'https://pay.example.com/receipt/123',
    namespace: 'com.example.store',
    label: 'product-456',
  })
  expect(t.kind).toBe(FiatPaymentProof)
  expect(t.content).toBe('')
  expect(t.tags.find(t => t[0] === 'p')?.[1]).toBe('payer-pk')
  expect(t.tags.find(t => t[0] === 'r')?.[1]).toBe('https://pay.example.com/receipt/123')
  expect(t.tags.find(t => t[0] === 'L')?.[1]).toBe('com.example.store')
  expect(t.tags.find(t => t[0] === 'l')?.[1]).toBe('product-456')
})

test('parseFiatPaymentProof round-trip', () => {
  const sk = generateSecretKey()
  const pk = getPublicKey(sk)
  const event = finalizeEvent(
    createFiatPaymentProof({
      payerPubkey: 'payer',
      paymentUrl: 'https://pay.example.com/r/1',
      namespace: 'ns',
      label: 'lbl',
    }),
    sk,
  )
  const parsed = parseFiatPaymentProof(event)
  expect(parsed.payerPubkey).toBe('payer')
  expect(parsed.paymentUrl).toBe('https://pay.example.com/r/1')
  expect(parsed.signerPubkey).toBe(pk)
})
