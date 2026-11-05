"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeSnippetViewerProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeSnippetViewer({ code, language = "typescript", filename }: CodeSnippetViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className="feed-post-code-frame my-3 overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="font-mono text-zinc-300 font-medium">{filename || `extrait.${language}`}</span>
          <span className="ui-badge uppercase">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="ui-button ui-button-quiet px-2 py-1 text-[11px]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copié</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with line numbers */}
      <div className="overflow-x-auto p-3 text-xs font-mono leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[#161b22]">
                <td className="w-8 select-none pr-3 text-right text-zinc-600 font-mono text-[11px]">
                  {idx + 1}
                </td>
                <td className="text-zinc-200 whitespace-pre">
                  {colorizeSyntax(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function colorizeSyntax(line: string): ReactNode[] {
  const tokens = line.split(
    /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|export|from|const|let|var|function|return|async|await|class|interface|type|public|private|def|self)\b|\b(?:true|false|null|undefined|None)\b)/g
  );

  return tokens.filter(Boolean).map((token, index) => {
    let className: string | undefined;

    if (/^(\/\/|#)/.test(token)) {
      className = "text-zinc-500 italic";
    } else if (/^("|'|`)/.test(token)) {
      className = "text-emerald-400";
    } else if (/^(true|false|null|undefined|None)$/.test(token)) {
      className = "text-amber-400";
    } else if (/^(import|export|from|const|let|var|function|return|async|await|class|interface|type|public|private|def|self)$/.test(token)) {
      className = "text-[#818CF8] font-semibold";
    }

    return className ? <span key={index} className={className}>{token}</span> : token;
  });
}
