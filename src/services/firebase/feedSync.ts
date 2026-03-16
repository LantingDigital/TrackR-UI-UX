/**
 * Feed Sync — Firestore ↔ Zustand
 *
 * Real-time sync for community feed posts.
 * - onSnapshot listener on `posts` collection → communityStore
 * - Write operations for creating posts, toggling likes, adding comments
 *
 * Collection: posts/{postId}, posts/{postId}/comments/{commentId}
 */

import firestore from '@react-native-firebase/firestore';
import { _communityStoreInternal } from '../../features/community/stores/communityStore';
import { PostDoc, CommentDoc } from '../../types/firestore';
import type {
  FeedItem,
  ReviewFeedItem,
  TripReportFeedItem,
  TopListFeedItem,
  BucketListFeedItem,
  Comment,
  ComposeReviewData,
  ComposeTripReportData,
  ComposeRankedListData,
  ComposeBucketListData,
} from '../../features/community/types/community';

// ============================================
// Collection Refs
// ============================================

const postsRef = () => firestore().collection('posts');

const commentsRef = (postId: string) =>
  postsRef().doc(postId).collection('comments');

// ============================================
// Conversion Helpers
// ============================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Convert a PostDoc to a FeedItem for the UI store.
 */
function postDocToFeedItem(doc: PostDoc, currentUid: string): FeedItem | null {
  const createdMs = doc.createdAt?.toDate?.()?.getTime?.() ?? Date.now();
  const daysAgo = Math.floor((Date.now() - createdMs) / 86400000);
  const isLiked = doc.likedBy.includes(currentUid);

  const base = {
    id: doc.id,
    authorId: doc.authorId,
    authorName: doc.authorName,
    authorInitials: getInitials(doc.authorName),
    daysAgo,
    likeCount: doc.likeCount,
    commentCount: doc.commentCount,
    isLiked,
    comments: [], // Comments loaded separately on demand
  };

  switch (doc.type) {
    case 'review': {
      if (!doc.coasterRef) return null;
      const item: ReviewFeedItem = {
        ...base,
        type: 'review',
        coasterId: doc.coasterRef.coasterId,
        coasterName: doc.coasterRef.coasterName,
        parkName: doc.coasterRef.parkName,
        rating: 0, // Extracted from content or stored separately
        reviewText: doc.content,
      };
      return item;
    }
    case 'trip-report': {
      const item: TripReportFeedItem = {
        ...base,
        type: 'trip_report',
        title: doc.content.split('\n')[0] || 'Trip Report',
        parkId: doc.parkRef?.parkId ?? '',
        parkName: doc.parkRef?.parkName ?? '',
        rideCount: 0,
        excerpt: doc.content.slice(0, 200),
        fullText: doc.content,
      };
      return item;
    }
    case 'ranked-list': {
      const item: TopListFeedItem = {
        ...base,
        type: 'top_list',
        title: doc.content.split('\n')[0] || 'Ranked List',
        emoji: '',
        items: (doc.items ?? []).map((i) => ({
          coasterId: i.coasterId,
          name: i.coasterName,
        })),
        category: 'Custom',
      };
      return item;
    }
    case 'bucket-list': {
      const item: BucketListFeedItem = {
        ...base,
        type: 'bucket_list',
        title: doc.content.split('\n')[0] || 'Bucket List',
        items: (doc.items ?? []).map((i, idx) => ({
          id: `${doc.id}-item-${idx}`,
          name: i.coasterName,
          itemType: 'coaster' as const,
          refId: i.coasterId,
          completed: false,
        })),
      };
      return item;
    }
    default:
      return null;
  }
}

function commentDocToComment(doc: CommentDoc): Comment {
  const createdMs = doc.createdAt?.toDate?.()?.getTime?.() ?? Date.now();

  return {
    id: doc.id,
    authorId: doc.authorId,
    authorName: doc.authorName,
    authorInitials: getInitials(doc.authorName),
    text: doc.text,
    timestamp: createdMs,
    likeCount: doc.likeCount,
    isLiked: false, // Will be computed with currentUid
  };
}

// ============================================
// Listener
// ============================================

/**
 * Start real-time sync for the community feed.
 * Listens to public posts, ordered by creation time.
 */
function startFeedSync(uid: string): () => void {
  const unsub = postsRef()
    .where('visibility', '==', 'public')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      (snapshot) => {
        const feedItems: FeedItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as PostDoc;
          const item = postDocToFeedItem({ ...data, id: doc.id }, uid);
          if (item) feedItems.push(item);
        });
        _communityStoreInternal.getState()._setFeedItems(feedItems);
      },
      (error) => {
        console.error('[FeedSync] Snapshot error:', error);
      },
    );

  return unsub;
}

// ============================================
// Write Operations
// ============================================

/**
 * Create a review post.
 */
