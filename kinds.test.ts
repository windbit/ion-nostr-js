import { expect, test } from 'bun:test'
import { classifyKind, isKind, Repost, ShortTextNote } from './kinds.ts'
import * as kinds from './kinds.ts'
import { finalizeEvent, generateSecretKey } from './pure.ts'

test('kind classification', () => {
  expect(classifyKind(1)).toBe('regular')
  expect(classifyKind(5)).toBe('regular')
  expect(classifyKind(6)).toBe('regular')
  expect(classifyKind(7)).toBe('regular')
  expect(classifyKind(1000)).toBe('regular')
  expect(classifyKind(9999)).toBe('regular')
  expect(classifyKind(0)).toBe('replaceable')
  expect(classifyKind(3)).toBe('replaceable')
  expect(classifyKind(10000)).toBe('replaceable')
  expect(classifyKind(19999)).toBe('replaceable')
  expect(classifyKind(20000)).toBe('ephemeral')
  expect(classifyKind(29999)).toBe('ephemeral')
  expect(classifyKind(30000)).toBe('parameterized')
  expect(classifyKind(39999)).toBe('parameterized')
  expect(classifyKind(40000)).toBe('unknown')
  expect(classifyKind(255)).toBe('regular')
})

test('ION regular kinds classify correctly', () => {
  const ionRegularKinds = [
    kinds.TokenAction, kinds.CommunityJoin, kinds.CommunityTransfer,
    kinds.CommunityBan, kinds.CommunityChange, kinds.PollVote,
    kinds.RequestFunds, kinds.SendNotify, kinds.BlockUser,
    kinds.FiatPaymentProof, kinds.AffiliationRequest,
    kinds.ArchiveConversation, kinds.MuteUser, kinds.ActivityConsent,
    kinds.DVMHashtagStats, kinds.DVMPriceChanges, kinds.DVMTokenStats, kinds.DVMBuyingActivity,
    kinds.DVMHashtagStatsResponse, kinds.DVMPriceChangesResponse,
    kinds.DVMTokenStatsResponse, kinds.DVMBuyingActivityResponse,
    kinds.DVMCountResponse,
  ]
  for (const k of ionRegularKinds) {
    expect(classifyKind(k)).toBe('regular')
  }
})

test('ION replaceable kinds classify correctly', () => {
  expect(classifyKind(kinds.OnBehalfAttestations)).toBe('replaceable')
  expect(classifyKind(kinds.ChatsList)).toBe('replaceable')
})

test('ION ephemeral kinds classify correctly', () => {
  expect(classifyKind(kinds.IONRelayList)).toBe('ephemeral')
  expect(classifyKind(kinds.EphemeralEventEmbed)).toBe('ephemeral')
})

test('ION addressable kinds classify correctly', () => {
  expect(classifyKind(kinds.ModifiableDirectMessage)).toBe('parameterized')
  expect(classifyKind(kinds.ModifiableNote)).toBe('parameterized')
  expect(classifyKind(kinds.CommunityTokenDefinition)).toBe('parameterized')
  expect(classifyKind(kinds.IONCommunityDefinition)).toBe('parameterized')
  expect(classifyKind(kinds.DeviceRegistration)).toBe('parameterized')
})

test('ION StoryNote classifies as unknown (kind > 39999)', () => {
  expect(classifyKind(kinds.StoryNote)).toBe('unknown')
})

test('ION kind values are correct', () => {
  expect(kinds.TokenAction).toBe(1175)
  expect(kinds.CommunityJoin).toBe(1750)
  expect(kinds.CommunityTransfer).toBe(1751)
  expect(kinds.CommunityBan).toBe(1752)
  expect(kinds.CommunityChange).toBe(1753)
  expect(kinds.PollVote).toBe(1754)
  expect(kinds.RequestFunds).toBe(1755)
  expect(kinds.SendNotify).toBe(1756)
  expect(kinds.BlockUser).toBe(1757)
  expect(kinds.FiatPaymentProof).toBe(1758)
  expect(kinds.AffiliationRequest).toBe(1759)
  expect(kinds.ArchiveConversation).toBe(2175)
  expect(kinds.MuteUser).toBe(3175)
  expect(kinds.ActivityConsent).toBe(4175)
  expect(kinds.DVMHashtagStats).toBe(5175)
  expect(kinds.DVMPriceChanges).toBe(5176)
  expect(kinds.DVMTokenStats).toBe(5177)
  expect(kinds.DVMBuyingActivity).toBe(5178)
  expect(kinds.DVMHashtagStatsResponse).toBe(6175)
  expect(kinds.DVMPriceChangesResponse).toBe(6176)
  expect(kinds.DVMTokenStatsResponse).toBe(6177)
  expect(kinds.DVMBuyingActivityResponse).toBe(6178)
  expect(kinds.DVMCountResponse).toBe(6400)
  expect(kinds.OnBehalfAttestations).toBe(10100)
  expect(kinds.ChatsList).toBe(11750)
  expect(kinds.IONRelayList).toBe(20002)
  expect(kinds.EphemeralEventEmbed).toBe(21750)
  expect(kinds.ModifiableDirectMessage).toBe(30014)
  expect(kinds.ModifiableNote).toBe(30175)
  expect(kinds.CommunityTokenDefinition).toBe(31175)
  expect(kinds.IONCommunityDefinition).toBe(31750)
  expect(kinds.DeviceRegistration).toBe(31751)
  expect(kinds.StoryNote).toBe(57103)
})

test('kind type guard', () => {
  const privateKey = generateSecretKey()
  const repostedEvent = finalizeEvent(
    {
      kind: ShortTextNote,
      tags: [
        ['e', 'replied event id'],
        ['p', 'replied event pubkey'],
      ],
      content: 'Replied to a post',
      created_at: 1617932115,
    },
    privateKey,
  )

  expect(isKind(repostedEvent, ShortTextNote)).toBeTrue()
  expect(isKind(repostedEvent, Repost)).toBeFalse()
})
