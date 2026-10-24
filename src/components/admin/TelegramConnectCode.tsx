"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { CheckIcon, CopyIcon, TelegramIcon } from "../icons";

/**
 * Shown after "Connect Telegram". Opening the bot link sends the code by itself only when the
 * chat is new (Telegram's Start button); in an existing chat the owner sends the message instead.
 */
export function TelegramConnectCode({ url, message }: { url: string; message: string }) {
  const { t } = useI18n();
  const a = t.admin.account;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); the message can still be selected.
    }
  };

  return (
    <ol className="space-y-4 text-sm">
      <li>
        <p className="mb-2">{a.telegramStepOpen}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="abtn abtn-primary">
          <TelegramIcon size={16} /> {a.telegramOpen}
        </a>
      </li>
      <li>
        <p className="mb-2">{a.telegramStepSend}</p>
        <div className="flex items-stretch gap-2">
          <code className="min-w-0 flex-1 select-all break-all rounded-md border border-line bg-cream/60 px-3 py-2 font-mono text-[0.8125rem]">
            {message}
          </code>
          <button type="button" onClick={copy} className="abtn abtn-sm shrink-0">
            {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />} {copied ? a.telegramCopied : a.telegramCopy}
          </button>
        </div>
      </li>
      <li>
        <p className="mb-2">{a.telegramStepDone}</p>
        <a href="/admin/account" className="abtn abtn-sm">
          {a.telegramReload}
        </a>
      </li>
    </ol>
  );
}
