import { NostrEvent, validateEvent } from './pure.ts'

/** Events are **regular**, which means they're all expected to be stored by relays. */
export function isRegularKind(kind: number): boolean {
  return kind < 10000 && kind !== 0 && kind !== 3
}

/** Events are **replaceable**, which means that, for each combination of `pubkey` and `kind`, only the latest event is expected to (SHOULD) be stored by relays, older versions are expected to be discarded. */
export function isReplaceableKind(kind: number): boolean {
  return kind === 0 || kind === 3 || (10000 <= kind && kind < 20000)
}

/** Events are **ephemeral**, which means they are not expected to be stored by relays. */
export function isEphemeralKind(kind: number): boolean {
  return 20000 <= kind && kind < 30000
}

/** Events are **addressable**, which means that, for each combination of `pubkey`, `kind` and the `d` tag, only the latest event is expected to be stored by relays, older versions are expected to be discarded. */
export function isAddressableKind(kind: number): boolean {
  return 30000 <= kind && kind < 40000
}

/** Classification of the event kind. */
export type KindClassification = 'regular' | 'replaceable' | 'ephemeral' | 'parameterized' | 'unknown'

/** Determine the classification of this kind of event if known, or `unknown`. */
export function classifyKind(kind: number): KindClassification {
  if (isRegularKind(kind)) return 'regular'
  if (isReplaceableKind(kind)) return 'replaceable'
  if (isEphemeralKind(kind)) return 'ephemeral'
  if (isAddressableKind(kind)) return 'parameterized'
  return 'unknown'
}

export function isKind<T extends number>(event: unknown, kind: T | Array<T>): event is NostrEvent & { kind: T } {
  const kindAsArray: number[] = kind instanceof Array ? kind : [kind]
  return (validateEvent(event) && kindAsArray.includes(event.kind)) || false
}

