export class InvalidPostCollectionError extends Error {
  constructor(key: string) {
    super(`Stored post collection "${key}" is not an array.`);
    this.name = "InvalidPostCollectionError";
  }
}

export function getPostCollectionForWrite(data: unknown, key: string): unknown[] {
  if (data == null) return [];
  if (!Array.isArray(data)) {
    throw new InvalidPostCollectionError(key);
  }
  return data;
}

export function updateRawPostCollection<T extends { id: string }>(
  rawPosts: unknown[],
  isPost: (post: unknown) => post is T,
  id: string,
  update: (post: T) => T
): { posts: unknown[]; post: T } | null {
  const idx = rawPosts.findIndex((post) => isPost(post) && post.id === id);
  if (idx === -1) return null;

  const current = rawPosts[idx];
  if (!isPost(current)) return null;

  const post = update(current);
  const posts = rawPosts.slice();
  posts[idx] = post;
  return { posts, post };
}

export function deleteRawPostFromCollection<T extends { id: string }>(
  rawPosts: unknown[],
  isPost: (post: unknown) => post is T,
  id: string
): { posts: unknown[]; deleted: boolean } {
  const idx = rawPosts.findIndex((post) => isPost(post) && post.id === id);
  if (idx === -1) {
    return { posts: rawPosts, deleted: false };
  }

  return {
    posts: [...rawPosts.slice(0, idx), ...rawPosts.slice(idx + 1)],
    deleted: true,
  };
}
