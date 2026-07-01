"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";

interface MathTextProps {
  content: string;
  className?: string;
}

export function MathText({ content, className }: MathTextProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p>{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
