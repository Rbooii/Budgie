"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Assistant prose. Markdown is rendered once the message is complete; while
 * streaming we keep the plain-text view so the static caret stays attached to
 * the last character (partial markdown would also flicker).
 */
export function ChatMarkdown({
  text,
  streaming = false,
}: {
  text: string;
  streaming?: boolean;
}) {
  if (streaming) {
    return (
      <div className="w-full whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
        {text}
        <span
          aria-hidden="true"
          className="chat-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] rounded-full bg-brand"
        />
      </div>
    );
  }

  return (
    <div className="chat-markdown w-full text-[15px] leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-brand underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded-[6px] bg-surface px-1 py-0.5 text-[13px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-[14px] border border-hairline bg-surface p-3 text-[13px] [&>code]:bg-transparent [&>code]:p-0 last:mb-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-hairline pl-3 text-ink/60 last:mb-0">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-[13px]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-hairline px-2 py-1 text-left font-semibold text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-hairline px-2 py-1 text-ink/70">
              {children}
            </td>
          ),
          hr: () => <hr className="my-3 border-hairline" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
