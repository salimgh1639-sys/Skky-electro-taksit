import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User, Product, MediaType } from '../types';
import { TrendingUp, Users, ShoppingBag, Clock, CheckCircle, XCircle, Search, LayoutDashboard, FileCheck, Menu, X, ArrowLeft, Calendar, UserPlus, AlertCircle, Lock, User as UserIcon, Phone, Mail, MapPin, CreditCard, FileText, Upload, Eye, FolderOpen, FolderCheck, Truck, PackageCheck, History, CalendarDays, Copy, Send, Circle, Archive, Printer, Gift, ZoomIn, Briefcase, Hash, Wallet, BarChart3, ListFilter, Bell, Plus, Image, Trash2, Package, Tag, Layers, Warehouse, ChevronDown, Receipt, ShieldCheck, Pencil, Banknote, UserCheck, Save, ArrowRightLeft } from 'lucide-react';
import { ALGERIA_WILAYAS, DELIVERY_COMPANIES } from '../constants';
import Button from './Button';

interface AdminDashboardProps {
  orders: Order[];
  users?: User[];
  products?: Product[];
  onUpdateStatus: (orderId: string, status: OrderStatus, reason?: string, deliveryData?: { deliveryCompany: string, trackingNumber: string }) => void;
  onAddUser?: (user: User) => void;
  onAddProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, users = [], products = [], onUpdateStatus, onAddUser, onAddProduct, onEditProduct, onDeleteProduct }) => {
  const activeViewInitial = (localStorage.getItem('dz_admin_view') as 'dashboard' | 'approvals' | 'customers' | 'products' | 'accounts' | 'bulk_payments') || 'dashboard';
  const [activeView, setActiveView] = useState<'dashboard' | 'approvals' | 'customers' | 'products' | 'accounts' | 'bulk_payments'>(activeViewInitial);
  
  const [activeApprovalTab, setActiveApprovalTab] = useState<'all_transactions' | 'preliminary' | 'waiting_files' | 'ready_shipping' | 'shipped' | 'final'>('all_transactions');
  const [activeAccountsTab, setActiveAccountsTab] = useState<'active' | 'history'>('active');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Products View State
  const [showProductsTable, setShowProductsTable] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);

  // Payment Records State
  const [paymentRecords, setPaymentRecords] = useState<Record<string, number[]>>({}); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);

  // Bulk Payment State
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [bulkPayments, setBulkPayments] = useState<Array<{id: string, ccp: string, amount: string, customerName: string, orderId: string | null}>>([
    { id: '1', ccp: '', amount: '', customerName: '', orderId: null }
  ]);

  // Shipping Inputs State
  const [shippingUpdates, setShippingUpdates] = useState<Record<string, { company: string, tracking: string }>>({});
  const [shippingErrors, setShippingErrors] = useState<Record<string, boolean>>({});

  // Modals State
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // New Product State
  const initialProductState = {
     name: '', brand: '', category: '', description: '', purchasePrice: '', totalPrice: '', months: '', features: '', stock: ''
  };
  const [newProduct, setNewProduct] = useState(initialProductState);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Images
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Selection State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [viewImage, setViewImage] = useState<{ url: string, title: string } | null>(null);
  
  // Action Modals
  const [rejectModal, setRejectModal] = useState<{ show: boolean, orderId: string | null }>({ show: false, orderId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmReceiptModal, setConfirmReceiptModal] = useState<{ show: boolean, order: Order | null }>({ show: false, order: null });
  const [deleteProductModal, setDeleteProductModal] = useState<{ show: boolean, productId: string | null }>({ show: false, productId: null });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deliveryUpdates, setDeliveryUpdates] = useState<string[]>([]);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // Form Data
  const [fieldWarning, setFieldWarning] = useState<{field: string, msg: string} | null>(null);
  const [error, setError] = useState('');
  
  const initialFormState = {
    firstName: '', lastName: '', birthDate: '', phone1: '', phone2: '', email: '', password: '', confirmPassword: '',
    wilaya: ALGERIA_WILAYAS[0], baladyia: '', address: '', ccpNumber: '', ccpKey: '', nin: '', ninExpiry: ''
  };
  const [formData, setFormData] = useState<User & { password: string; confirmPassword: string }>(initialFormState);
  
  const [files, setFiles] = useState<{
    idCardFront: File | null;
    idCardBack: File | null;
    chequeImage: File | null;
    accountStatement: File | null;
  }>({
    idCardFront: null,
    idCardBack: null,
    chequeImage: null,
    accountStatement: null,
  });

  useEffect(() => {
    try {
        const storedUpdates = JSON.parse(localStorage.getItem('dz_admin_delivery_updates') || '[]');
        setDeliveryUpdates(storedUpdates);
        
        if (storedUpdates.length > 0) {
            setShowUpdateToast(true);
            setTimeout(() => setShowUpdateToast(false), 5000);
        }

        const storedPayments = JSON.parse(localStorage.getItem('dz_admin_payments') || '{}');
        setPaymentRecords(storedPayments);
    } catch (e) {
        console.error("Error loading local data");
    }
  }, [orders]);

  const clearDeliveryUpdate = (orderId: string) => {
    const updated = deliveryUpdates.filter(id => id !== orderId);
    setDeliveryUpdates(updated);
    localStorage.setItem('dz_admin_delivery_updates', JSON.stringify(updated));
  };

  const handleTogglePaymentMonth = (orderId: string, monthIndex: number) => {
      setPaymentRecords(prev => {
          const currentPaid = prev[orderId] || [];
          let updatedPaid;
          if (currentPaid.includes(monthIndex)) {
              updatedPaid = currentPaid.filter(m => m !== monthIndex);
          } else {
              updatedPaid = [...currentPaid, monthIndex];
          }
          const newState = { ...prev, [orderId]: updatedPaid };
          localStorage.setItem('dz_admin_payments', JSON.stringify(newState));
          return newState;
      });
  };

  const openPaymentModal = (order: Order) => {
      setSelectedPaymentOrder(order);
      setShowPaymentModal(true);
  };

  const handleBulkPaymentChange = (id: string, field: 'ccp' | 'amount', value: string) => {
    setBulkPayments(prev => {
        const newData = prev.map(row => {
            if (row.id !== id) return row;
            
            const updatedRow = { ...row, [field]: value };
            
            if (field === 'ccp') {
                const user = users.find(u => u.ccpNumber === value);
                if (user) {
                    updatedRow.customerName = `${user.firstName} ${user.lastName}`;
                    const activeOrder = orders.find(o => 
                        o.customerPhone === user.phone1 && 
                        (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED)
                    );
                    updatedRow.orderId = activeOrder ? activeOrder.id : null;
                } else {
                    updatedRow.customerName = '';
                    updatedRow.orderId = null;
                }
            }
            return updatedRow;
        });

        const lastIndex = newData.length - 1;
        if (lastIndex >= 0 && newData[lastIndex].id === id && field === 'ccp' && value.length > 0) {
             newData.push({ id: (Date.now() + Math.random()).toString(), ccp: '', amount: '', customerName: '', orderId: null });
        }

        return newData;
    });
  };

  const addBulkPaymentRow = () => {
    setBulkPayments(prev => [
        ...prev, 
        { id: (Date.now() + Math.random()).toString(), ccp: '', amount: '', customerName: '', orderId: null }
    ]);
  };

  const removeBulkPaymentRow = (id: string) => {
    if (bulkPayments.length > 1) {
        setBulkPayments(prev => prev.filter(row => row.id !== id));
    }
  };

  const submitBulkPayments = () => {
    let updatesCount = 0;
    const newPaymentRecords = { ...paymentRecords };

    bulkPayments.forEach(row => {
        if (row.orderId && row.amount) {
            const currentPaid = newPaymentRecords[row.orderId] || [];
            const order = orders.find(o => o.id === row.orderId);
            
            if (order) {
                let nextMonthIndex = -1;
                for(let i=0; i<order.months; i++) {
                    if (!currentPaid.includes(i)) {
                        nextMonthIndex = i;
                        break;
                    }
                }

                if (nextMonthIndex !== -1) {
                    newPaymentRecords[row.orderId] = [...currentPaid, nextMonthIndex];
                    updatesCount++;
                }
            }
        }
    });

    if (updatesCount > 0) {
        setPaymentRecords(newPaymentRecords);
        localStorage.setItem('dz_admin_payments', JSON.stringify(newPaymentRecords));
        setBulkPayments([{ id: '1', ccp: '', amount: '', customerName: '', orderId: null }]);
        alert(`تم تسجيل ${updatesCount} دفعة بنجاح!`);
    } else {
        alert('لم يتم تسجيل أي دفعات. تأكد من صحة أرقام CCP والمبالغ.');
    }
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const waitingFilesOrdersCount = orders.filter(o => o.status === OrderStatus.WAITING_FOR_FILES).length;
  const readyShippingOrdersCount = orders.filter(o => o.status === OrderStatus.READY_FOR_SHIPPING).length;
  const shippedOrdersCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
  const finalOrdersCount = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
  
  const activeCustomers = users.length;

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const preliminaryList = filteredOrders.filter(o => o.status === OrderStatus.PENDING);
  const waitingFilesList = filteredOrders.filter(o => o.status === OrderStatus.WAITING_FOR_FILES);
  const readyShippingList = filteredOrders.filter(o => o.status === OrderStatus.READY_FOR_SHIPPING);
  const shippedList = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED);
  const finalList = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED);
  const historyList = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED);

  const filteredCustomers = users.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = ((customer.firstName || '') + ' ' + (customer.lastName || '')).toLowerCase();
    const phone = (customer.phone1 || '');
    const ccp = (customer.ccpNumber || '');
    const nin = (customer.nin || '');
    return fullName.includes(searchLower) || phone.includes(searchLower) || ccp.includes(searchLower) || nin.includes(searchLower);
  });

  const latinRegex = /^[A-Za-z\s]+$/;

  const handleViewChange = (view: 'dashboard' | 'approvals' | 'customers' | 'products' | 'accounts' | 'bulk_payments') => {
    setActiveView(view);
    localStorage.setItem('dz_admin_view', view);
    setIsSidebarOpen(false);
    setSearchTerm('');
  }

  const handleShippingInputChange = (orderId: string, field: 'company' | 'tracking', value: string) => {
    setShippingUpdates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
    if (shippingErrors[orderId]) {
      setShippingErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[orderId];
        return newErrors;
      });
    }
  };

  const handleSendOrder = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const currentCompany = shippingUpdates[order.id]?.company || '';
    const currentTracking = shippingUpdates[order.id]?.tracking || '';

    if (!currentCompany.trim() || !currentTracking.trim()) {
      setShippingErrors(prev => ({ ...prev, [order.id]: true }));
      return;
    }

    onUpdateStatus(
      order.id, 
      OrderStatus.DELIVERED, 
      undefined, 
      { deliveryCompany: currentCompany, trackingNumber: currentTracking }
    );
  };

  const handleConfirmReceipt = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setConfirmReceiptModal({ show: true, order });
  };

  const processReceiptConfirmation = () => {
    if (confirmReceiptModal.order) {
      onUpdateStatus(confirmReceiptModal.order.id, OrderStatus.COMPLETED);
      setConfirmReceiptModal({ show: false, order: null });
    }
  };

  const confirmDeleteProduct = () => {
    if (deleteProductModal.productId && onDeleteProduct) {
        onDeleteProduct(deleteProductModal.productId);
        setDeleteProductModal({ show: false, productId: null });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
         const date = new Date(dateStr);
         return date.toLocaleDateString('en-GB'); 
    }
    return dateStr;
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return 'غير متوفر';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `منذ ${days} يوم`;
    const months = Math.floor(days / 30);
    if (months < 12) return `منذ ${months} شهر`;
    return 'منذ أكثر من سنة';
  };

  const handleCopyTracking = (e: React.MouseEvent, tracking: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tracking);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      if (value !== '' && !latinRegex.test(value)) {
        setFieldWarning({ field: name, msg: 'يرجى الكتابة بالأحرف اللاتينية فقط' });
        return; 
      } else {
        setFieldWarning(null);
      }
    }
    if (name === 'ccpKey' && value.length > 2) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      setProductImages(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    if (!latinRegex.test(formData.firstName) || !latinRegex.test(formData.lastName)) {
      setError('الاسم واللقب يجب أن يكونا بالأحرف اللاتينية فقط');
      return;
    }
    if (users.some(u => u.email === formData.email)) { setError('البريد الإلكتروني مسجل مسبقاً'); return; }
    if (users.some(u => u.phone1 === formData.phone1)) { setError('رقم الهاتف مسجل مسبقاً'); return; }
    if (users.some(u => u.ccpNumber === formData.ccpNumber)) { setError('رقم CCP مسجل مسبقاً'); return; }
    if (users.some(u => u.nin === formData.nin)) { setError('رقم بطاقة التعريف مسجل مسبقاً'); return; }
    if (!files.idCardFront || !files.idCardBack || !files.chequeImage || !files.accountStatement) {
      setError('يرجى رفع جميع الوثائق المطلوبة');
      return;
    }
    const now = new Date().toISOString();
    const newUser: User = {
      ...formData,
      role: 'customer',
      registrationDate: now,
      lastLoginDate: now,
      idCardFront: files.idCardFront.name,
      idCardBack: files.idCardBack.name,
      chequeImage: files.chequeImage.name,
      accountStatement: files.accountStatement.name,
    };
    if (onAddUser) {
      onAddUser(newUser);
      setShowAddCustomer(false);
      setFormData(initialFormState);
      setFiles({
        idCardFront: null,
        idCardBack: null,
        chequeImage: null,
        accountStatement: null,
      });
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.totalPrice || !newProduct.months) {
        alert('يرجى ملء الحقول الأساسية');
        return;
    }
    if (imagePreviews.length === 0) {
        alert('يرجى إضافة صورة واحدة على الأقل');
        return;
    }
    const months = parseInt(newProduct.months);
    const totalPrice = parseInt(newProduct.totalPrice);
    const purchasePrice = newProduct.purchasePrice ? parseInt(newProduct.purchasePrice) : undefined;
    const stock = newProduct.stock ? parseInt(newProduct.stock) : 0;
    const monthlyPrice = Math.ceil(totalPrice / months);
    const mediaItems = imagePreviews.map(url => ({
        type: MediaType.IMAGE,
        url: url
    }));
    const product: Product = {
        id: editingProductId || Date.now().toString(),
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category || 'عام',
        description: newProduct.description,
        totalPrice: totalPrice,
        purchasePrice: purchasePrice,
        plan: { months: months, monthlyPrice: monthlyPrice },
        features: newProduct.features.split(',').map(f => f.trim()).filter(f => f),
        media: mediaItems,
        stock: stock
    };
    if (editingProductId && onEditProduct) {
        onEditProduct(product);
    } else if (onAddProduct) {
        onAddProduct(product);
    }
    closeProductModal();
  };

  const openEditProductModal = (product: Product) => {
    setNewProduct({
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        purchasePrice: product.purchasePrice ? product.purchasePrice.toString() : '',
        totalPrice: product.totalPrice.toString(),
        months: product.plan.months.toString(),
        features: product.features.join(', '),
        stock: product.stock ? product.stock.toString() : '0'
    });
    setImagePreviews(product.media.map(m => m.url));
    setEditingProductId(product.id);
    setShowAddProduct(true);
  };

  const closeProductModal = () => {
    setShowAddProduct(false);
    setNewProduct(initialProductState);
    setProductImages([]);
    setImagePreviews([]);
    setEditingProductId(null);
  };

  const handleOrderClick = (order: Order) => {
    if (deliveryUpdates.includes(order.id)) {
        clearDeliveryUpdate(order.id);
    }
    const customer = users.find(u => u.phone1 === order.customerPhone) || null;
    setSelectedCustomer(customer);
    setSelectedOrder(order);
  };

  const handleCustomerClick = (customer: User) => {
    setSelectedCustomer(customer);
    setSelectedOrder(null);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setSelectedCustomer(null);
  };

  const openRejectModal = (orderId: string) => {
    setRejectionReason('');
    setRejectModal({ show: true, orderId });
  };

  const confirmRejection = () => {
    if (rejectModal.orderId) {
      if (deliveryUpdates.includes(rejectModal.orderId)) {
        clearDeliveryUpdate(rejectModal.orderId);
      }
      onUpdateStatus(rejectModal.orderId, OrderStatus.REJECTED, rejectionReason);
      setRejectModal({ show: false, orderId: null });
      if (selectedOrder?.id === rejectModal.orderId) {
        closeOrderDetails();
      }
    }
  };

  const getDocumentUrl = (filename?: string) => {
    if (!filename) return '';
    if (filename.startsWith('http') || filename.startsWith('blob') || filename.startsWith('data')) return filename;
    return 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=1000&q=80';
  }

  const handleViewImage = (title: string, filename?: string) => {
    if (!filename) return;
    const url = getDocumentUrl(filename);
    setViewImage({ url, title });
  }

  const renderFileInput = (label: string, name: keyof typeof files) => (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
        <input 
          type="file" 
          accept="image/*"
          required
          onChange={(e) => handleFileChange(e, name)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          {files[name] ? (
             <CheckCircle className="text-emerald-500" size={32} />
          ) : (
             <Upload className="text-gray-400 group-hover:text-emerald-500 transition-colors" size={32} />
          )}
          <span className={`text-sm ${files[name] ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}>
            {files[name] ? files[name]?.name : 'اضغط لرفع الصورة'}
          </span>
        </div>
      </div>
    </div>
  );

  const SidebarItem = ({ id, icon: Icon, label }: { id: 'dashboard' | 'approvals' | 'customers' | 'products' | 'accounts' | 'bulk_payments', icon: any, label: string }) => (
    <button
      onClick={() => handleViewChange(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
        activeView === id 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const renderStatusText = (currentStatus: OrderStatus, step: 'preliminary' | 'waiting' | 'ready' | 'shipped') => {
    const isRejected = currentStatus === OrderStatus.REJECTED;
    if (isRejected) {
       return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md whitespace-nowrap">مرفوض</span>;
    }
    let isCompleted = false;
    let isCurrent = false;
    const isStatusOneOf = (s: OrderStatus, list: OrderStatus[]) => list.includes(s);

    switch (step) {
       case 'preliminary':
          isCurrent = currentStatus === OrderStatus.PENDING;
          isCompleted = currentStatus !== OrderStatus.PENDING;
          break;
       case 'waiting':
          isCurrent = currentStatus === OrderStatus.WAITING_FOR_FILES;
          isCompleted = isStatusOneOf(currentStatus, [OrderStatus.READY_FOR_SHIPPING, OrderStatus.DELIVERED, OrderStatus.COMPLETED]);
          break;
       case 'ready':
          isCurrent = currentStatus === OrderStatus.READY_FOR_SHIPPING;
          isCompleted = isStatusOneOf(currentStatus, [OrderStatus.DELIVERED, OrderStatus.COMPLETED]);
          break;
       case 'shipped':
          isCurrent = currentStatus === OrderStatus.DELIVERED;
          isCompleted = currentStatus === OrderStatus.COMPLETED;
          break;
    }
    if (isCompleted) return <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md whitespace-nowrap">مكتمل</span>;
    if (isCurrent) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md whitespace-nowrap animate-pulse">جاري</span>;
    return <span className="text-xs text-gray-300 font-bold">-</span>;
  };

  const hasWaitingFilesUpdates = deliveryUpdates.some(id => 
     orders.find(o => o.id === id)?.status === OrderStatus.WAITING_FOR_FILES
  );

  const InfoRow = ({ label, value, icon: Icon, copyable = false, highlight = false }: { label: string, value: string | undefined, icon?: any, copyable?: boolean, highlight?: boolean }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if(value) {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }
    
    return (
        <div className={`flex flex-col gap-1 ${highlight ? 'bg-white p-2 rounded-lg border border-gray-100 shadow-sm' : ''}`}>
            <span className="text-[10px] uppercase text-gray-400 font-bold flex items-center gap-1">
                {Icon && <Icon size={12} />}
                {label}
            </span>
            <div className={`font-bold text-gray-800 break-words flex items-center gap-2 ${highlight ? 'text-base' : 'text-sm'} ${copyable ? 'cursor-pointer hover:text-emerald-600' : ''}`} onClick={copyable ? handleCopy : undefined}>
                <span dir="auto">{value || '-'}</span>
                {copyable && value && (
                    copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-300" />
                )}
            </div>
        </div>
    );
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
      <div className="flex items-center gap-2 text-gray-800 font-bold text-xs sm:text-sm border-b pb-2 mb-2">
          <Icon size={16} className="text-emerald-600" />
          {title}
      </div>
  );

  return (
    <div className="flex min-h-[80vh] gap-6 relative">
      <button 
        className="md:hidden fixed bottom-6 left-6 z-50 bg-emerald-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`
        fixed md:relative inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 p-4 shadow-xl md:shadow-none md:bg-transparent md:border-none
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="mb-8 px-2">
           <h2 className="text-2xl font-extrabold text-gray-800">لوحة التحكم</h2>
           <p className="text-xs text-gray-400">الإصدار 1.0</p>
        </div>
        <div className="space-y-2">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="نظرة عامة" />
          <SidebarItem id="approvals" icon={FileCheck} label="الطلبات" />
          <SidebarItem id="accounts" icon={Wallet} label="إدارة الحسابات" />
          <SidebarItem id="bulk_payments" icon={Banknote} label="تسجيل الدفوعات" />
          <SidebarItem id="customers" icon={Users} label="الزبائن" />
          <SidebarItem id="products" icon={Package} label="المنتجات" />
        </div>
      </div>

      <div className="flex-1 overflow-x-hidden">
        {showUpdateToast && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-10 py-5 rounded-2xl shadow-2xl flex items-center gap-4 z-[60] animate-bounce-in border-2 border-indigo-400/50">
               <div className="bg-white/20 p-2 rounded-full">
                 <Bell className="text-yellow-300 animate-pulse" size={28} />
               </div>
               <span className="font-extrabold text-lg">يوجد تحديثات جديدة من الزبائن!</span>
            </div>
        )}

        {activeView === 'dashboard' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-800">الرئيسية</h2>
                  <p className="text-gray-500 text-sm">مرحباً بك في لوحة الإدارة</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full">
                  <LayoutDashboard size={24} />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                <button onClick={() => { handleViewChange('approvals'); setActiveApprovalTab('all_transactions'); }} className="bg-white aspect-square rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group relative">
                    <div className="p-4 rounded-full bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
                        <FileCheck size={40} />
                    </div>
                    {deliveryUpdates.length > 0 && (
                        <div className="absolute top-4 left-4 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                    )}
                    <span className="font-bold text-gray-700 text-lg">إدارة الطلبات</span>
                    <span className="text-xs font-bold text-gray-400">التحكم الكامل</span>
                </button>
                <button onClick={() => handleViewChange('accounts')} className="bg-white aspect-square rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group">
                    <div className="p-4 rounded-full bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                        <Wallet size={40} />
                    </div>
                    <span className="font-bold text-gray-700 text-lg">إدارة الحسابات</span>
                    <span className="text-xs font-bold text-gray-400">{finalOrdersCount} ملف نشط</span>
                </button>
                <button onClick={() => handleViewChange('bulk_payments')} className="bg-white aspect-square rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group">
                    <div className="p-4 rounded-full bg-cyan-50 text-cyan-600 group-hover:scale-110 transition-transform">
                        <Banknote size={40} />
                    </div>
                    <span className="font-bold text-gray-700 text-lg">إدخال الدفوعات</span>
                    <span className="text-xs font-bold text-gray-400">تسجيل سريع</span>
                </button>
                <button onClick={() => handleViewChange('customers')} className="bg-white aspect-square rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group">
                    <div className="p-4 rounded-full bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                        <Users size={40} />
                    </div>
                    <span className="font-bold text-gray-700 text-lg">الزبائن</span>
                    <span className="text-xs font-bold text-gray-400">{activeCustomers} مسجل</span>
                </button>
                <button onClick={() => handleViewChange('products')} className="bg-white aspect-square rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all group">
                    <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                        <Package size={40} />
                    </div>
                    <span className="font-bold text-gray-700 text-lg">إدارة المنتجات</span>
                    <span className="text-xs font-bold text-gray-400">{products.length} منتج</span>
                </button>
            </div>
          </div>
        )}

        {/* Bulk Payments View */}
        {activeView === 'bulk_payments' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleViewChange('dashboard')}
                    className="flex items-center gap-2 p-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-95"
                  >
                    <ArrowLeft size={20} />
                    <span className="font-bold text-xs hidden sm:inline">الرجوع للرئيسية</span>
                  </button>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Banknote className="text-cyan-600" size={24} />
                    تسجيل الدفوعات المتعددة
                  </h3>
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={submitBulkPayments} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-transform active:scale-95">
                      <Save size={18} /> حفظ الكل
                  </button>
               </div>
            </div>

            <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                            <tr>
                                <th className="p-4 min-w-[140px]">رقم الحساب البريدي (CCP)</th>
                                <th className="p-4 min-w-[100px]">مبلغ القسط (دج)</th>
                                <th className="p-4 min-w-[180px]">اسم الزبون (تلقائي)</th>
                                <th className="p-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bulkPayments.map((row, index) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={row.ccp}
                                                onChange={(e) => handleBulkPaymentChange(row.id, 'ccp', e.target.value)}
                                                placeholder="رقم CCP"
                                                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-cyan-500 outline-none transition-colors font-mono text-lg"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <input 
                                            type="number" 
                                            value={row.amount}
                                            onChange={(e) => handleBulkPaymentChange(row.id, 'amount', e.target.value)}
                                            placeholder="المبلغ"
                                            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-cyan-500 outline-none transition-colors font-bold text-gray-700"
                                        />
                                    </td>
                                    <td className="p-4">
                                        {row.customerName ? (
                                            <div className="flex items-center gap-3 text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                                                <div className="bg-green-200 p-1 rounded-full"><UserCheck size={16} /></div>
                                                {row.customerName}
                                            </div>
                                        ) : row.ccp.length > 5 ? (
                                            <div className="flex items-center gap-3 text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                                                <AlertCircle size={16} />
                                                زبون غير موجود
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-xs font-medium bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
                                                أدخل رقم CCP
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {bulkPayments.length > 1 && (
                                            <button onClick={() => removeBulkPaymentRow(row.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {/* Accounts Management View */}
        {activeView === 'accounts' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
               <div className="flex flex-col gap-4 mb-4">
                   <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                       <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button 
                            onClick={() => handleViewChange('dashboard')}
                            className="flex items-center gap-2 p-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-95"
                          >
                            <ArrowLeft size={20} />
                            <span className="font-bold text-xs hidden sm:inline">الرجوع للرئيسية</span>
                          </button>
                          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Wallet className="text-emerald-600" size={24} />
                            إدارة الحسابات
                          </h3>
                       </div>
                   </div>

                   <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full sm:w-auto self-start">
                        <button 
                            onClick={() => setActiveAccountsTab('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeAccountsTab === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            الحسابات النشطة
                        </button>
                        <button 
                            onClick={() => setActiveAccountsTab('history')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeAccountsTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            سجل العمليات
                        </button>
                   </div>

                   <div className="relative w-full sm:w-64 mr-auto">
                      <input 
                        type="text" 
                        placeholder="بحث في الحسابات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 pr-10 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                   </div>
               </div>
            </div>
            
            <div className="overflow-x-auto">
                {activeAccountsTab === 'active' ? (
                  finalList.length > 0 ? (
                    <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-6 py-3 whitespace-nowrap">الزبون</th>
                          <th className="px-6 py-3 whitespace-nowrap">المنتج</th>
                          <th className="px-6 py-3 whitespace-nowrap">المبلغ الإجمالي</th>
                          <th className="px-6 py-3 whitespace-nowrap">القسط الشهري</th>
                          <th className="px-6 py-3 whitespace-nowrap">الأشهر المتبقية</th>
                          <th className="px-6 py-3 whitespace-nowrap">الدين المتبقي</th>
                          <th className="px-6 py-3 whitespace-nowrap text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {finalList.map((order) => {
                          const paidMonths = paymentRecords[order.id]?.length || 0;
                          const remainingMonths = Math.max(0, order.months - paidMonths);
                          const remainingDebt = remainingMonths * order.monthlyPrice;
                          
                          return (
                          <tr key={order.id} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                               <div>
                                  <div className="font-bold text-gray-900">{order.customerName}</div>
                                  <div className="text-xs text-gray-500 font-mono">{order.customerPhone}</div>
                               </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">{order.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج <span className="text-gray-400 text-xs">/ {order.months} شهر</span></td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                   <span className="font-bold text-gray-800">{remainingMonths}</span>
                                   <span className="text-xs text-gray-500">من أصل {order.months}</span>
                                </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`font-bold ${remainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                   {remainingDebt.toLocaleString()} دج
                                </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-center">
                               <button 
                                  onClick={() => openPaymentModal(order)}
                                  className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-transform active:scale-95"
                               >
                                  <Banknote size={14} /> تسجيل دفع
                               </button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                       <Wallet size={48} className="mb-3 opacity-20" />
                       <p>لا توجد حسابات نشطة حالياً</p>
                       <p className="text-xs mt-1">تظهر هنا الطلبات التي تم استلامها من قبل الزبائن</p>
                    </div>
                  )
                ) : (
                  historyList.length > 0 ? (
                    <table className="w-full text-right text-sm min-w-[1200px]">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-6 py-3 whitespace-nowrap">الاسم واللقب</th>
                          <th className="px-6 py-3 whitespace-nowrap">المنتج</th>
                          <th className="px-6 py-3 whitespace-nowrap">السعر</th>
                          <th className="px-6 py-3 whitespace-nowrap">سعر القسط</th>
                          <th className="px-6 py-3 whitespace-nowrap">عدد الأشهر</th>
                          <th className="px-6 py-3 whitespace-nowrap text-center">الأشهر المدفوعة</th>
                          <th className="px-6 py-3 whitespace-nowrap text-center">الأشهر الباقية</th>
                          <th className="px-6 py-3 whitespace-nowrap">المبلغ المدفوع</th>
                          <th className="px-6 py-3 whitespace-nowrap">المبلغ المتبقي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyList.map((order) => {
                          const paidMonths = paymentRecords[order.id]?.length || 0;
                          const remainingMonths = Math.max(0, order.months - paidMonths);
                          const totalPaidAmount = paidMonths * order.monthlyPrice;
                          const remainingAmount = remainingMonths * order.monthlyPrice;
                          
                          return (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{order.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">{order.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.monthlyPrice.toLocaleString()} دج</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold">{order.months}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-green-600">{paidMonths}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-orange-600">{remainingMonths}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-green-700">{totalPaidAmount.toLocaleString()} دج</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">{remainingAmount.toLocaleString()} دج</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                       <History size={48} className="mb-3 opacity-20" />
                       <p>لا يوجد سجل عمليات حالياً</p>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* Approvals View */}
        {activeView === 'approvals' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleViewChange('dashboard')}
                    className="flex items-center gap-2 p-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-95"
                  >
                    <ArrowLeft size={20} />
                    <span className="font-bold text-xs hidden sm:inline">الرجوع للرئيسية</span>
                  </button>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileCheck className="text-emerald-600" size={24} />
                    إدارة الطلبات
                  </h3>
                </div>
                <div className="relative w-full sm:w-64">
                  <input 
                    type="text" 
                    placeholder="بحث باسم الزبون أو المنتج..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 pr-10 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                 <button onClick={() => setActiveApprovalTab('preliminary')} className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all duration-200 border h-24 ${activeApprovalTab === 'preliminary' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-105' : 'bg-white border-amber-100 text-amber-500 hover:border-amber-300 hover:bg-amber-50'}`}>
                    <Clock size={24} />
                    <span className="text-xs font-bold">الموافقة الأولية</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeApprovalTab === 'preliminary' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}>{pendingOrders}</span>
                 </button>
                 <button onClick={() => setActiveApprovalTab('waiting_files')} className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all duration-200 border h-24 relative ${activeApprovalTab === 'waiting_files' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-white border-blue-100 text-blue-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <FileText size={24} />
                    {hasWaitingFilesUpdates && (<div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>)}
                    <span className="text-xs font-bold">انتظار الملفات</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeApprovalTab === 'waiting_files' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>{waitingFilesOrdersCount}</span>
                 </button>
                 <button onClick={() => setActiveApprovalTab('ready_shipping')} className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all duration-200 border h-24 ${activeApprovalTab === 'ready_shipping' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-105' : 'bg-white border-purple-100 text-purple-600 hover:border-purple-300 hover:bg-purple-50'}`}>
                    <PackageCheck size={24} />
                    <span className="text-xs font-bold">جاهز للإرسال</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeApprovalTab === 'ready_shipping' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>{readyShippingOrdersCount}</span>
                 </button>
                 <button onClick={() => setActiveApprovalTab('shipped')} className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all duration-200 border h-24 ${activeApprovalTab === 'shipped' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200 scale-105' : 'bg-white border-cyan-100 text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50'}`}>
                    <Truck size={24} />
                    <span className="text-xs font-bold">تم الإرسال</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeApprovalTab === 'shipped' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-600'}`}>{shippedOrdersCount}</span>
                 </button>
                 <button onClick={() => setActiveApprovalTab('final')} className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all duration-200 border h-24 ${activeApprovalTab === 'final' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white border-emerald-100 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                    <Archive size={24} />
                    <span className="text-xs font-bold">الأرشيف</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeApprovalTab === 'final' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{finalOrdersCount}</span>
                 </button>
                 <button onClick={() => setActiveApprovalTab('all_transactions')} className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all duration-200 border h-24 relative ${activeApprovalTab === 'all_transactions' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <ListFilter size={24} className={activeApprovalTab === 'all_transactions' ? 'animate-pulse' : ''} />
                    <span className="text-xs font-bold">كل المعاملات</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeApprovalTab === 'all_transactions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{totalOrders}</span>
                 </button>
              </div>

              {activeApprovalTab === 'ready_shipping' && (
                  <div className="mt-4 flex justify-end"><button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-900 shadow-md transition-transform active:scale-95"><Printer size={16} /><span>طباعة القائمة</span></button></div>
              )}
              {activeApprovalTab === 'shipped' && (
                  <div className="mt-4 flex justify-end"><button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-transform active:scale-95"><Printer size={16} /><span>طباعة للإرسال للبريد</span></button></div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  {activeApprovalTab === 'all_transactions' ? (
                     <tr>
                        <th className="px-6 py-2 whitespace-nowrap">الاسم واللقب</th>
                        <th className="px-6 py-2 whitespace-nowrap">المنتج</th>
                        <th className="px-6 py-2 whitespace-nowrap">السعر</th>
                        <th className="px-6 py-2 whitespace-nowrap">سعر القسط</th>
                        <th className="px-6 py-2 whitespace-nowrap">عدد الأشهر</th>
                        <th className="px-6 py-2 whitespace-nowrap text-center">الموافقة الأولية</th>
                        <th className="px-6 py-2 whitespace-nowrap text-center">انتظار الملفات</th>
                        <th className="px-6 py-2 whitespace-nowrap text-center">جاهز للإرسال</th>
                        <th className="px-6 py-2 whitespace-nowrap text-center">تم الإرسال</th>
                     </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-2 whitespace-nowrap">الزبون</th>
                      <th className="px-6 py-2 whitespace-nowrap">المنتج</th>
                      <th className="px-6 py-2 whitespace-nowrap">سعر المنتج</th>
                      <th className="px-6 py-2 whitespace-nowrap">القسط الشهري</th>
                      <th className="px-6 py-2 whitespace-nowrap">عدد الأشهر</th>
                      {(activeApprovalTab === 'waiting_files' || activeApprovalTab === 'ready_shipping' || activeApprovalTab === 'shipped' || activeApprovalTab === 'final') && <th className="px-6 py-2 whitespace-nowrap text-center">معلومات الإرسال</th>}
                      <th className="px-6 py-2 whitespace-nowrap text-center">الحالة</th>
                      <th className="px-6 py-2 whitespace-nowrap text-center">الإجراءات</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {activeApprovalTab === 'all_transactions' && filteredOrders.map(order => (
                       <tr key={order.id} onClick={() => handleOrderClick(order)} className="hover:bg-gray-50/80 transition-colors cursor-pointer">
                          <td className="px-6 py-2 whitespace-nowrap"><div className="font-bold text-gray-900">{order.customerName}</div></td>
                          <td className="px-6 py-2 whitespace-nowrap text-gray-700">{order.productName}</td>
                          <td className="px-6 py-2 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                          <td className="px-6 py-2 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج</td>
                          <td className="px-6 py-2 whitespace-nowrap text-gray-600">{order.months}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-center">{renderStatusText(order.status, 'preliminary')}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-center">{renderStatusText(order.status, 'waiting')}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-center">{renderStatusText(order.status, 'ready')}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-center">{renderStatusText(order.status, 'shipped')}</td>
                       </tr>
                    ))}
                    {/* ... other tabs ... */}
                    {activeApprovalTab === 'preliminary' && preliminaryList.map(order => (
                        <tr key={order.id} onClick={() => handleOrderClick(order)} className="hover:bg-gray-50/80 transition-colors cursor-pointer">
                             <td className="px-6 py-2 whitespace-nowrap"><div className="font-bold">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerPhone}</div></td>
                             <td className="px-6 py-2 whitespace-nowrap">{order.productName}</td>
                             <td className="px-6 py-2 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap text-gray-600">{order.months} أشهر</td>
                             <td className="px-6 py-2 whitespace-nowrap text-center"><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">{order.status}</span></td>
                             <td className="px-6 py-2 whitespace-nowrap">
                                <div className="flex justify-center gap-2">
                                  <button onClick={(e) => {e.stopPropagation(); onUpdateStatus(order.id, OrderStatus.WAITING_FOR_FILES)}} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">موافقة</button>
                                  <button onClick={(e) => {e.stopPropagation(); openRejectModal(order.id)}} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">رفض</button>
                                </div>
                             </td>
                        </tr>
                    ))}
                    {activeApprovalTab === 'waiting_files' && waitingFilesList.map(order => {
                        const hasUpdate = deliveryUpdates.includes(order.id);
                        return (
                        <tr key={order.id} onClick={() => handleOrderClick(order)} className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${hasUpdate ? 'bg-blue-50/50 border-r-4 border-blue-500' : ''}`}>
                             <td className="px-6 py-2 whitespace-nowrap">
                                <div className="font-bold">{order.customerName}</div>
                                <div className="text-xs text-gray-500">{order.customerPhone}</div>
                                {hasUpdate && <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full inline-block mt-1 animate-pulse">تحديث جديد</span>}
                             </td>
                             <td className="px-6 py-2 whitespace-nowrap">{order.productName}</td>
                             <td className="px-6 py-2 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap text-gray-600">{order.months} أشهر</td>
                             <td className="px-6 py-2 whitespace-nowrap text-center">
                                {order.deliveryCompany ? (
                                    <div className="flex flex-col gap-1 items-center">
                                        <div className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{order.deliveryCompany}</div>
                                        {order.trackingNumber && (
                                            <button onClick={(e) => handleCopyTracking(e, order.trackingNumber || '', order.id)} className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-all border ${copiedId === order.id ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100'}`} title="نسخ رقم التتبع">
                                                {copiedId === order.id ? <CheckCircle size={10} /> : <Copy size={10} />}
                                                {order.trackingNumber}
                                            </button>
                                        )}
                                    </div>
                                ) : <span className="text-xs text-amber-600">انتظار...</span>}
                             </td>
                             <td className="px-6 py-2 whitespace-nowrap text-center"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{order.status}</span></td>
                             <td className="px-6 py-2 whitespace-nowrap">
                                <div className="flex justify-center gap-2">
                                  <button onClick={(e) => {
                                      e.stopPropagation(); 
                                      if (deliveryUpdates.includes(order.id)) clearDeliveryUpdate(order.id);
                                      onUpdateStatus(order.id, OrderStatus.READY_FOR_SHIPPING);
                                  }} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> قبول</button>
                                  <button onClick={(e) => {e.stopPropagation(); openRejectModal(order.id)}} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">رفض</button>
                                </div>
                             </td>
                        </tr>
                    )})}
                    {activeApprovalTab === 'ready_shipping' && readyShippingList.map(order => (
                         <tr key={order.id} onClick={() => handleOrderClick(order)} className="hover:bg-gray-50/80 transition-colors cursor-pointer">
                             <td className="px-6 py-2 whitespace-nowrap"><div className="font-bold">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerPhone}</div></td>
                             <td className="px-6 py-2 whitespace-nowrap">{order.productName}</td>
                             <td className="px-6 py-2 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap text-gray-600">{order.months} أشهر</td>
                             <td className="px-6 py-2 whitespace-nowrap">
                                <div className="flex flex-col gap-2 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                                   <select value={shippingUpdates[order.id]?.company || ''} onChange={(e) => handleShippingInputChange(order.id, 'company', e.target.value)} className={`w-full text-xs border rounded p-1.5 focus:outline-none focus:border-emerald-500 bg-white ${shippingErrors[order.id] && !shippingUpdates[order.id]?.company ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                      <option value="">اختر شركة التوصيل</option>
                                      {DELIVERY_COMPANIES.map(company => <option key={company} value={company}>{company}</option>)}
                                   </select>
                                   <input type="text" placeholder="رقم التتبع (اجباري)" value={shippingUpdates[order.id]?.tracking || ''} onChange={(e) => handleShippingInputChange(order.id, 'tracking', e.target.value)} className={`w-full text-xs border rounded p-1.5 focus:outline-none focus:border-emerald-500 font-mono ${shippingErrors[order.id] && !shippingUpdates[order.id]?.tracking ? 'border-red-500 bg-red-50 placeholder-red-400' : 'border-gray-200'}`} />
                                </div>
                             </td>
                             <td className="px-6 py-2 whitespace-nowrap text-center"><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{order.status}</span></td>
                             <td className="px-6 py-2 whitespace-nowrap">
                                <div className="flex justify-center gap-2">
                                  <button onClick={(e) => handleSendOrder(e, order)} className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 flex items-center gap-1 shadow-lg shadow-gray-200"><Send size={12}/> ارسال</button>
                                </div>
                             </td>
                        </tr>
                    ))}
                    {activeApprovalTab === 'shipped' && shippedList.map(order => (
                         <tr key={order.id} onClick={() => handleOrderClick(order)} className="hover:bg-gray-50/80 transition-colors cursor-pointer">
                             <td className="px-6 py-2 whitespace-nowrap"><div className="font-bold">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerPhone}</div></td>
                             <td className="px-6 py-2 whitespace-nowrap">{order.productName}</td>
                             <td className="px-6 py-2 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap text-gray-600">{order.months} أشهر</td>
                             <td className="px-6 py-2 whitespace-nowrap text-center">
                                {order.shippingCompany ? (
                                    <div className="flex flex-col gap-1 items-center">
                                        <div className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{order.shippingCompany}</div>
                                        {order.shippingTrackingNumber && (
                                            <button onClick={(e) => handleCopyTracking(e, order.shippingTrackingNumber || '', order.id)} className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-all border ${copiedId === order.id ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100'}`} title="نسخ رقم التتبع">
                                                {copiedId === order.id ? <CheckCircle size={10} /> : <Copy size={10} />}
                                                {order.shippingTrackingNumber}
                                            </button>
                                        )}
                                    </div>
                                ) : <span className="text-gray-400 text-xs">-</span>}
                             </td>
                             <td className="px-6 py-2 whitespace-nowrap text-center"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{order.status}</span></td>
                             <td className="px-6 py-2 whitespace-nowrap text-center">
                                 <button onClick={(e) => handleConfirmReceipt(e, order)} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1 shadow-lg shadow-emerald-200 mx-auto transition-transform active:scale-95">
                                    <PackageCheck size={14} /> تم الوصول
                                 </button>
                             </td>
                        </tr>
                    ))}
                    {activeApprovalTab === 'final' && finalList.map(order => (
                         <tr key={order.id} onClick={() => handleOrderClick(order)} className="hover:bg-gray-50/80 transition-colors cursor-pointer">
                             <td className="px-6 py-2 whitespace-nowrap"><div className="font-bold">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerPhone}</div></td>
                             <td className="px-6 py-2 whitespace-nowrap">{order.productName}</td>
                             <td className="px-6 py-2 whitespace-nowrap font-bold text-emerald-700">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap font-medium">{order.monthlyPrice.toLocaleString()} دج</td>
                             <td className="px-6 py-2 whitespace-nowrap text-gray-600">{order.months} أشهر</td>
                             <td className="px-6 py-2 whitespace-nowrap text-center">{order.shippingCompany ? (<div className="flex flex-col gap-1 items-center"><div className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{order.shippingCompany}</div>{order.shippingTrackingNumber && (<button onClick={(e) => handleCopyTracking(e, order.shippingTrackingNumber || '', order.id)} className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-all border ${copiedId === order.id ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-100'}`} title="نسخ رقم التتبع">{copiedId === order.id ? <CheckCircle size={10} /> : <Copy size={10} />}{order.shippingTrackingNumber}</button>)}</div>) : <span className="text-gray-400 text-xs">-</span>}</td>
                             <td className="px-6 py-2 whitespace-nowrap text-center"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">مكتمل</span></td>
                             <td className="px-6 py-2 whitespace-nowrap text-center text-gray-400"><Archive size={18} className="mx-auto text-gray-500" /></td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers View */}
        {activeView === 'customers' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleViewChange('dashboard')}
                    className="flex items-center gap-2 p-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-95"
                  >
                    <ArrowLeft size={20} />
                    <span className="font-bold text-xs hidden sm:inline">الرجوع للرئيسية</span>
                  </button>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-purple-600" size={24} />
                    قائمة الزبائن
                  </h3>
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                   <div className="relative flex-1 sm:w-64">
                      <input 
                        type="text" 
                        placeholder="بحث عن زبون..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 pr-10 text-sm focus:outline-none focus:border-purple-500"
                      />
                      <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                   </div>
                   <button onClick={() => setShowAddCustomer(true)} className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors">
                      <UserPlus size={20} />
                   </button>
               </div>
            </div>
            
            <div className="overflow-x-auto">
              {filteredCustomers.length > 0 ? (
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3 whitespace-nowrap">الزبون</th>
                      <th className="px-6 py-3 whitespace-nowrap">رقم الهاتف</th>
                      <th className="px-6 py-3 whitespace-nowrap">الولاية</th>
                      <th className="px-6 py-3 whitespace-nowrap">رقم CCP</th>
                      <th className="px-6 py-3 whitespace-nowrap">تاريخ التسجيل</th>
                      <th className="px-6 py-3 whitespace-nowrap">آخر دخول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map((customer, index) => (
                      <tr key={index} onClick={() => handleCustomerClick(customer)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                 {customer.firstName?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-gray-900">{customer.firstName} {customer.lastName}</span>
                           </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap font-mono text-gray-600" dir="ltr">{customer.phone1}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-gray-600">{customer.wilaya}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-mono text-gray-600">{customer.ccpNumber}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-gray-500" dir="ltr">{formatDate(customer.registrationDate)}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                           <div className="flex items-center gap-1">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-xs font-bold">{timeAgo(customer.lastLoginDate)}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                   <Users size={48} className="mb-3 opacity-20" />
                   <p>لا يوجد زبائن مسجلين</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products View */}
        {activeView === 'products' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleViewChange('dashboard')}
                    className="flex items-center gap-2 p-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-95"
                  >
                    <ArrowLeft size={20} />
                    <span className="font-bold text-xs hidden sm:inline">الرجوع للرئيسية</span>
                  </button>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {showWarehouse ? (
                       <><Warehouse className="text-orange-600" size={24} /> مخزن المنتجات</>
                    ) : (
                       <><Package className="text-indigo-600" size={24} /> إدارة المنتجات</>
                    )}
                  </h3>
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                   <div className="relative flex-1 sm:w-64">
                      <input 
                        type="text" 
                        placeholder="بحث عن منتج..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 pr-10 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                   </div>
                   
                   <button 
                     onClick={() => setShowWarehouse(!showWarehouse)} 
                     className={`p-2 rounded-xl transition-colors shadow-lg ${showWarehouse ? 'bg-orange-600 text-white shadow-orange-200 hover:bg-orange-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                     title={showWarehouse ? "عرض المنتجات" : "عرض المخزن"}
                   >
                      {showWarehouse ? <Package size={20} /> : <Warehouse size={20} />}
                   </button>

                   <button onClick={() => setShowAddProduct(true)} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                      <Plus size={20} />
                   </button>
               </div>
            </div>

            <div className="overflow-x-auto">
               {showWarehouse ? (
                 <table className="w-full text-right text-sm">
                    <thead className="bg-orange-50 text-orange-800 font-bold">
                      <tr>
                        <th className="px-6 py-3 whitespace-nowrap">المنتج</th>
                        <th className="px-6 py-3 whitespace-nowrap">الماركة</th>
                        <th className="px-6 py-3 whitespace-nowrap">التصنيف</th>
                        <th className="px-6 py-3 whitespace-nowrap text-center">الكمية في المخزن</th>
                        <th className="px-6 py-3 whitespace-nowrap text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                       {filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-orange-50/30 transition-colors">
                             <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-800">{product.name}</td>
                             <td className="px-6 py-3 whitespace-nowrap text-gray-600">{product.brand}</td>
                             <td className="px-6 py-3 whitespace-nowrap text-gray-600">{product.category}</td>
                             <td className="px-6 py-3 whitespace-nowrap text-center">
                                <span className="font-mono font-bold text-lg bg-white border border-orange-200 px-4 py-1 rounded-lg">
                                   {product.stock || 0}
                                </span>
                             </td>
                             <td className="px-6 py-3 whitespace-nowrap text-center">
                                {(product.stock || 0) > 5 ? (
                                   <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">متوفر</span>
                                ) : (product.stock || 0) > 0 ? (
                                   <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">منخفض</span>
                                ) : (
                                   <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">نفذت الكمية</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               ) : (
                 <table className="w-full text-right text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-3 whitespace-nowrap">المنتج</th>
                        <th className="px-6 py-3 whitespace-nowrap">التصنيف</th>
                        <th className="px-6 py-3 whitespace-nowrap">السعر الإجمالي</th>
                        <th className="px-6 py-3 whitespace-nowrap">التقسيط</th>
                        <th className="px-6 py-3 whitespace-nowrap text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                   <img src={product.media[0]?.url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                   <div>
                                      <div className="font-bold text-gray-900">{product.name}</div>
                                      <div className="text-xs text-gray-500">{product.brand}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-3 whitespace-nowrap text-gray-600">{product.category}</td>
                             <td className="px-6 py-3 whitespace-nowrap font-bold text-emerald-600">{product.totalPrice.toLocaleString()} دج</td>
                             <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                                {Math.ceil(product.totalPrice / product.plan.months).toLocaleString()} دج / {product.plan.months} أشهر
                             </td>
                             <td className="px-6 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                      onClick={() => openEditProductModal(product)}
                                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                      title="تعديل المنتج"
                                  >
                                      <Pencil size={18} />
                                  </button>
                                  <button 
                                      onClick={() => setDeleteProductModal({ show: true, productId: product.id })}
                                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                      title="حذف المنتج"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               )}
            </div>
          </div>
        )}

      </div>
        
        {/* Modals Section */}
        
        {/* Bulk Payment Modal */}
        {showBulkPaymentModal && (
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scaleUp">
                    <div className="bg-cyan-600 p-6 flex justify-between items-center text-white">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2"><Banknote size={24}/> إدخال الدفوعات المتعددة</h3>
                            <p className="text-xs text-cyan-100 mt-1">تسجيل دفعات الزبائن عبر CCP</p>
                        </div>
                        <button onClick={() => setShowBulkPaymentModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    <div className="p-6">
                        <div className="mb-4 overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                                    <tr>
                                        <th className="p-3 min-w-[140px]">رقم الحساب البريدي (CCP)</th>
                                        <th className="p-3 min-w-[100px]">مبلغ القسط (دج)</th>
                                        <th className="p-3 min-w-[180px]">اسم الزبون (تلقائي)</th>
                                        <th className="p-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {bulkPayments.map((row, index) => (
                                        <tr key={row.id}>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    value={row.ccp}
                                                    onChange={(e) => handleBulkPaymentChange(row.id, 'ccp', e.target.value)}
                                                    placeholder="رقم CCP"
                                                    className="w-full border p-2 rounded-lg focus:border-cyan-500 outline-none"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    value={row.amount}
                                                    onChange={(e) => handleBulkPaymentChange(row.id, 'amount', e.target.value)}
                                                    placeholder="المبلغ"
                                                    className="w-full border p-2 rounded-lg focus:border-cyan-500 outline-none"
                                                />
                                            </td>
                                            <td className="p-2">
                                                {row.customerName ? (
                                                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-2 rounded-lg">
                                                        <UserCheck size={16} />
                                                        {row.customerName}
                                                    </div>
                                                ) : row.ccp.length > 5 ? (
                                                    <div className="flex items-center gap-2 text-red-400 font-bold bg-red-50 p-2 rounded-lg">
                                                        <AlertCircle size={16} />
                                                        زبون غير موجود
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-center">
                                                {bulkPayments.length > 1 && (
                                                    <button onClick={() => removeBulkPaymentRow(row.id)} className="text-red-400 hover:text-red-600 p-2">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <div></div> 
                            
                            <div className="flex gap-3">
                                <button onClick={() => setShowBulkPaymentModal(false)} className="px-6 py-2 rounded-xl border border-gray-300 font-bold hover:bg-gray-50 text-gray-600">إلغاء</button>
                                <button onClick={submitBulkPayments} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200">
                                    <Save size={18} /> حفظ الدفوعات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Payment Entry Modal */}
        {showPaymentModal && selectedPaymentOrder && (
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
                  <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                     <div>
                        <h3 className="text-xl font-bold flex items-center gap-2"><Banknote size={24}/> تسجيل المدفوعات</h3>
                        <p className="text-xs text-blue-100 mt-1">{selectedPaymentOrder.customerName} - {selectedPaymentOrder.productName}</p>
                     </div>
                     <button onClick={() => setShowPaymentModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4 bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-200">
                          <span className="text-sm text-gray-500 font-bold">القسط الشهري:</span>
                          <span className="text-lg font-bold text-blue-700">{selectedPaymentOrder.monthlyPrice.toLocaleString()} دج</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                          {Array.from({ length: selectedPaymentOrder.months }).map((_, idx) => {
                              const isPaid = (paymentRecords[selectedPaymentOrder.id] || []).includes(idx);
                              return (
                                  <button 
                                    key={idx}
                                    onClick={() => handleTogglePaymentMonth(selectedPaymentOrder.id, idx)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                        isPaid 
                                        ? 'bg-green-50 border-green-500 text-green-700' 
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300'
                                    }`}
                                  >
                                      <span className="text-xs font-bold mb-1">الشهر {idx + 1}</span>
                                      {isPaid ? <CheckCircle size={20} className="fill-green-100" /> : <Circle size={20} />}
                                      <span className="text-[10px] font-bold mt-1">{isPaid ? 'مدفوع' : 'غير مدفوع'}</span>
                                  </button>
                              );
                          })}
                      </div>

                      <div className="mt-6 pt-4 border-t flex justify-end">
                          <Button onClick={() => setShowPaymentModal(false)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                              تم الحفظ
                          </Button>
                      </div>
                  </div>
               </div>
            </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
           <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scaleUp">
                  <div className="bg-purple-600 p-6 flex justify-between items-center text-white">
                     <h3 className="text-xl font-bold flex items-center gap-2"><UserPlus size={24}/> إضافة زبون جديد</h3>
                     <button onClick={() => setShowAddCustomer(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  <div className="p-8 max-h-[80vh] overflow-y-auto">
                      <form onSubmit={handleAddCustomerSubmit}>
                          <div className="space-y-6">
                              <h4 className="font-bold text-gray-800 border-b pb-2">المعلومات الشخصية</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">الاسم</label>
                                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required dir="ltr" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">اللقب</label>
                                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required dir="ltr" />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ الميلاد</label>
                                       <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                                       <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف 1</label>
                                       <input type="tel" name="phone1" value={formData.phone1} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف 2</label>
                                       <input type="tel" name="phone2" value={formData.phone2} onChange={handleInputChange} className="w-full border p-2 rounded-xl" />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">الولاية</label>
                                       <select name="wilaya" value={formData.wilaya} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required>
                                          {ALGERIA_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                       </select>
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">البلدية</label>
                                       <input type="text" name="baladyia" value={formData.baladyia} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                                       <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">رقم CCP</label>
                                       <div className="flex gap-2">
                                          <input type="number" name="ccpNumber" value={formData.ccpNumber} onChange={handleInputChange} className="flex-1 border p-2 rounded-xl" required />
                                          <input type="number" name="ccpKey" value={formData.ccpKey} onChange={handleInputChange} className="w-20 border p-2 rounded-xl" placeholder="Cle" required />
                                       </div>
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">رقم بطاقة التعريف</label>
                                       <input type="number" name="nin" value={formData.nin} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                                  <div>
                                       <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ انتهاء الصلاحية</label>
                                       <input type="date" name="ninExpiry" value={formData.ninExpiry} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required />
                                  </div>
                              </div>
                              
                              <h4 className="font-bold text-gray-800 border-b pb-2 pt-4">الملفات</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderFileInput("بطاقة التعريف (أمام)", "idCardFront")}
                                  {renderFileInput("بطاقة التعريف (خلف)", "idCardBack")}
                                  {renderFileInput("صك بريدي", "chequeImage")}
                                  {renderFileInput("كشف الحساب", "accountStatement")}
                              </div>

                              <h4 className="font-bold text-gray-800 border-b pb-2 pt-4">كلمة المرور</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input type="password" name="password" placeholder="كلمة المرور" value={formData.password} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required minLength={6} />
                                  <input type="password" name="confirmPassword" placeholder="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleInputChange} className="w-full border p-2 rounded-xl" required minLength={6} />
                              </div>

                              {error && <p className="text-red-500 font-bold text-sm text-center">{error}</p>}

                              <div className="flex justify-end gap-3 pt-4">
                                  <button type="button" onClick={() => setShowAddCustomer(false)} className="px-6 py-2 rounded-xl border border-gray-300 font-bold hover:bg-gray-50">إلغاء</button>
                                  <button type="submit" className="px-6 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200">حفظ الزبون</button>
                              </div>
                          </div>
                      </form>
                  </div>
               </div>
           </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scaleUp">
                  <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                     <h3 className="text-xl font-bold flex items-center gap-2">
                        {editingProductId ? <Pencil size={24}/> : <Plus size={24}/>} 
                        {editingProductId ? 'تعديل منتج' : 'إضافة منتج جديد'}
                     </h3>
                     <button onClick={closeProductModal} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  <div className="p-8 max-h-[80vh] overflow-y-auto">
                      <form onSubmit={handleAddProductSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنتج</label>
                                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border p-2 rounded-xl" required />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">الماركة</label>
                                  <input type="text" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="w-full border p-2 rounded-xl" required />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">التصنيف</label>
                                  <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full border p-2 rounded-xl" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
                                  <input type="text" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full border p-2 rounded-xl" required />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">سعر الشراء (اختياري)</label>
                                  <input type="number" value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})} className="w-full border p-2 rounded-xl" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">سعر البيع الإجمالي</label>
                                  <input type="number" value={newProduct.totalPrice} onChange={e => setNewProduct({...newProduct, totalPrice: e.target.value})} className="w-full border p-2 rounded-xl" required />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">عدد الأشهر</label>
                                  <input type="number" value={newProduct.months} onChange={e => setNewProduct({...newProduct, months: e.target.value})} className="w-full border p-2 rounded-xl" required />
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">المخزون</label>
                              <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full border p-2 rounded-xl" />
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">المميزات (مفصولة بفاصلة)</label>
                              <input type="text" value={newProduct.features} onChange={e => setNewProduct({...newProduct, features: e.target.value})} className="w-full border p-2 rounded-xl" placeholder="ميزة 1, ميزة 2, ..." />
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">صور المنتج</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {imagePreviews.map((url, idx) => (
                                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                          <img src={url} alt="" className="w-full h-full object-cover" />
                                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                      </div>
                                  ))}
                                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                                      <Upload size={20} className="text-gray-400"/>
                                      <input type="file" accept="image/*" multiple onChange={handleProductImageChange} className="hidden" />
                                  </label>
                              </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t">
                              <button type="button" onClick={closeProductModal} className="px-6 py-2 rounded-xl border border-gray-300 font-bold hover:bg-gray-50">إلغاء</button>
                              <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">حفظ المنتج</button>
                          </div>
                      </form>
                  </div>
               </div>
            </div>
        )}

        {/* Rejection Modal */}
        {rejectModal.show && (
            <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
                    <div className="bg-red-600 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold">رفض الطلب</h3>
                        <button onClick={() => setRejectModal({ show: false, orderId: null })}><X size={20}/></button>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">سبب الرفض</label>
                        <textarea 
                            className="w-full border p-3 rounded-xl min-h-[100px] mb-4"
                            placeholder="اكتب سبب الرفض هنا..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        ></textarea>
                        <Button fullWidth variant="danger" onClick={confirmRejection}>تأكيد الرفض</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Product Modal */}
        {deleteProductModal.show && (
             <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                     <h3 className="text-lg font-bold mb-4 text-gray-900">هل أنت متأكد من حذف المنتج؟</h3>
                     <div className="flex gap-3 justify-end">
                         <button onClick={() => setDeleteProductModal({show: false, productId: null})} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">إلغاء</button>
                         <button onClick={confirmDeleteProduct} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold">حذف</button>
                     </div>
                 </div>
             </div>
        )}

        {/* Confirm Receipt Modal */}
        {confirmReceiptModal.show && (
             <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                     <h3 className="text-lg font-bold mb-2 text-gray-900">تأكيد الاستلام؟</h3>
                     <p className="text-sm text-gray-500 mb-4">سيتم تغيير حالة الطلب إلى "مكتمل" وإنقاص المخزون.</p>
                     <div className="flex gap-3 justify-end">
                         <button onClick={() => setConfirmReceiptModal({show: false, order: null})} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">إلغاء</button>
                         <button onClick={processReceiptConfirmation} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">تأكيد</button>
                     </div>
                 </div>
             </div>
        )}

        {/* Image Preview Modal */}
        {viewImage && (
             <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                 <div className="relative max-w-4xl w-full max-h-[90vh]">
                     <img src={viewImage.url} alt={viewImage.title} className="w-full h-full object-contain rounded-lg" />
                     <button className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/40"><X size={24}/></button>
                     <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold">{viewImage.title}</div>
                 </div>
             </div>
        )}

        {/* Order Details Modal (UPDATED FOR MOBILE VISIBILITY) */}
        {(selectedOrder || selectedCustomer) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden animate-scaleUp h-full md:h-auto md:max-h-[90vh] flex flex-col md:flex-row">
                     {/* Left Pane (Main Details) - Scrollable on mobile, flexible on desktop */}
                     <div className="flex-1 p-4 md:p-5 relative bg-white overflow-y-auto custom-scrollbar">
                         <button onClick={closeOrderDetails} className="absolute top-4 left-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200 z-20 text-gray-600"><X size={20}/></button>
                         {selectedCustomer && (
                             <div className="space-y-6 pb-20 md:pb-0"> {/* Added pb-20 for mobile bottom spacer */}
                                 {/* Header */}
                                 <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                     <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl sm:text-2xl font-bold border-2 border-emerald-50">
                                        {selectedCustomer.firstName.charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                         <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
                                         <div className="flex gap-2 mt-1">
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">زبون</span>
                                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10}/> مسجل {timeAgo(selectedCustomer.registrationDate)}</span>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                     {/* Personal Info Card */}
                                     <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                         <SectionTitle icon={UserIcon} title="المعلومات الشخصية" />
                                         <div className="space-y-2">
                                             <InfoRow label="الاسم الكامل" value={`${selectedCustomer.firstName} ${selectedCustomer.lastName}`} />
                                             <div className="grid grid-cols-2 gap-2">
                                                <InfoRow label="تاريخ الميلاد" value={formatDate(selectedCustomer.birthDate)} icon={Calendar} />
                                                <InfoRow label="رقم بطاقة التعريف (NIN)" value={selectedCustomer.nin} copyable />
                                             </div>
                                             <InfoRow label="تاريخ انتهاء الصلاحية" value={formatDate(selectedCustomer.ninExpiry)} />
                                         </div>
                                     </div>

                                     {/* Contact Info Card */}
                                     <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                         <SectionTitle icon={Phone} title="معلومات الاتصال" />
                                         <div className="space-y-2">
                                             <InfoRow label="رقم الهاتف الرئيسي" value={selectedCustomer.phone1} highlight icon={Phone} copyable />
                                             {selectedCustomer.phone2 && <InfoRow label="رقم الهاتف الثانوي" value={selectedCustomer.phone2} icon={Phone} copyable />}
                                             <InfoRow label="البريد الإلكتروني" value={selectedCustomer.email} icon={Mail} copyable />
                                         </div>
                                     </div>

                                     {/* Address Card */}
                                     <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                         <SectionTitle icon={MapPin} title="العنوان والموقع" />
                                         <div className="space-y-2">
                                             <div className="grid grid-cols-2 gap-2">
                                                <InfoRow label="الولاية" value={selectedCustomer.wilaya} />
                                                <InfoRow label="البلدية" value={selectedCustomer.baladyia} />
                                             </div>
                                             <InfoRow label="العنوان التفصيلي" value={selectedCustomer.address} highlight />
                                         </div>
                                     </div>

                                     {/* Financial Info Card */}
                                     <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                                         <SectionTitle icon={CreditCard} title="الحساب البريدي الجاري" />
                                         <div className="flex items-center gap-4 mt-2">
                                             <div className="flex-1">
                                                <span className="text-[10px] uppercase text-emerald-600 font-bold block mb-1">رقم الحساب (CCP)</span>
                                                <span className="text-xl sm:text-2xl font-mono font-bold text-gray-800 tracking-wider bg-white px-3 py-1 rounded border border-emerald-200 block w-full text-center">
                                                    {selectedCustomer.ccpNumber}
                                                </span>
                                             </div>
                                             <div className="w-20">
                                                <span className="text-[10px] uppercase text-emerald-600 font-bold block mb-1">المفتاح</span>
                                                <span className="text-xl sm:text-2xl font-mono font-bold text-gray-800 bg-white px-3 py-1 rounded border border-emerald-200 block text-center">
                                                    {selectedCustomer.ccpKey}
                                                </span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {/* Files Section */}
                                 <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 mt-3">
                                     <SectionTitle icon={FolderOpen} title="الملفات المرفقة" />
                                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                         {[
                                            { key: 'idCardFront', label: 'بطاقة أمامية' },
                                            { key: 'idCardBack', label: 'بطاقة خلفية' },
                                            { key: 'chequeImage', label: 'صك بريدي' },
                                            { key: 'accountStatement', label: 'كشف حساب' }
                                         ].map(item => {
                                             const val = (selectedCustomer as any)[item.key];
                                             return val ? (
                                                <div key={item.key} onClick={() => handleViewImage(item.label, val)} className="aspect-square bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group p-2">
                                                    <Image size={24} className="text-gray-400 group-hover:text-emerald-600 mb-2"/>
                                                    <span className="text-[10px] font-bold text-gray-500 text-center">{item.label}</span>
                                                </div>
                                             ) : (
                                                <div key={item.key} className="aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 opacity-50">
                                                    <span className="text-[10px] text-gray-400 text-center">غير متوفر</span>
                                                </div>
                                             );
                                         })}
                                     </div>
                                 </div>

                                 {/* Order Specific Section (if order selected) */}
                                 {selectedOrder && (
                                     <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-2xl shadow-lg mt-3">
                                         <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
                                            <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="text-emerald-400" /> تفاصيل الطلب الحالي</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                selectedOrder.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600' :
                                                selectedOrder.status === OrderStatus.WAITING_FOR_FILES ? 'bg-blue-50 text-blue-600' :
                                                selectedOrder.status === OrderStatus.READY_FOR_SHIPPING ? 'bg-purple-50 text-purple-600' :
                                                selectedOrder.status === OrderStatus.DELIVERED ? 'bg-cyan-50 text-cyan-600' :
                                                selectedOrder.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                                {selectedOrder.status}
                                            </span>
                                         </div>

                                         <div className="space-y-4">
                                            <div className="flex items-center gap-4 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                                                <img src={selectedOrder.productImage} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-700" />
                                                <div>
                                                    <div className="font-bold text-white text-lg">{selectedOrder.productName}</div>
                                                    <div className="text-gray-400 text-xs">معرف الطلب: #{selectedOrder.id}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-700/50">
                                                    <span className="text-gray-400 text-xs block mb-1">القسط الشهري</span>
                                                    <span className="text-xl font-bold text-emerald-400">{selectedOrder.monthlyPrice.toLocaleString()} دج</span>
                                                </div>
                                                <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-700/50">
                                                    <span className="text-gray-400 text-xs block mb-1">المدة</span>
                                                    <span className="text-xl font-bold text-white">{selectedOrder.months} أشهر</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                                                <span className="text-sm text-gray-400">الإجمالي الكلي</span>
                                                <span className="text-lg font-bold text-white">{(selectedOrder.monthlyPrice * selectedOrder.months).toLocaleString()} دج</span>
                                            </div>
                                         </div>
                                     </div>
                                 )}

                                 <div className="flex gap-3 mt-6">
                                     {selectedOrder?.status === OrderStatus.PENDING && (
                                         <>
                                            <Button onClick={() => onUpdateStatus(selectedOrder.id, OrderStatus.WAITING_FOR_FILES)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">موافقة أولية</Button>
                                            <Button onClick={() => openRejectModal(selectedOrder.id)} className="flex-1 bg-red-600 hover:bg-red-700">رفض الطلب</Button>
                                         </>
                                     )}
                                     {selectedOrder?.status === OrderStatus.WAITING_FOR_FILES && (
                                          <>
                                            <Button onClick={() => {
                                                if (deliveryUpdates.includes(selectedOrder.id)) clearDeliveryUpdate(selectedOrder.id);
                                                onUpdateStatus(selectedOrder.id, OrderStatus.READY_FOR_SHIPPING);
                                            }} className="flex-1 bg-emerald-600 hover:bg-emerald-700">تأكيد الملفات</Button>
                                            <Button onClick={() => openRejectModal(selectedOrder.id)} className="flex-1 bg-red-600 hover:bg-red-700">رفض (نقص وثائق)</Button>
                                          </>
                                     )}
                                     {selectedOrder?.status === OrderStatus.READY_FOR_SHIPPING && (
                                         <div className="w-full bg-gray-100 p-3 rounded-xl text-center text-sm font-bold text-gray-600">
                                            الطلب جاهز للإرسال، يرجى تعيين شركة التوصيل من قائمة "جاهز للإرسال"
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}
                     </div>

                     {/* Sidebar for Order History - Fixed at bottom on mobile or separate scroll? */}
                     {/* On mobile, we might want this to scroll WITH the main content or sit below it. flex-col handles it. */}
                     {/* We gave main content 'flex-1' and overflow. If we want history visible at bottom, we shouldn't overflow main content independently if the parent is fixed height on mobile. */}
                     {/* BUT: Parent is h-full on mobile. So flexible child should take space. */}
                     
                     <div className="w-full md:w-80 bg-gray-50 border-t md:border-t-0 md:border-r border-gray-200 p-5 overflow-y-auto md:h-full custom-scrollbar shrink-0 max-h-[30vh] md:max-h-full">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                           <History size={16} /> سجل الطلبات
                        </h4>
                        {selectedCustomer && (
                            <div className="space-y-3">
                                {orders.filter(o => o.customerPhone === selectedCustomer.phone1).map(order => (
                                    <div 
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'bg-white border-gray-200 hover:border-emerald-300'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 text-xs line-clamp-1">{order.productName}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                                order.status === OrderStatus.REJECTED ? 'bg-red-100 text-red-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {order.date}</span>
                                            <span className="font-bold text-emerald-600">{order.monthlyPrice.toLocaleString()} دج</span>
                                        </div>
                                    </div>
                                ))}
                                {orders.filter(o => o.customerPhone === selectedCustomer.phone1).length === 0 && (
                                    <div className="text-center text-gray-400 text-sm py-8">لا توجد طلبات</div>
                                )}
                            </div>
                        )}
                     </div>
                </div>
            </div>
        )}

      </div>
  );
};

export default AdminDashboard;