import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Calculate monthly price dynamically: Total / Months
  const calculatedMonthlyPrice = Math.ceil(product.totalPrice / product.plan.months);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      const isLeftSwipe = distanceX > 50;
      const isRightSwipe = distanceX < -50;

      if (isLeftSwipe) {
        // Next
        setCurrentMediaIndex((prev) => (prev + 1) % product.media.length);
      }
      if (isRightSwipe) {
        // Prev
        setCurrentMediaIndex((prev) => (prev - 1 + product.media.length) % product.media.length);
      }
    }
  };

  const currentMedia = product.media[currentMediaIndex];

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-3xl shadow-md overflow-hidden relative cursor-pointer active:scale-[0.99] transition-all duration-300 border border-gray-100"
    >
      {/* Image Container with Swipe */}
      <div 
        className="relative aspect-[4/3] bg-gray-200 group touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={currentMedia.url} 
          alt={product.name} 
          className="w-full h-full object-cover transition-opacity duration-300 select-none pointer-events-none"
          loading="lazy"
        />

        {/* Dots Indicator */}
        {product.media.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
              {product.media.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMediaIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
        )}

        {/* Installment Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white pt-20 pointer-events-none">
           <div className="flex justify-between items-end">
             <div>
               <p className="text-sm text-gray-300 mb-1 font-medium shadow-black drop-shadow-md">القسط الشهري</p>
               <p className="text-3xl font-extrabold text-emerald-400 drop-shadow-md">
                 {calculatedMonthlyPrice.toLocaleString()} <span className="text-sm font-bold text-white">دج</span>
               </p>
             </div>
             
             <div className="flex flex-col items-end gap-1">
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                  <span className="font-bold text-2xl">{product.plan.months}</span>
                  <span className="text-sm mr-1">أشهر</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Basic Info Below */}
      <div className="p-5 pt-4">
        {/* Price and Brand Row (Top) */}
        <div className="flex justify-between items-center mb-2">
           <span className="text-lg font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
             {product.totalPrice.toLocaleString()} دج
           </span>
           <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
             {product.brand}
           </span>
        </div>

        <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2">
           {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
      </div>
    </div>
  );
};

export default ProductCard;