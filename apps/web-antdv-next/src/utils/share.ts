export interface ParsedShareLink {
  url: string;
  passcode?: string;
}

const SHARE_URL_PATTERNS = [
  /https?:\/\/(?:pan\.baidu\.com\/s\/[a-zA-Z0-9_-]+)/,
  /https?:\/\/(?:pan\.quark\.cn\/s\/[a-zA-Z0-9_-]+)/,
  /https?:\/\/(?:pan\.xunlei\.com\/s\/[a-zA-Z0-9_-]+)/,
  /https?:\/\/(?:cloud\.189\.cn\/[a-zA-Z0-9_-]+)/,
  /https?:\/\/(?:www\.aliyundrive\.com\/s\/[a-zA-Z0-9_-]+)/,
];

const PASSCODE_PATTERNS = [
  /提取码[：:]\s*([a-zA-Z0-9]{4,})/,
  /提取码[：:]?\s*([a-zA-Z0-9]{4,})/,
  /pwd[=：:]\s*([a-zA-Z0-9]+)/,
  /passcode[=：:]\s*([a-zA-Z0-9]+)/,
  /密码[：:]\s*([a-zA-Z0-9]+)/,
];

function extractUrl(text: string): null | string {
  for (const pattern of SHARE_URL_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function extractPasscode(text: string): string | undefined {
  for (const pattern of PASSCODE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

export function parseShareLink(text: string): null | ParsedShareLink {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const url = extractUrl(trimmed);
  const passcode = extractPasscode(trimmed);

  if (url) {
    return { url, passcode };
  }

  const bareShareIdPattern = /^[a-zA-Z0-9_-]{4,64}$/;
  if (bareShareIdPattern.test(trimmed)) {
    return { url: trimmed, passcode };
  }

  try {
    new URL(trimmed);
    return { url: trimmed, passcode };
  } catch {
    return null;
  }
}
