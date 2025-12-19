
import { Product, MediaType, User, Order, OrderStatus } from './types';

export const ALGERIA_WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر",
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران"
];

export const DELIVERY_COMPANIES = [
  "Yalidine Express",
  "ZR Express",
  "Nord & West Express",
  "Maystro Delivery",
  "Guepex",
  "E-logistique",
  "البريد السريع EMS"
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'تلفاز كوندور 55 بوصة 4K Smart',
    brand: 'Condor',
    category: 'تلفاز',
    description: 'تلفاز ذكي بدقة 4K عالية الوضوح، نظام أندرويد 11، يدعم جميع التطبيقات (Netflix, YouTube). تصميم بدون حواف لتجربة مشاهدة غامرة.',
    totalPrice: 85000,
    plan: {
      months: 12,
      monthlyPrice: 7084
    },
    features: ['دقة 4K UHD', 'Android TV 11', 'HDR10+', '3 منافذ HDMI', 'Dolby Audio'],
    media: [
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80' },
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80' },
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1552975086-20a93237aad7?auto=format&fit=crop&w=800&q=80' },
    ],
    stock: 15
  },
  {
    id: '2',
    name: 'ثلاجة براندت 420 لتر',
    brand: 'Brandt',
    category: 'ثلاجات',
    description: 'ثلاجة واسعة بنظام تبريد NoFrost مانع لتكون الجليد، اقتصادية في استهلاك الطاقة، مع مساحات تخزين ذكية للخضروات والفواكه.',
    totalPrice: 110000,
    plan: {
      months: 18,
      monthlyPrice: 6112
    },
    features: ['NoFrost', 'A++ توفير طاقة', 'ضمان 3 سنوات', 'شاشة تحكم رقمية', 'إضاءة LED'],
    media: [
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80' },
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1571175443880-49e1d58b794a?auto=format&fit=crop&w=800&q=80' },
    ],
    stock: 8
  },
  {
    id: '3',
    name: 'غسالة أل جي 10.5 كغ Vivace',
    brand: 'LG',
    category: 'غسالات',
    description: 'غسالة ملابس ذكية بتقنية AI DD التي تتعرف على نوع القماش وتختار الغسيل الأمثل. محرك Direct Drive هادئ وموفر للطاقة.',
    totalPrice: 145000,
    plan: {
      months: 24,
      monthlyPrice: 6042
    },
    features: ['AI DD', 'Steam+ تعقيم بالبخار', 'TurboWash 360', 'ThinQ WiFi', 'محرك انفرتر'],
    media: [
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1626806775351-5c7e52dc29e6?auto=format&fit=crop&w=800&q=80' },
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80' },
    ],
    stock: 5
  },
  {
    id: '4',
    name: 'مكيف هواء سامسونج 12000 BTU',
    brand: 'Samsung',
    category: 'تكييف',
    description: 'مكيف هواء بتقنية WindFree، تبريد بدون هواء مباشر مزعج. تبريد سريع وفعال مع فلتر لتنقية الهواء من الغبار والبكتيريا.',
    totalPrice: 98000,
    plan: {
      months: 12,
      monthlyPrice: 8167
    },
    features: ['WindFree', 'Inverter Boost', 'فلتر مضاد للبكتيريا', 'هدوء تام', 'تبريد سريع'],
    media: [
      { type: MediaType.IMAGE, url: 'https://plus.unsplash.com/premium_photo-1677011984260-2646271a396e?q=80&w=800&auto=format&fit=crop' },
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1614631446501-abcf76949734?auto=format&fit=crop&w=800&q=80' },
    ],
    stock: 20
  },
  {
    id: '5',
    name: 'طباخة كوندور 5 شعلات',
    brand: 'Condor',
    category: 'أفران',
    description: 'طباخة عصرية من الإينوكس المقاوم للصدأ، أمان تام بفضل نظام Thermocouple، إشعال ذاتي، وشواية دجاج دوارة.',
    totalPrice: 55000,
    plan: {
      months: 10,
      monthlyPrice: 5500
    },
    features: ['Inox', 'Thermocouple Safety', 'شواية دجاج', 'مؤقت رقمي', '5 شعلات'],
    media: [
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1626143541742-9f8353322656?auto=format&fit=crop&w=800&q=80' },
      { type: MediaType.IMAGE, url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' },
    ],
    stock: 12
  }
];