export const Metadata = 0
export type Metadata = typeof Metadata
export const ShortTextNote = 1
export type ShortTextNote = typeof ShortTextNote
export const RecommendRelay = 2
export type RecommendRelay = typeof RecommendRelay
export const Contacts = 3
export type Contacts = typeof Contacts
export const EncryptedDirectMessage = 4
export type EncryptedDirectMessage = typeof EncryptedDirectMessage
export const EventDeletion = 5
export type EventDeletion = typeof EventDeletion
export const Repost = 6
export type Repost = typeof Repost
export const Reaction = 7
export type Reaction = typeof Reaction
export const BadgeAward = 8
export type BadgeAward = typeof BadgeAward
export const ChatMessage = 9
export type ChatMessage = typeof ChatMessage
export const ForumThread = 11
export type ForumThread = typeof ForumThread
export const Seal = 13
export type Seal = typeof Seal
export const PrivateDirectMessage = 14
export type PrivateDirectMessage = typeof PrivateDirectMessage
export const FileMessage = 15
export type FileMessage = typeof FileMessage
export const GenericRepost = 16
export type GenericRepost = typeof GenericRepost
export const Photo = 20
export type Photo = typeof Photo
export const NormalVideo = 21
export type NormalVideo = typeof NormalVideo
export const ShortVideo = 22
export type ShortVideo = typeof ShortVideo
export const ChannelCreation = 40
export type ChannelCreation = typeof ChannelCreation
export const ChannelMetadata = 41
export type ChannelMetadata = typeof ChannelMetadata
export const ChannelMessage = 42
export type ChannelMessage = typeof ChannelMessage
export const ChannelHideMessage = 43
export type ChannelHideMessage = typeof ChannelHideMessage
export const ChannelMuteUser = 44
export type ChannelMuteUser = typeof ChannelMuteUser
export const OpenTimestamps = 1040
export type OpenTimestamps = typeof OpenTimestamps
export const GiftWrap = 1059
export type GiftWrap = typeof GiftWrap
export const Poll = 1068
export type Poll = typeof Poll
export const FileMetadata = 1063
export type FileMetadata = typeof FileMetadata
export const Comment = 1111
export type Comment = typeof Comment
export const LiveChatMessage = 1311
export type LiveChatMessage = typeof LiveChatMessage
export const Voice = 1222
export type Voice = typeof Voice
export const VoiceComment = 1244
export type VoiceComment = typeof VoiceComment
export const ProblemTracker = 1971
export type ProblemTracker = typeof ProblemTracker
export const Report = 1984
export type Report = typeof Report
export const Reporting = 1984
export type Reporting = typeof Reporting
export const Label = 1985
export type Label = typeof Label
export const CommunityPostApproval = 4550
export type CommunityPostApproval = typeof CommunityPostApproval
export const JobRequest = 5999
export type JobRequest = typeof JobRequest
export const JobResult = 6999
export type JobResult = typeof JobResult
export const JobFeedback = 7000
export type JobFeedback = typeof JobFeedback
export const ZapGoal = 9041
export type ZapGoal = typeof ZapGoal
export const ZapRequest = 9734
export type ZapRequest = typeof ZapRequest
export const Zap = 9735
export type Zap = typeof Zap
export const Highlights = 9802
export type Highlights = typeof Highlights
export const PollResponse = 1018
export type PollResponse = typeof PollResponse
export const Mutelist = 10000
export type Mutelist = typeof Mutelist
export const Pinlist = 10001
export type Pinlist = typeof Pinlist
export const RelayList = 10002
export type RelayList = typeof RelayList
export const BookmarkList = 10003
export type BookmarkList = typeof BookmarkList
export const CommunitiesList = 10004
export type CommunitiesList = typeof CommunitiesList
export const PublicChatsList = 10005
export type PublicChatsList = typeof PublicChatsList
export const BlockedRelaysList = 10006
export type BlockedRelaysList = typeof BlockedRelaysList
export const SearchRelaysList = 10007
export type SearchRelaysList = typeof SearchRelaysList
export const FavoriteRelays = 10012
export type FavoriteRelays = typeof FavoriteRelays
export const InterestsList = 10015
export type InterestsList = typeof InterestsList
export const UserEmojiList = 10030
export type UserEmojiList = typeof UserEmojiList
export const DirectMessageRelaysList = 10050
export type DirectMessageRelaysList = typeof DirectMessageRelaysList
export const FileServerPreference = 10096
export type FileServerPreference = typeof FileServerPreference
export const BlossomServerList = 10063
export type BlossomServerList = typeof BlossomServerList
export const NWCWalletInfo = 13194
export type NWCWalletInfo = typeof NWCWalletInfo
export const LightningPubRPC = 21000
export type LightningPubRPC = typeof LightningPubRPC
export const ClientAuth = 22242
export type ClientAuth = typeof ClientAuth
export const NWCWalletRequest = 23194
export type NWCWalletRequest = typeof NWCWalletRequest
export const NWCWalletResponse = 23195
export type NWCWalletResponse = typeof NWCWalletResponse
export const NostrConnect = 24133
export type NostrConnect = typeof NostrConnect
export const HTTPAuth = 27235
export type HTTPAuth = typeof HTTPAuth
export const Followsets = 30000
export type Followsets = typeof Followsets
export const Genericlists = 30001
export type Genericlists = typeof Genericlists
export const Relaysets = 30002
export type Relaysets = typeof Relaysets
export const Bookmarksets = 30003
export type Bookmarksets = typeof Bookmarksets
export const Curationsets = 30004
export type Curationsets = typeof Curationsets
export const ProfileBadges = 30008
export type ProfileBadges = typeof ProfileBadges
export const BadgeDefinition = 30009
export type BadgeDefinition = typeof BadgeDefinition
export const Interestsets = 30015
export type Interestsets = typeof Interestsets
export const CreateOrUpdateStall = 30017
export type CreateOrUpdateStall = typeof CreateOrUpdateStall
export const CreateOrUpdateProduct = 30018
export type CreateOrUpdateProduct = typeof CreateOrUpdateProduct
export const LongFormArticle = 30023
export type LongFormArticle = typeof LongFormArticle
export const DraftLong = 30024
export type DraftLong = typeof DraftLong
export const Emojisets = 30030
export type Emojisets = typeof Emojisets
export const Application = 30078
export type Application = typeof Application
export const LiveEvent = 30311
export type LiveEvent = typeof LiveEvent
export const UserStatuses = 30315
export type UserStatuses = typeof UserStatuses
export const ClassifiedListing = 30402
export type ClassifiedListing = typeof ClassifiedListing
export const DraftClassifiedListing = 30403
export type DraftClassifiedListing = typeof DraftClassifiedListing
export const Date = 31922
export type Date = typeof Date
export const Time = 31923
export type Time = typeof Time
export const Calendar = 31924
export type Calendar = typeof Calendar
export const CalendarEventRSVP = 31925
export type CalendarEventRSVP = typeof CalendarEventRSVP
export const RelayReview = 31987
export type RelayReview = typeof RelayReview
export const Handlerrecommendation = 31989
export type Handlerrecommendation = typeof Handlerrecommendation
export const Handlerinformation = 31990
export type Handlerinformation = typeof Handlerinformation
export const CommunityDefinition = 34550
export type CommunityDefinition = typeof CommunityDefinition
export const GroupMetadata = 39000
export type GroupMetadata = typeof GroupMetadata

// --- ION Connect Protocol (ICIP) Event Kinds ---

