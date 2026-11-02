// React Router SPA builds bootstrap with an inline module import; other
// bundlers may use a script src. Preload links alone do not start the app.
export function javascriptEntry(html) {
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const source = attributes.match(/(?:^|\s)src\s*=\s*(["'])(\/assets\/[^"'?#]+\.js)\1/i)?.[2];
    if (source) return source;
    if (!/(?:^|\s)type\s*=\s*(["'])module\1/i.test(attributes)) continue;
    const imported = body.match(/\bimport\s*\(\s*(["'])(\/assets\/[^"'?#]+\.js)\1\s*\)/)?.[2];
    if (imported) return imported;
  }
  return undefined;
}