export const MOCK_USERS: User[] = [
  {
    firstName: 'Karim',
    lastName: 'Benzine',
    birthDate: '1985-05-12',
    phone1: '0550123456',
    phone2: '0661123456',
    email: 'karim.benz@gmail.com',
    wilaya: 'الجزائر',
    baladyia: 'Bab Ezzouar',
    address: 'حي 5 جويلية عمارة أ رقم 12',
    ccpNumber: '12345678',
    ccpKey: '22',
    nin: '109850012345678901',
    ninExpiry: '2028-05-12',
    role: 'customer',
    registrationDate: '2023-01-15T10:00:00.000Z',
    lastLoginDate: '2023-10-25T14:30:00.000Z',
    idCardFront: 'karim_id_front.jpg',
    idCardBack: 'karim_id_back.jpg',
    chequeImage: 'karim_cheque.jpg',
    accountStatement: 'karim_releve.pdf'
  },
  {
    firstName: 'Amira',
    lastName: 'Saidi',
    birthDate: '1992-08-20',
    phone1: '0661987654',
    email: 'amira.saidi@yahoo.fr',
    wilaya: 'وهران',
    baladyia: 'Es Senia',
    address: 'شارع الأمير عبد القادر رقم 45',
    ccpNumber: '87654321',
    ccpKey: '99',
    nin: '109920098765432109',
    ninExpiry: '2030-01-01',
    role: 'customer',
    registrationDate: '2023-05-10T09:15:00.000Z',
    lastLoginDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    idCardFront: 'amira_id_front.jpg',
    idCardBack: 'amira_id_back.jpg',
    chequeImage: 'amira_cheque.jpg',
    accountStatement: 'amira_releve.pdf'
  },
  {
    firstName: 'Yacine',
    lastName: 'Brahimi',
    birthDate: '1988-11-03',
    phone1: '0770112233',
    email: 'yacine.brahimi@outlook.com',
    wilaya: 'سطيف',
    baladyia: 'El Eulma',
    address: 'حي دبي التجاري',
    ccpNumber: '11223344',
    ccpKey: '45',
    nin: '109880011223344556',
    ninExpiry: '2029-11-03',
    role: 'customer',
    registrationDate: '2023-08-20T16:45:00.000Z',
    lastLoginDate: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    idCardFront: 'yacine_id_front.jpg',
    idCardBack: 'yacine_id_back.jpg',
    chequeImage: 'yacine_cheque.jpg',
    accountStatement: 'yacine_releve.pdf'
  },
  {
    firstName: 'Ahmed',
    lastName: 'Ben Mohamed',
    birthDate: '1990-01-01',
    phone1: '0550000000',
    email: 'client@dzinstall.com',
    wilaya: 'أدرار',
    baladyia: 'Adrar Centre',
    address: 'Hay 5 Juillet',
    ccpNumber: '12345678',
    ccpKey: '99',
    nin: '1099000111222',
    ninExpiry: '2030-12-31',
    role: 'customer',
    registrationDate: '2023-01-01T10:00:00.000Z',
    lastLoginDate: new Date().toISOString(),
    idCardFront: 'ahmed_id.jpg',
    idCardBack: 'ahmed_id.jpg',
    chequeImage: 'ahmed_cheque.jpg',
    accountStatement: 'ahmed_releve.pdf'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: '1001',
    productId: '1',
    productName: 'تلفاز كوندور 55 بوصة 4K Smart',
    productImage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
    customerName: 'Karim Benzine',
    customerPhone: '0550123456',
    wilaya: 'الجزائر',
    status: OrderStatus.APPROVED,
    date: '2023-10-01',
    monthlyPrice: 7084, // 85000 / 12
    months: 12,
    preliminaryApprovalDate: '2023-10-02',
    filesReceiptDate: '2023-10-04'
  },
  {
    id: '1002',
    productId: '2',
    productName: 'ثلاجة براندت 420 لتر',
    productImage: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80',
    customerName: 'Amira Saidi',
    customerPhone: '0661987654',
    wilaya: 'وهران',
    status: OrderStatus.PENDING,
    date: '2023-10-05',
    monthlyPrice: 6112, // 110000 / 18
    months: 18
  },
  {
    id: '1003',
    productId: '5',
    productName: 'طباخة كوندور 5 شعلات',
    productImage: 'https://images.unsplash.com/photo-1626143541742-9f8353322656?auto=format&fit=crop&w=800&q=80',
    customerName: 'Yacine Brahimi',
    customerPhone: '0770112233',
    wilaya: 'سطيف',
    status: OrderStatus.REJECTED,
    date: '2023-10-02',
    monthlyPrice: 5500, // 55000 / 10
    months: 10,
    rejectionReason: 'كشف الحساب غير كافي لتغطية القسط الشهري.',
    rejectionDate: '2023-10-03'
  },
  {
    id: '1004',
    productId: '4',
    productName: 'مكيف هواء سامسونج 12000 BTU',
    productImage: 'https://plus.unsplash.com/premium_photo-1677011984260-2646271a396e?q=80&w=800&auto=format&fit=crop',
    customerName: 'Karim Benzine',
    customerPhone: '0550123456',
    wilaya: 'الجزائر',
    status: OrderStatus.WAITING_FOR_FILES,
    date: '2023-10-10',
    monthlyPrice: 8167, // 98000 / 12
    months: 12,
    preliminaryApprovalDate: '2023-10-11',
    deliveryCompany: 'Yalidine Express',
    trackingNumber: 'YAL-123456789'
  }
];
