/**
 * Firebase Cloud Functions Client
 *
 * Typed wrappers around Firebase callable Cloud Functions.
 * Each function returns a clean result type, matching the auth service pattern.
 */

import functions from '@react-native-firebase/functions';

// ============================================
// Types
// ============================================

interface ValidateUsernameResult {
  available: boolean;
  error?: string;
}

interface MigrateLocalDataInput {
  rideLogs?: Array<{
    id: string;
    coasterId: string;
    coasterName: string;
    parkName: string;
    timestamp: string;
    seat: { row: string; position: string } | null;
    rideCount: number;
    notes: string | null;
  }>;
  ratings?: Array<{
    coasterId: string;
    coasterName: string;
    parkName: string;
    criteriaRatings: Record<string, number>;
    weightedScore: number;
    notes: string | null;
  }>;
  criteriaConfig?: {
    criteria: Array<{
      id: string;
      name: string;
      icon: string;
      weight: number;
      isLocked: boolean;
    }>;
    hasCompletedSetup: boolean;
    lastModifiedAt: string;
  };
  settings?: {
    displayName?: string;
    homeParkName?: string;
    riderType?: string;
  };
}

interface MigrateLocalDataResult {
  migrated: {
    logs: number;
    ratings: number;
    tickets: number;
  };
}

interface OnUserCreatedResult {
  created: boolean;
  message: string;
}

// ============================================
// Cloud Function Callers
// ============================================

/**
 * Call the onUserCreated Cloud Function to ensure the user doc exists
 * in Firestore after auth signup. This is a safety net — the client
 * should also attempt to create the doc directly, but this CF handles
 * race conditions and ensures the doc schema is correct.
 *
 * Call this immediately after a successful signUp/signIn for new users.
 */
async function callOnUserCreated(): Promise<OnUserCreatedResult> {
  try {
    const callable = functions().httpsCallable('onUserCreated');
    const result = await callable({});
    return result.data as OnUserCreatedResult;
  } catch (error) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      const fnError = error as { code: string; message: string };
      console.error('[onUserCreated] Failed:', fnError.message);
    }
    // Non-fatal: client-side doc creation is the primary path
    return { created: false, message: 'Cloud function call failed' };
  }
}

/**
 * Call the validateUsername Cloud Function to atomically check availability
 * and reserve a username. Handles format validation, reserved words, and
 * uniqueness check in a Firestore transaction.
 *
 * Returns { available: true } on success.
 * Returns { available: false, error: '...' } on failure.
 */
async function callValidateUsername(
  username: string,
): Promise<ValidateUsernameResult> {
  try {
    const callable = functions().httpsCallable('validateUsername');
    const result = await callable({ username });
    return result.data as ValidateUsernameResult;
  } catch (error) {
    // Firebase Functions errors have a code and message
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      const fnError = error as { code: string; message: string };
      return { available: false, error: fnError.message };
    }
    return { available: false, error: 'Failed to validate username.' };
  }
}

/**
 * Call the migrateLocalData Cloud Function to upload locally-stored
 * ride logs, ratings, criteria config, and settings to Firestore.
 *
 * Called once on first authentication to migrate existing local data.
 * Returns counts of migrated items.
 */
async function callMigrateLocalData(
  data: MigrateLocalDataInput,
): Promise<MigrateLocalDataResult> {
  try {
    const callable = functions().httpsCallable('migrateLocalData');
    const result = await callable(data);
    return result.data as MigrateLocalDataResult;
  } catch (error) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      const fnError = error as { code: string; message: string };
      console.error('[migrateLocalData] Failed:', fnError.message);
    }
    throw error;
  }
}

// ============================================
// Phase 2: Friend Operations
// ============================================

interface SendFriendRequestInput {
  targetUserId: string;
}

interface AcceptFriendRequestInput {
  requestId: string;
}

interface DeclineFriendRequestInput {
  requestId: string;
}

interface RemoveFriendInput {
  friendId: string;
}

async function callSendFriendRequest(
  data: SendFriendRequestInput,
): Promise<void> {
  const callable = functions().httpsCallable('sendFriendRequest');
  await callable(data);
}