async function createReviewPost(
  uid: string,
  userName: string,
  avatarUrl: string | null,
  data: ComposeReviewData,
): Promise<string> {
  const now = firestore.Timestamp.now();
  const postDoc: Omit<PostDoc, 'id'> = {
    type: 'review',
    authorId: uid,
    authorName: userName,
    authorAvatarUrl: avatarUrl,
    content: data.reviewText,
    coasterRef: {
      coasterId: data.coasterId,
      coasterName: data.coasterName,
      parkName: data.parkName,
    },
    parkRef: null,
    items: null,
    likeCount: 0,
    commentCount: 0,
    likedBy: [],
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await postsRef().add(postDoc);
  return ref.id;
}

/**
 * Create a trip report post.
 */
async function createTripReportPost(
  uid: string,
  userName: string,
  avatarUrl: string | null,
  data: ComposeTripReportData,
): Promise<string> {
  const now = firestore.Timestamp.now();
  const postDoc: Omit<PostDoc, 'id'> = {
    type: 'trip-report',
    authorId: uid,
    authorName: userName,
    authorAvatarUrl: avatarUrl,
    content: data.bodyText,
    coasterRef: null,
    parkRef: { parkId: data.parkId, parkName: data.parkName },
    items: null,
    likeCount: 0,
    commentCount: 0,
    likedBy: [],
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await postsRef().add(postDoc);
  return ref.id;
}

/**
 * Create a ranked list post.
 */
async function createRankedListPost(
  uid: string,
  userName: string,
  avatarUrl: string | null,
  data: ComposeRankedListData,
): Promise<string> {
  const now = firestore.Timestamp.now();
  const postDoc: Omit<PostDoc, 'id'> = {
    type: 'ranked-list',
    authorId: uid,
    authorName: userName,
    authorAvatarUrl: avatarUrl,
    content: data.title,
    coasterRef: null,
    parkRef: null,
    items: data.items.map((item, idx) => ({
      coasterId: item.coasterId,
      coasterName: item.name,
      parkName: '',
      rank: idx + 1,
    })),
    likeCount: 0,
    commentCount: 0,
    likedBy: [],
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await postsRef().add(postDoc);
  return ref.id;
}

/**
 * Create a bucket list post.
 */
async function createBucketListPost(
  uid: string,
  userName: string,
  avatarUrl: string | null,
  data: ComposeBucketListData,
): Promise<string> {
  const now = firestore.Timestamp.now();
  const postDoc: Omit<PostDoc, 'id'> = {
    type: 'bucket-list',
    authorId: uid,
    authorName: userName,
    authorAvatarUrl: avatarUrl,
    content: data.title,
    coasterRef: null,
    parkRef: null,
    items: data.items.map((item) => ({
      coasterId: item.refId,
      coasterName: item.name,
      parkName: '',
    })),
    likeCount: 0,
    commentCount: 0,
    likedBy: [],
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await postsRef().add(postDoc);
  return ref.id;
}

/**
 * Toggle like on a post. Uses arrayUnion/arrayRemove for atomic updates.
 */
async function togglePostLike(uid: string, postId: string): Promise<void> {
  // Optimistic update
  _communityStoreInternal.getState().toggleLike(postId);

  const postRef = postsRef().doc(postId);
  const snap = await postRef.get();
  if (!snap.exists()) return;

  const data = snap.data() as PostDoc;
  const isCurrentlyLiked = data.likedBy.includes(uid);

  if (isCurrentlyLiked) {
    await postRef.update({
      likedBy: firestore.FieldValue.arrayRemove(uid),
      likeCount: firestore.FieldValue.increment(-1),
    });
  } else {
    await postRef.update({
      likedBy: firestore.FieldValue.arrayUnion(uid),
      likeCount: firestore.FieldValue.increment(1),
    });
  }
}

/**
 * Add a comment to a post.
 */
async function addPostComment(
  uid: string,
  userName: string,
  avatarUrl: string | null,
  postId: string,
  text: string,
): Promise<void> {
  // Optimistic update
  _communityStoreInternal.getState().addComment(postId, text);

  const now = firestore.Timestamp.now();
  const commentDoc: Omit<CommentDoc, 'id'> = {
    authorId: uid,
    authorName: userName,
    authorAvatarUrl: avatarUrl,
    text,
    likeCount: 0,
    likedBy: [],
    createdAt: now,
  };

  const batch = firestore().batch();

  // Add comment
  const commentRef = commentsRef(postId).doc();
  batch.set(commentRef, commentDoc);

  // Increment comment count on post
  batch.update(postsRef().doc(postId), {
    commentCount: firestore.FieldValue.increment(1),
  });

  await batch.commit();
}

/**
 * Load comments for a specific post.
 */
async function loadPostComments(
  postId: string,
  currentUid: string,
): Promise<Comment[]> {
  const snap = await commentsRef(postId)
    .orderBy('createdAt', 'asc')
    .get();

  const comments: Comment[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as CommentDoc;
    const comment = commentDocToComment({ ...data, id: doc.id });
    comment.isLiked = data.likedBy?.includes(currentUid) ?? false;
    comments.push(comment);
  });

  return comments;
}

// ============================================
// Exports
// ============================================

export {
  startFeedSync,
  createReviewPost,
  createTripReportPost,
  createRankedListPost,
  createBucketListPost,
  togglePostLike,
  addPostComment,
  loadPostComments,
};
