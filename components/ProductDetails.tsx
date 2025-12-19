import React, { useState } from 'react';
import { Product, MediaItem, Order, User } from '../types';
import { X, MessageCircle, Truck, ShieldCheck, Play, LogIn } from 'lucide-react';
import Button from './Button';
import { askProductQuestion } from '../services/geminiService';

interface ProductDetailsProps {
  product: Product;
  user: User | null;
  onClose: () => void;
  onOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void;
  onLoginRequired: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, user, onClose, onOrder, onLoginRequired }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  // AI State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);

  // Calculate monthly price dynamically
  const calculatedMonthlyPrice = Math.ceil(product.totalPrice / product.plan.months);

  const modalStyle = {
    transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
    transition: 'transform 0.3s ease-out',
  };

  // Swipe Handlers
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
        setActiveMediaIndex((prev) => (prev + 1) % product.media.length);
      }
      if (isRightSwipe) {
        setActiveMediaIndex((prev) => (prev - 1 + product.media.length) % product.media.length);
      }
    }
  };

  // AI Handler
  const handleAiAsk = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    const answer = await askProductQuestion(product, aiQuestion);
    setAiAnswer(answer);
    setIsAiLoading(false);
  };

  // Direct Order Handler
  const handleOrderClick = () => {
    if (!user) {
      onLoginRequired();
      return;
    }

    onOrder({
      productId: product.id,
      productName: product.name,
      productImage: product.media[0].url,
      customerName: `${user.firstName} ${user.lastName}`,
      customerPhone: user.phone1,
      wilaya: user.wilaya,
      monthlyPrice: calculatedMonthlyPrice, // Use calculated price
      months: product.plan.months,
    });
    onClose();
  };

  const renderMedia = (item: MediaItem, index: number) => {
    const isActive = index === activeMediaIndex;
    if (!isActive) return null;

    return (
      <img 
        src={item.url} 
        alt={`Product ${index}`} 
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 pointer-events-auto ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={() => { setIsClosing(true); setTimeout(onClose, 300); }}
      />

      {/* Modal Content */}
      <div 
        className="bg-white w-full sm:max-w-md h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
        style={modalStyle}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          
          {/* Close Button Absolute */}
          <button 
            onClick={() => { setIsClosing(true); setTimeout(onClose, 300); }}
            className="absolute top-4 right-4 z-20 bg-white/50 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-800 hover:bg-white"
          >
            <X size={20} />
          </button>

          {/* Media Carousel */}
          <div 
            className="relative aspect-square w-full bg-gray-100 group touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
             {product.media.map((m, i) => renderMedia(m, i))}
             
             {/* Indicators */}
             {product.media.length > 1 && (
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {product.media.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-2 rounded-full transition-all duration-300 ${i === activeMediaIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-white/60'}`} 
                      />
                    ))}
                 </div>
             )}
          </div>

          <div className="p-6 pb-32">
            {/* Header: Price & Brand above Title */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                 <span className="text-xl font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                   {product.totalPrice.toLocaleString()} دج
                 </span>
                 <span className="text-xs text-gray-400 font-medium">السعر الكلي</span>
              </div>
              <span className="text-gray-500 font-bold text-sm bg-gray-100 px-2 py-1 rounded">
                {product.brand}
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="space-y-3 mb-8">
              <h3 className="font-bold text-gray-900">المميزات الرئيسية:</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feat, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 mb-8 text-sm text-gray-500">
               <div className="flex items-center gap-1">
                 <Truck size={16} /> توصيل لـ 58 ولاية
               </div>
               <div className="flex items-center gap-1">
                 <ShieldCheck size={16} /> ضمان رسمي
               </div>
            </div>

            {/* AI Assistant Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6">
               <button 
                 onClick={() => setShowAiChat(!showAiChat)}
                 className="flex items-center gap-2 w-full text-blue-700 font-bold mb-2"
               >
                 <MessageCircle size={20} />
                 <span>اسأل المساعد الذكي عن هذا المنتج</span>
                 <div className={`mr-auto transition-transform ${showAiChat ? '-rotate-90' : ''}`}>
                    <Play size={14} className="rotate-90" />
                 </div>
               </button>
               
               {showAiChat && (
                 <div className="mt-3 space-y-3">
                   {aiAnswer && (
                     <div className="bg-white p-3 rounded-lg text-sm text-gray-700 shadow-sm border border-blue-100 animate-fadeIn">
                       {aiAnswer}
                     </div>
                   )}
                   
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={aiQuestion}
                       onChange={(e) => setAiQuestion(e.target.value)}
                       placeholder="مثال: هل الثلاجة تستهلك كهرباء؟"
                       className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                       onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                     />
                     <button 
                       onClick={handleAiAsk}
                       disabled={isAiLoading}
                       className="bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50"
                     >
                       {isAiLoading ? '...' : <Play size={16} className="rotate-180" />}
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 safe-area-bottom">
             <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col justify-center">
                     <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-emerald-600">{calculatedMonthlyPrice.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500">دج / شهر</span>
                     </div>
                     <div className="text-xs text-emerald-700 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-full mt-0.5">
                       لمدة {product.plan.months} أشهر
                     </div>
                </div>
                <div className="w-1/2">
                   {user ? (
                     <Button fullWidth onClick={handleOrderClick}>
                       اطلب الآن
                     </Button>
                   ) : (
                     <Button fullWidth onClick={onLoginRequired} variant="secondary">
                       <LogIn size={18} /> سجل للطلب
                     </Button>
                   )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;