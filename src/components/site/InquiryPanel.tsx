"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { telegramLink, telLink, whatsappLink } from "@/lib/contact";
import { CheckIcon, CopyIcon, PhoneIcon, TelegramIcon, WhatsAppIcon } from "../icons";

type Props = { message: string; whatsapp: string; telegram: string; phone: string };

export function InquiryPanel({ message, whatsapp, telegram, phone }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!whatsapp && !telegram && !phone) {
    return <p className="text-sm text-ink-soft">{t.product.noContact}</p>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); nothing else to do.
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {whatsapp && (
          <a
            href={whatsappLink(whatsapp, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark w-full sm:col-span-2"
          >
            <WhatsAppIcon size={18} /> {t.product.whatsapp}
          </a>
        )}
        {telegram && (
          <a href={telegramLink(telegram)} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
            <TelegramIcon size={17} /> {t.product.telegram}
          </a>
        )}
        {phone && (
          <a href={telLink(phone)} className="btn btn-outline w-full">
            <PhoneIcon size={17} /> {t.product.call}
          </a>
        )}
      </div>
      {(telegram || phone) && (
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-[0.8125rem] text-ink-soft hover:text-ink"
        >
          {copied ? <CheckIcon size={15} className="text-success" /> : <CopyIcon size={15} />}
          <span aria-live="polite">{copied ? t.product.copied : t.product.copyMessage}</span>
        </button>
      )}
    </div>
  );
}
