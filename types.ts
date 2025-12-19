
export interface InstallmentPlan {
  months: number;
  monthlyPrice: number;
}

export enum MediaType {
  IMAGE = 'IMAGE'
}

export interface MediaItem {
  type: MediaType;
  url: string;
  thumbnail?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  purchasePrice?: number; // Added purchase price
  totalPrice: number;
  plan: InstallmentPlan;
  media: MediaItem[];
  features: string[];
  stock?: number; // Quantity in warehouse
}

export enum OrderStatus {
  PENDING = 'قيد الانتظار',
  WAITING_FOR_FILES = 'انتظار الملفات',
  READY_FOR_SHIPPING = 'جاهز للإرسال',
  APPROVED = 'مقبول',
  REJECTED = 'مرفوض',
  DELIVERED = 'تم الإرسال',
  COMPLETED = 'تم الاستلام'
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerPhone: string;
  wilaya: string;
  status: OrderStatus;
  date: string;
  monthlyPrice: number;
  months: number;
  rejectionReason?: string;
  rejectionDate?: string;
  preliminaryApprovalDate?: string;
  filesReceiptDate?: string;
  shippedDate?: string;
  arrivalDate?: string;
  
  // Customer sending files info
  deliveryCompany?: string;
  trackingNumber?: string;
  
  // Admin sending product info
  shippingCompany?: string;
  shippingTrackingNumber?: string;
}

export interface User {
  firstName: string; // Latin only
  lastName: string;  // Latin only
  birthDate: string;
  phone1: string;
  phone2?: string;
  email: string;
  wilaya: string;
  baladyia: string;
  address: string;
  ccpNumber: string;
  ccpKey: string;
  nin: string; // National ID Number
  ninExpiry: string;
  role?: 'admin' | 'customer';
  registrationDate?: string; // New field
  lastLoginDate?: string;    // New field
  // In a real app, these would be URLs. For now, we store filenames/flags
  idCardFront?: string;
  idCardBack?: string;
  chequeImage?: string;
  accountStatement?: string;
}
