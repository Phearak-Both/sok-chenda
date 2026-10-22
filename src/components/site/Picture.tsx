import { mediaSrcSet, mediaUrl } from "@/lib/media-url";
import type { Media } from "@/lib/types";

type Props = {
  media: Media;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function Picture({ media, alt, sizes, className, priority }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(media, 960)}
      srcSet={mediaSrcSet(media)}
      sizes={sizes}
      alt={alt}
      width={media.width}
      height={media.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
