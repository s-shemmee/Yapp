import React from "react";

const TOKEN_PATTERN = new RegExp(
  [
    "(`[^`\\n]+`)",
    "(\\*\\*(?:(?!\\*\\*).)+\\*\\*)",
    "(__(?:(?!__).)+__)",
    "(~~(?:(?!~~).)+~~)",
    "(\\*(?:(?!\\*).)+\\*)",
    "(_(?:(?!_).)+_)",
    '((?:https?:\\/\\/|www\\.)[^\\s<>"\']+)',
  ].join("|"),
  "g"
);

const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

function cleanTrailingPunctuation(url: string): {
  url: string;
  trail: string;
} {
  const match = url.match(TRAILING_PUNCTUATION);

  if (!match) {
    return { url, trail: "" };
  }

  return {
    url: url.slice(0, url.length - match[0].length),
    trail: match[0],
  };
}

export function formatMessageText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  TOKEN_PATTERN.lastIndex = 0;

  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    const [
      full,
      code,
      bold1,
      bold2,
      strike,
      italic1,
      italic2,
      url,
    ] = match;

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (code) {
      nodes.push(
        <code key={key++} className="messageInlineCode">
          {code.slice(1, -1)}
        </code>
      );
    } else if (bold1) {
      nodes.push(<strong key={key++}>{bold1.slice(2, -2)}</strong>);
    } else if (bold2) {
      nodes.push(<strong key={key++}>{bold2.slice(2, -2)}</strong>);
    } else if (strike) {
      nodes.push(<s key={key++}>{strike.slice(2, -2)}</s>);
    } else if (italic1) {
      nodes.push(<em key={key++}>{italic1.slice(1, -1)}</em>);
    } else if (italic2) {
      nodes.push(<em key={key++}>{italic2.slice(1, -1)}</em>);
    } else if (url) {
      const { url: cleanUrl, trail } = cleanTrailingPunctuation(url);
      const href = cleanUrl.startsWith("www.")
        ? `https://${cleanUrl}`
        : cleanUrl;

      nodes.push(
        <React.Fragment key={key++}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="messageLink"
          >
            {cleanUrl}
          </a>
          {trail}
        </React.Fragment>
      );
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function stripFormattingForPreview(text: string): string {
  return text.replace(
    TOKEN_PATTERN,
    (
      match,
      code,
      bold1,
      bold2,
      strike,
      italic1,
      italic2,
      url
    ) => {
      if (code) return code.slice(1, -1);
      if (bold1) return bold1.slice(2, -2);
      if (bold2) return bold2.slice(2, -2);
      if (strike) return strike.slice(2, -2);
      if (italic1) return italic1.slice(1, -1);
      if (italic2) return italic2.slice(1, -1);
      if (url) return url;

      return match;
    }
  );
}
