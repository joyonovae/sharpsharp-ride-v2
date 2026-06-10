"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function ApplicationImage({
  src,
  alt,
  heightClass,
  placeholder,
}: {
  src: string | null;
  alt: string;
  heightClass: string;
  placeholder: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex ${heightClass} w-full flex-col items-center justify-center gap-3 bg-[#08141b] px-5 text-center text-slate-500`}>
        <ImageOff className="h-8 w-8 text-slate-600" />
        <p className="text-sm font-semibold">{placeholder}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${heightClass} w-full object-cover`}
    />
  );
}
