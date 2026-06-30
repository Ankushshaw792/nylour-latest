import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import salonHeroImage from "@/assets/salon-hero.jpg";
import haircutImage from "@/assets/haircut-service.jpg";
import beardTrimImage from "@/assets/beard-trim-service.jpg";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

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
  salonCity?: string | null;
}

const SalonGalleryCarousel = ({ images, fallbackImage, salonName, salonCity }: SalonGalleryCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Gallery view state
  const [showGallery, setShowGallery] = useState(false);
  const [activeTab, setActiveTab] = useState<'venue' | 'portfolio'>('venue');

  // Lightbox view state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'venue' | 'portfolio'>('venue');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Lock body scroll when full screen overlay or lightbox is active
  useEffect(() => {
    if (showGallery || lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showGallery, lightboxOpen]);

  // If no gallery images, show fallback
  const initialImages: GalleryImage[] = images.length > 0 
    ? images 
    : [{ 
        id: 'fallback', 
        image_url: fallbackImage || salonHeroImage, 
        caption: null, 
        is_primary: true 
      }];

  const rawVenueImages = initialImages.filter(img => !img.caption?.includes('[TYPE:PORTFOLIO]'))
    .map(img => ({ ...img, caption: img.caption?.replace('[TYPE:PORTFOLIO]', '').trim() || null }));

  const rawPortfolioImages = initialImages.filter(img => img.caption?.includes('[TYPE:PORTFOLIO]'))
    .map(img => ({ ...img, caption: img.caption?.replace('[TYPE:PORTFOLIO]', '').trim() || null }));

  const displayImages = initialImages.map(img => ({ ...img, caption: img.caption?.replace('[TYPE:PORTFOLIO]', '').trim() || null }));

  // Use local fallback portfolio images if there are none in the database
  const venueImages = rawVenueImages.length > 0 ? rawVenueImages : displayImages;
  const portfolioImages = rawPortfolioImages.length > 0 ? rawPortfolioImages : [
    {
      id: 'demo-portfolio-1',
      image_url: haircutImage,
      caption: 'Hair styling portfolio',
      is_primary: false
    },
    {
      id: 'demo-portfolio-2',
      image_url: beardTrimImage,
      caption: 'Beard grooming portfolio',
      is_primary: false
    }
  ];

  const showNavigation = displayImages.length > 1;

  // Lightbox handlers
  const openLightbox = (category: 'venue' | 'portfolio', index: number) => {
    setActiveCategory(category);
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const getActiveImages = () => {
    return activeCategory === 'venue' ? venueImages : portfolioImages;
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const list = getActiveImages();
    setActiveImageIndex((prev) => (prev + 1) % list.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const list = getActiveImages();
    setActiveImageIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const currentLightboxImage = getActiveImages()[activeImageIndex];

  return (
    <>
      <div className="relative h-64 overflow-hidden">
        {/* Carousel slides are fully swipeable and do not open the gallery modal on track click */}
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

        {/* Floating view gallery badge pill */}
        <button
          onClick={() => setShowGallery(true)}
          className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/85 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md z-10"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>View Gallery ({displayImages.length})</span>
        </button>

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

      {/* Expanded full screen image gallery overlay using React Portal */}
      {showGallery && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-background z-[100] flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border/40 bg-background">
            <button
              onClick={() => setShowGallery(false)}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Image gallery</h1>
              <p className="text-xs text-muted-foreground">
                {salonName}{salonCity ? ` - ${salonCity}` : ''}
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-3 px-4 py-3 bg-muted/10 border-b border-border/20">
            <button
              onClick={() => setActiveTab('venue')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'venue'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>Venue</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'venue'
                  ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {venueImages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>Team portfolio</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'portfolio'
                  ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {portfolioImages.length}
              </span>
            </button>
          </div>

          {/* Scrollable grid stack list of images */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {activeTab === 'venue' ? (
              venueImages.map((image, idx) => (
                <div
                  key={image.id}
                  className="relative cursor-pointer overflow-hidden rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all aspect-[16/10]"
                  onClick={() => openLightbox('venue', idx)}
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || `Venue image ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                  {image.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-8">
                      <p className="text-white text-xs font-medium">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              portfolioImages.map((image, idx) => (
                <div
                  key={image.id}
                  className="relative cursor-pointer overflow-hidden rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all aspect-[16/10]"
                  onClick={() => openLightbox('portfolio', idx)}
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || `Portfolio image ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                  {image.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-8">
                      <p className="text-white text-xs font-medium">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Modal (Single Image View Overlay) using React Portal */}
      {lightboxOpen && currentLightboxImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/95 z-[110] flex flex-col justify-between select-none animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button and info */}
          <div className="flex justify-between items-center p-4 text-white w-full">
            <span className="text-sm text-white/70 font-medium">
              {activeCategory === 'venue' ? 'Venue' : 'Team portfolio'} ({activeImageIndex + 1} of {getActiveImages().length})
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Centered Image and Nav Arrows */}
          <div className="flex-1 flex items-center justify-between px-4 w-full relative">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors absolute left-4 z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div 
              className="flex-1 flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentLightboxImage.image_url}
                alt={currentLightboxImage.caption || "Lightbox View"}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
              />
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors absolute right-4 z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Caption footer */}
          <div className="p-6 text-center text-white w-full bg-gradient-to-t from-black/80 to-transparent">
            {currentLightboxImage.caption ? (
              <p className="text-sm font-medium drop-shadow-md max-w-xl mx-auto">
                {currentLightboxImage.caption}
              </p>
            ) : (
              <p className="text-xs text-white/60 italic">No description</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SalonGalleryCarousel;
