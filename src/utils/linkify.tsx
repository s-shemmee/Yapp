import React from "react";

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

function cleanTrailingPunctuation(url: string): { url: string; trail: string } {
  const match = url.match(TRAILING_PUNCTUATION);
  if (!match) return { url, trail: "" };
  return {
    url: url.slice(0, url.length - match[0].length),
    trail: match[0],
  };
}

export function linkifyText(text: string): React.ReactNode[] {
  const parts = text.split(URL_PATTERN);

  return parts.map((part, index) => {
    if (!URL_PATTERN.test(part)) {
      URL_PATTERN.lastIndex = 0;
      return part;
    }
    URL_PATTERN.lastIndex = 0;

    const { url, trail } = cleanTrailingPunctuation(part);
    const href = url.startsWith("www.") ? `https://${url}` : url;

    return (
      <React.Fragment key={`${url}-${index}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="messageLink"
        >
          {url}
        </a>
        {trail}
      </React.Fragment>
    );
  });
}