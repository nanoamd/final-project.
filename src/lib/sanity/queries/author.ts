const AUTHOR_PROJECTION = /* groq */ `{
  "slug": slug.current,
  name,
  "avatar": avatar.asset->url,
  role,
  bio
}`;

export { AUTHOR_PROJECTION };
