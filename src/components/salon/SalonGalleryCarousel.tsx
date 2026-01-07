import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import salonHeroImage from "@/assets/salon-hero.jpg";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
}

interface SalonGalleryCarouselProps {
  images: GalleryImage[];
  fallbackImage: string | null;
  salonName: string;
}

const SalonGalleryCarousel = ({ images, fallbackImage, salonName }: SalonGalleryCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // If no gallery images, show fallback
  const displayImages: GalleryImage[] = images.length > 0 
    ? images 
    : [{ 
        id: 'fallback', 
        image_url: fallbackImage || salonHeroImage, 
        caption: null, 
        is_primary: true 
      }];

  const showNavigation = displayImages.length > 1;

  return (
    <div className="relative h-64 overflow-hidden">
      <Carousel setApi={setApi} className="w-full h-full">
        <CarouselContent className="h-64 -ml-0">
          {displayImages.map((image, index) => (
            <CarouselItem key={image.id} className="h-64 pl-0">
              <div className="relative h-full w-full">
                <img
                  src={image.image_url}
                  alt={image.caption || `${salonName} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                
                {image.caption && (
                  <div className="absolute bottom-12 left-4 right-4">
                    <p className="text-white text-sm font-medium drop-shadow-lg">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {showNavigation && (
          <>
            <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-0" />
            <CarouselNext className="right-2 bg-white/80 hover:bg-white border-0" />
          </>
        )}
      </Carousel>

      {/* Dot indicators */}
      {showNavigation && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === current 
                  ? "bg-white w-4" 
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SalonGalleryCarousel;