async function callAcceptFriendRequest(
  data: AcceptFriendRequestInput,
): Promise<void> {
  const callable = functions().httpsCallable('acceptFriendRequest');
  await callable(data);
}

async function callDeclineFriendRequest(
  data: DeclineFriendRequestInput,
): Promise<void> {
  const callable = functions().httpsCallable('declineFriendRequest');
  await callable(data);
}

async function callRemoveFriend(data: RemoveFriendInput): Promise<void> {
  const callable = functions().httpsCallable('removeFriend');
  await callable(data);
}

// ============================================
// Phase 2: Account Management
// ============================================

interface DeleteAccountResult {
  deleted: boolean;
}

async function callDeleteUserAccount(): Promise<DeleteAccountResult> {
  const callable = functions().httpsCallable('deleteUserAccount');
  const result = await callable({ confirmation: 'DELETE' });
  return result.data as DeleteAccountResult;
}

// ============================================
// Phase 2: Export
// ============================================

interface ExportRideLogInput {
  format: 'csv' | 'json';
  dateRange?: {
    start: string;
    end: string;
  };
}

interface ExportRideLogResult {
  downloadUrl: string;
  expiresAt: string;
  recordCount: number;
}

async function callExportRideLog(
  data: ExportRideLogInput,
): Promise<ExportRideLogResult> {
  const callable = functions().httpsCallable('exportRideLog');
  const result = await callable(data);
  return result.data as ExportRideLogResult;
}

// ============================================
// Phase 2: Notifications
// ============================================

async function callRegisterFCMToken(token: string): Promise<void> {
  const callable = functions().httpsCallable('registerFCMToken');
  await callable({ token });
}

// ============================================
// Phase 3: Premium (IAP)
// ============================================

interface VerifyPurchaseInput {
  receipt: string;
  productId: string;
}

interface ProStatus {
  active: boolean;
  tier: string | null;
  expiresAt: string | null;
  platform: 'ios' | null;
}

interface VerifyPurchaseResult {
  verified: boolean;
  proStatus: ProStatus;
}

async function callVerifyPurchase(
  data: VerifyPurchaseInput,
): Promise<VerifyPurchaseResult> {
  const callable = functions().httpsCallable('verifyPurchase');
  const result = await callable(data);
  return result.data as VerifyPurchaseResult;
}

// ============================================
// Phase 3: Games & Challenges
// ============================================

interface SubmitGameScoreInput {
  gameId: string;
  score: number;
  details?: Record<string, unknown>;
}

interface SubmitGameScoreResult {
  newHighScore: boolean;
}

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  startDate: string;
  endDate: string;
  reward: { type: 'badge' | 'points'; value: string };
}

interface ChallengeProgress {
  challengeId: string;
  progress: number;
  goal: number;
  completedAt: string | null;
  startedAt: string;
  type: string;
}

interface GetWeeklyChallengeResult {
  challenge: ChallengeDefinition;
  progress: ChallengeProgress;
}

async function callSubmitGameScore(
  data: SubmitGameScoreInput,
): Promise<SubmitGameScoreResult> {
  const callable = functions().httpsCallable('submitGameScore');
  const result = await callable(data);
  return result.data as SubmitGameScoreResult;
}

async function callGetWeeklyChallenge(): Promise<GetWeeklyChallengeResult> {
  const callable = functions().httpsCallable('getWeeklyChallenge');
  const result = await callable({});
  return result.data as GetWeeklyChallengeResult;
}

// ============================================
// Wait Times (Queue-Times proxy)
// ============================================

interface ProxyWaitTimesInput {
  parkSlug: string;
  parkId: number;
}

interface WaitTimeRide {
  id: string;
  name: string;
  waitMinutes: number;
  status: 'open' | 'closed';
  lastUpdated: string;
  land: string;
}

interface ProxyWaitTimesResult {
  rides: WaitTimeRide[];
  lastFetched: string;
  source: 'queue-times';
  fromCache: boolean;
}

async function callProxyWaitTimes(
  data: ProxyWaitTimesInput,
): Promise<ProxyWaitTimesResult> {
  const callable = functions().httpsCallable('proxyWaitTimes');
  const result = await callable(data);
  return result.data as ProxyWaitTimesResult;
}