/** ICIP-11000: Community token action notification (buy/sell/swap) */
export const TokenAction = 1175
export type TokenAction = typeof TokenAction
/** ICIP-3000: Join or invite to a community */
export const CommunityJoin = 1750
export type CommunityJoin = typeof CommunityJoin
/** ICIP-3000: Transfer community ownership */
export const CommunityTransfer = 1751
export type CommunityTransfer = typeof CommunityTransfer
/** ICIP-3000: Ban user from community */
export const CommunityBan = 1752
export type CommunityBan = typeof CommunityBan
/** ICIP-3000: Chronological patch to community definition */
export const CommunityChange = 1753
export type CommunityChange = typeof CommunityChange
/** ICIP-5000: Vote on a poll */
export const PollVote = 1754
export type PollVote = typeof PollVote
/** ICIP-6000: Request to receive funds/assets */
export const RequestFunds = 1755
export type RequestFunds = typeof RequestFunds
/** ICIP-6000: Notify sending of funds/assets */
export const SendNotify = 1756
export type SendNotify = typeof SendNotify
/** ICIP-17: Block a user */
export const BlockUser = 1757
export type BlockUser = typeof BlockUser
/** ICIP-9000: Fiat payment proof */
export const FiatPaymentProof = 1758
export type FiatPaymentProof = typeof FiatPaymentProof
/** ICIP-2001: Affiliation request between users */
export const AffiliationRequest = 1759
export type AffiliationRequest = typeof AffiliationRequest
/** ICIP-17: Archive a conversation */
export const ArchiveConversation = 2175
export type ArchiveConversation = typeof ArchiveConversation
/** ICIP-17: Mute a user */
export const MuteUser = 3175
export type MuteUser = typeof MuteUser
/** ICIP-11000: User consent for token activity display */
export const ActivityConsent = 4175
export type ActivityConsent = typeof ActivityConsent
/** ICIP-5175: DVM job request — hashtag statistics */
export const DVMHashtagStats = 5175
export type DVMHashtagStats = typeof DVMHashtagStats
/** ICIP-5176: DVM job request — price changes for tokenized communities */
export const DVMPriceChanges = 5176
export type DVMPriceChanges = typeof DVMPriceChanges
/** ICIP-5177: DVM job request — global token statistics */
export const DVMTokenStats = 5177
export type DVMTokenStats = typeof DVMTokenStats
/** ICIP-5178: DVM job request — buying activity inspection */
export const DVMBuyingActivity = 5178
export type DVMBuyingActivity = typeof DVMBuyingActivity
/** ICIP-5175: DVM response — hashtag statistics */
export const DVMHashtagStatsResponse = 6175
export type DVMHashtagStatsResponse = typeof DVMHashtagStatsResponse
/** ICIP-5176: DVM response — price changes */
export const DVMPriceChangesResponse = 6176
export type DVMPriceChangesResponse = typeof DVMPriceChangesResponse
/** ICIP-5177: DVM response — global token statistics */
export const DVMTokenStatsResponse = 6177
export type DVMTokenStatsResponse = typeof DVMTokenStatsResponse
/** ICIP-5178: DVM response — buying activity */
export const DVMBuyingActivityResponse = 6178
export type DVMBuyingActivityResponse = typeof DVMBuyingActivityResponse
/** DVM: Count response */
export const DVMCountResponse = 6400
export type DVMCountResponse = typeof DVMCountResponse
/** ICIP-2000: On-behalf-of attestation list */
export const OnBehalfAttestations = 10100
export type OnBehalfAttestations = typeof OnBehalfAttestations
/** ICIP-51: E2EE chats and communities list */
export const ChatsList = 11750
export type ChatsList = typeof ChatsList
/** ICIP-01: ION relay list metadata */
export const IONRelayList = 20002
export type IONRelayList = typeof IONRelayList
/** ICIP-01: Ephemeral event embed (runtime context) */
export const EphemeralEventEmbed = 21750
export type EphemeralEventEmbed = typeof EphemeralEventEmbed
/** ICIP-17: Modifiable direct message (addressable) */
export const ModifiableDirectMessage = 30014
export type ModifiableDirectMessage = typeof ModifiableDirectMessage
/** ICIP-01: Modifiable note (addressable) */
export const ModifiableNote = 30175
export type ModifiableNote = typeof ModifiableNote
/** ICIP-11000: Community token definition */
export const CommunityTokenDefinition = 31175
export type CommunityTokenDefinition = typeof CommunityTokenDefinition
/** ICIP-3000: Community definition */
export const IONCommunityDefinition = 31750
export type IONCommunityDefinition = typeof IONCommunityDefinition
/** ICIP-8000: Device token registration for push notifications */
export const DeviceRegistration = 31751
export type DeviceRegistration = typeof DeviceRegistration
/** ICIP-01: Story note (expiring content) */
export const StoryNote = 57103
export type StoryNote = typeof StoryNote
