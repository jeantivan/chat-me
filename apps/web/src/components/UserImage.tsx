import React, { useState, useEffect } from "react";
import { UserCircle2 } from "lucide-react";

import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";
import { useTranslation } from "@/lib/i18n";

export interface UserImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function UserImage({
  src,
  alt,
  className,
  fallback,
}: UserImageProps = {}) {
  const { t } = useTranslation();
  const resolvedAlt = alt ?? t("drawer.profilePictureAlt");
  const selfPicture = useStore((state) => state.user.picture);
  const imageSrc = src !== undefined ? (src || "") : (selfPicture || "");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageSrc]);

  const showImage = Boolean(imageSrc.trim() && !hasError);

  return (
    <div
      data-testid="user-avatar-root"
      className={mc(
        "bg-background-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 select-none",
        className
      )}
    >
      {showImage ? (
        <img
          src={imageSrc}
          alt={resolvedAlt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          data-testid="user-avatar-fallback"
          className="w-full h-full flex items-center justify-center"
        >
          {fallback || (
            <UserCircle2
              data-testid="user-avatar-fallback-icon"
              className="w-full h-full text-neutral-400"
              strokeWidth={1}
            />
          )}
        </div>
      )}
    </div>
  );
}