// ============================================
// Articles (Admin)
// ============================================

interface CreateArticleInput {
  title: string;
  subtitle?: string;
  body: string;
  bannerImageUrl?: string;
  category: string;
  tags?: string[];
  readTimeMinutes?: number;
  sources?: Array<{ name: string; url: string }>;
  authorName?: string;
}

interface CreateArticleResult {
  articleId: string;
}

interface ArticleIdInput {
  articleId: string;
}

interface PublishArticleInput {
  articleId: string;
  notifyUsers?: boolean;
}

async function callCreateArticle(
  data: CreateArticleInput,
): Promise<CreateArticleResult> {
  const callable = functions().httpsCallable('createArticle');
  const result = await callable(data);
  return result.data as CreateArticleResult;
}

async function callPublishArticle(
  data: PublishArticleInput,
): Promise<{ success: boolean }> {
  const callable = functions().httpsCallable('publishArticle');
  const result = await callable(data);
  return result.data as { success: boolean };
}

async function callUnpublishArticle(
  data: ArticleIdInput,
): Promise<{ success: boolean }> {
  const callable = functions().httpsCallable('unpublishArticle');
  const result = await callable(data);
  return result.data as { success: boolean };
}

async function callDeleteArticle(
  data: ArticleIdInput,
): Promise<{ success: boolean }> {
  const callable = functions().httpsCallable('deleteArticle');
  const result = await callable(data);
  return result.data as { success: boolean };
}

// ============================================
// Community Safety (Report & Block)
// ============================================

interface ReportUserInput {
  reportedUserId: string;
  reason: 'spam' | 'harassment' | 'inappropriate-content' | 'impersonation' | 'other';
  details?: string;
  contentId?: string;
  contentType?: string;
}

interface ReportUserResult {
  reportId: string;
}

interface BlockUserInput {
  blockedUserId: string;
}

async function callReportUser(
  data: ReportUserInput,
): Promise<ReportUserResult> {
  const callable = functions().httpsCallable('reportUser');
  const result = await callable(data);
  return result.data as ReportUserResult;
}

async function callBlockUser(
  data: BlockUserInput,
): Promise<{ success: boolean }> {
  const callable = functions().httpsCallable('blockUser');
  const result = await callable(data);
  return result.data as { success: boolean };
}

async function callUnblockUser(
  data: BlockUserInput,
): Promise<{ success: boolean }> {
  const callable = functions().httpsCallable('unblockUser');
  const result = await callable(data);
  return result.data as { success: boolean };
}

// ============================================
// Exports
// ============================================

export {
  callOnUserCreated,
  callValidateUsername,
  callMigrateLocalData,
  callSendFriendRequest,
  callAcceptFriendRequest,
  callDeclineFriendRequest,
  callRemoveFriend,
  callDeleteUserAccount,
  callExportRideLog,
  callRegisterFCMToken,
  callVerifyPurchase,
  callSubmitGameScore,
  callGetWeeklyChallenge,
  callProxyWaitTimes,
  callCreateArticle,
  callPublishArticle,
  callUnpublishArticle,
  callDeleteArticle,
  callReportUser,
  callBlockUser,
  callUnblockUser,
};
export type {
  OnUserCreatedResult,
  ValidateUsernameResult,
  MigrateLocalDataInput,
  MigrateLocalDataResult,
  SendFriendRequestInput,
  AcceptFriendRequestInput,
  DeclineFriendRequestInput,
  RemoveFriendInput,
  DeleteAccountResult,
  ExportRideLogInput,
  ExportRideLogResult,
  VerifyPurchaseInput,
  VerifyPurchaseResult,
  ProStatus,
  SubmitGameScoreInput,
  SubmitGameScoreResult,
  ChallengeDefinition,
  ChallengeProgress,
  GetWeeklyChallengeResult,
  ProxyWaitTimesInput,
  ProxyWaitTimesResult,
  WaitTimeRide,
  CreateArticleInput,
  CreateArticleResult,
  ArticleIdInput,
  PublishArticleInput,
  ReportUserInput,
  ReportUserResult,
  BlockUserInput,
};
