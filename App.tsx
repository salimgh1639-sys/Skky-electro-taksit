
import React, { useState, useEffect } from 'react';
import { Home, Package, Smartphone, LogOut, LogIn, CheckCircle, FileText, X, Bell, Download, Truck, Send, MapPin, Phone, AlertCircle, XCircle, PartyPopper, Gift, Copy, PackageCheck, Star, Sparkles, AlertTriangle } from 'lucide-react';
import { jsPDF } from "jspdf";
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import MyOrders from './components/MyOrders';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import Button from './components/Button';
import { PRODUCTS, MOCK_USERS, MOCK_ORDERS, DELIVERY_COMPANIES } from './constants';
import { Product, Order, OrderStatus, User as UserType } from './types';

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]); // All registered users
  const [activeTab, setActiveTab] = useState<'home' | 'orders'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(PRODUCTS); // Products State
  const [showAuth, setShowAuth] = useState(false);
  
  // Notification State
  const [notificationOrder, setNotificationOrder] = useState<Order | null>(null);
  const [rejectionPopup, setRejectionPopup] = useState<Order | null>(null);
  const [finalApprovalPopup, setFinalApprovalPopup] = useState<Order | null>(null);
  const [shippedPopup, setShippedPopup] = useState<Order | null>(null);
  const [completedPopup, setCompletedPopup] = useState<Order | null>(null); // New state for Received/Completed Popup
  
  // Session tracking for ignored notifications (reset on reload)
  const [sessionIgnoredOrders, setSessionIgnoredOrders] = useState<string[]>([]);
  
  // Persisted tracking for seen rejections (stored in localStorage)
  const [seenRejections, setSeenRejections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dz_seen_rejections');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persisted tracking for seen final approvals
  const [seenFinalApprovals, setSeenFinalApprovals] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dz_seen_final_approvals');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persisted tracking for seen shipped orders
  const [seenShippedOrders, setSeenShippedOrders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dz_seen_shipped_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persisted tracking for seen completed orders
  const [seenCompletedOrders, setSeenCompletedOrders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dz_seen_completed_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // New States for UI Feedback
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasUnreadOrders, setHasUnreadOrders] = useState(false);

  // States for Delivery Form in Notification
  const [selectedCompany, setSelectedCompany] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [deliveryFormError, setDeliveryFormError] = useState('');

  // Copy Feedback State
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Load data from local storage or initialize with MOCK data
  useEffect(() => {
    const savedOrders = localStorage.getItem('dz_orders');
    const savedUser = localStorage.getItem('dz_current_user');
    const savedUsersList = localStorage.getItem('dz_users');
    const savedProducts = localStorage.getItem('dz_products');
    
    // Orders Initialization
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error("Failed to parse orders");
        setOrders(MOCK_ORDERS);
      }
    } else {
      // Load Mock Orders if empty
      setOrders(MOCK_ORDERS);
      localStorage.setItem('dz_orders', JSON.stringify(MOCK_ORDERS));
    }

    // Products Initialization
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        setProducts(PRODUCTS);
      }
    } else {
       setProducts(PRODUCTS);
    }

    // Current User Initialization
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user");
      }
    }

    // Users List Initialization
    if (savedUsersList) {
      try {
        setUsers(JSON.parse(savedUsersList));
      } catch (e) {
        console.error("Failed to parse users list");
        setUsers(MOCK_USERS);
      }
    } else {
      // Load Mock Users if empty
      setUsers(MOCK_USERS);
      localStorage.setItem('dz_users', JSON.stringify(MOCK_USERS));
    }
  }, []);

  // Check for notifications when user or orders change
  useEffect(() => {
    if (user && user.role !== 'admin') {
      // 1. Check for unread orders (Red Dot)
      const hasPending = orders.some(o => o.customerPhone === user.phone1 && o.status === OrderStatus.PENDING);
      if (hasPending) setHasUnreadOrders(true);

      // PRIORITY 1: Check for COMPLETED (Received) Orders (Absolute Highest Priority)
      const completedOrder = orders.find(o => 
        o.customerPhone === user.phone1 && 
        o.status === OrderStatus.COMPLETED &&
        !seenCompletedOrders.includes(o.id)
      );

      if (completedOrder) {
        setCompletedPopup(completedOrder);
        // Do not show other popups if we have a completion celebration
        return;
      }

      // PRIORITY 2: Check for Shipped Orders
      const shippedOrder = orders.find(o => 
        o.customerPhone === user.phone1 && 
        o.status === OrderStatus.DELIVERED &&
        !seenShippedOrders.includes(o.id)
      );

      if (shippedOrder) {
        setShippedPopup(shippedOrder);
        return;
      }

      // PRIORITY 3: Check for Orders Waiting for Delivery Info
      const prelimOrder = orders.find(o => 
        o.customerPhone === user.phone1 && 
        o.status === OrderStatus.WAITING_FOR_FILES &&
        (!o.deliveryCompany || !o.trackingNumber) && 
        !sessionIgnoredOrders.includes(o.id)
      );

      if (prelimOrder) {
        setNotificationOrder(prelimOrder);
        setSelectedCompany(prelimOrder.deliveryCompany || '');
        setTrackingInput(prelimOrder.trackingNumber || '');
        return;
      }

      // PRIORITY 4: Check for Final Approvals (Ready for Shipping)
      const finalOrder = orders.find(o => 
        o.customerPhone === user.phone1 && 
        o.status === OrderStatus.READY_FOR_SHIPPING &&
        !seenFinalApprovals.includes(o.id)
      );

      if (finalOrder) {
        setFinalApprovalPopup(finalOrder);
        return;
      }

      // PRIORITY 5: Check for Rejected Orders
      const rejectedOrder = orders.find(o => 
        o.customerPhone === user.phone1 && 
        o.status === OrderStatus.REJECTED &&
        !seenRejections.includes(o.id)
      );

      if (rejectedOrder) {
        setRejectionPopup(rejectedOrder);
      }
    }
  }, [user, orders, sessionIgnoredOrders, seenRejections, seenFinalApprovals, seenShippedOrders, seenCompletedOrders]);

  const closeNotification = () => {
    if (notificationOrder) {
      setSessionIgnoredOrders(prev => [...prev, notificationOrder.id]);
      setNotificationOrder(null);
      setSelectedCompany('');
      setTrackingInput('');
      setDeliveryFormError('');
    }
  };

  const closeRejectionPopup = () => {
    if (rejectionPopup) {
      const updatedSeen = [...seenRejections, rejectionPopup.id];
      setSeenRejections(updatedSeen);
      localStorage.setItem('dz_seen_rejections', JSON.stringify(updatedSeen));
      setRejectionPopup(null);
    }
  };

  const closeFinalApprovalPopup = () => {
    if (finalApprovalPopup) {
      const updatedSeen = [...seenFinalApprovals, finalApprovalPopup.id];
      setSeenFinalApprovals(updatedSeen);
      localStorage.setItem('dz_seen_final_approvals', JSON.stringify(updatedSeen));
      setFinalApprovalPopup(null);
    }
  };

  const closeShippedPopup = () => {
    if (shippedPopup) {
      const updatedSeen = [...seenShippedOrders, shippedPopup.id];
      setSeenShippedOrders(updatedSeen);
      localStorage.setItem('dz_seen_shipped_orders', JSON.stringify(updatedSeen));
      setShippedPopup(null);
    }
  };

  const closeCompletedPopup = () => {
    if (completedPopup) {
      const updatedSeen = [...seenCompletedOrders, completedPopup.id];
      setSeenCompletedOrders(updatedSeen);
      localStorage.setItem('dz_seen_completed_orders', JSON.stringify(updatedSeen));
      setCompletedPopup(null);
    }
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const saveUsers = (newUsers: UserType[]) => {
    setUsers(newUsers);
    localStorage.setItem('dz_users', JSON.stringify(newUsers));
  };

  const handleLogin = (loggedInUser: UserType) => {
    // Update last login date
    const updatedUser = { ...loggedInUser, lastLoginDate: new Date().toISOString() };
    
    // Check if user exists in the current users list
    const userExists = users.some(u => u.phone1 === loggedInUser.phone1 || u.email === loggedInUser.email);

    let finalUsersList;
    if (userExists) {
      // Update existing user
      finalUsersList = users.map(u => 
        (u.email === loggedInUser.email || u.phone1 === loggedInUser.phone1) ? updatedUser : u
      );
    } else {
      // Add new user (e.g. from Quick Login if not present)
      finalUsersList = [...users, updatedUser];
    }

    saveUsers(finalUsersList);
    setUser(updatedUser);
    localStorage.setItem('dz_current_user', JSON.stringify(updatedUser));
    setShowAuth(false);
    // Reset session states on new login
    setSessionIgnoredOrders([]);
    
    // Ensure we start at the main page
    setActiveTab('home');
    // Reset admin view preference to default 'dashboard'
    localStorage.removeItem('dz_admin_view');
  };

  const handleRegister = (newUser: UserType) => {
    // New user comes with registrationDate from Auth component
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    handleLogin(newUser);
  };

  const handleAddUserByAdmin = (newUser: UserType) => {
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
  };

  // Add Product Handler
  const handleAddProduct = (newProduct: Product) => {
    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    localStorage.setItem('dz_products', JSON.stringify(updatedProducts));
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Edit Product Handler
  const handleEditProduct = (updatedProduct: Product) => {
    const updatedProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updatedProducts);
    localStorage.setItem('dz_products', JSON.stringify(updatedProducts));
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Handler for deleting product (optional but good for management view)
  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('dz_products', JSON.stringify(updatedProducts));
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dz_current_user');
    setActiveTab('home');
    setNotificationOrder(null);
    setRejectionPopup(null);
    setFinalApprovalPopup(null);
    setShippedPopup(null);
    setCompletedPopup(null);
    setSessionIgnoredOrders([]);
    setHasUnreadOrders(false);
  };

  const handleOrder = (newOrder: Omit<Order, 'id' | 'date' | 'status'>) => {
    const order: Order = {
      ...newOrder,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      status: OrderStatus.PENDING
    };
    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('dz_orders', JSON.stringify(updatedOrders));
    
    setHasUnreadOrders(true);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, rejectionReason?: string, deliveryData?: { deliveryCompany: string, trackingNumber: string }) => {
    // 1. Handle Stock Updates based on specific workflow logic
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
        // Logic: When Admin clicks "Send" (Status becomes DELIVERED) -> Admin buys item -> Stock INCREASES
        if (newStatus === OrderStatus.DELIVERED) {
            const updatedProducts = products.map(p => {
                if (p.id === targetOrder.productId) {
                    return { ...p, stock: (p.stock || 0) + 1 };
                }
                return p;
            });
            setProducts(updatedProducts);
            localStorage.setItem('dz_products', JSON.stringify(updatedProducts));
        }

        // Logic: When Admin/User clicks "Arrived/Completed" (Status becomes COMPLETED) -> Customer receives item -> Stock DECREASES
        if (newStatus === OrderStatus.COMPLETED) {
            const updatedProducts = products.map(p => {
                if (p.id === targetOrder.productId) {
                    return { ...p, stock: Math.max((p.stock || 0) - 1, 0) };
                }
                return p;
            });
            setProducts(updatedProducts);
            localStorage.setItem('dz_products', JSON.stringify(updatedProducts));
        }
    }

    // 2. Handle Order Status Updates
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updates: Partial<Order> = { status: newStatus, rejectionReason };
        
        if (newStatus === OrderStatus.WAITING_FOR_FILES && !order.preliminaryApprovalDate) {
          updates.preliminaryApprovalDate = new Date().toLocaleDateString('en-GB');
        }
        
        // When moved to READY_FOR_SHIPPING, it means files are approved/received
        if (newStatus === OrderStatus.READY_FOR_SHIPPING && !order.filesReceiptDate) {
          updates.filesReceiptDate = new Date().toLocaleDateString('en-GB');
        }

        if (newStatus === OrderStatus.REJECTED && !order.rejectionDate) {
           updates.rejectionDate = new Date().toLocaleDateString('en-GB');
        }

        // When moved to DELIVERED (Shipped)
        if (newStatus === OrderStatus.DELIVERED && !order.shippedDate) {
           updates.shippedDate = new Date().toLocaleDateString('en-GB');
        }

        // When moved to COMPLETED (Arrived)
        if (newStatus === OrderStatus.COMPLETED && !order.arrivalDate) {
           updates.arrivalDate = new Date().toLocaleDateString('en-GB');
        }

        // Handle delivery data update
        if (deliveryData) {
          // If moving to DELIVERED (Sent), save in shipping fields
          if (newStatus === OrderStatus.DELIVERED) {
            updates.shippingCompany = deliveryData.deliveryCompany;
            updates.shippingTrackingNumber = deliveryData.trackingNumber;
          } else {
            // Otherwise it's file delivery info
            updates.deliveryCompany = deliveryData.deliveryCompany;
            updates.trackingNumber = deliveryData.trackingNumber;
          }
        }

        return { ...order, ...updates };
      }
      return order;
    });
    setOrders(updatedOrders);
    localStorage.setItem('dz_orders', JSON.stringify(updatedOrders));
  };

  const handleSubmitDeliveryInfo = () => {
    if (!notificationOrder) return;

    if (!selectedCompany || !trackingInput) {
      setDeliveryFormError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const updatedOrders = orders.map(order => {
      if (order.id === notificationOrder.id) {
        return { 
          ...order, 
          deliveryCompany: selectedCompany,
          trackingNumber: trackingInput
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    localStorage.setItem('dz_orders', JSON.stringify(updatedOrders));
    
    // NOTIFICATION LOGIC: Store notification for Admin
    try {
        const existingNotifications = JSON.parse(localStorage.getItem('dz_admin_delivery_updates') || '[]');
        if (!existingNotifications.includes(notificationOrder.id)) {
            existingNotifications.push(notificationOrder.id);
            localStorage.setItem('dz_admin_delivery_updates', JSON.stringify(existingNotifications));
        }
    } catch (e) {
        console.error("Failed to update admin notifications");
    }

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    
    // Explicitly close and clear states
    setNotificationOrder(null);
    setSelectedCompany('');
    setTrackingInput('');
    setDeliveryFormError('');
    setActiveTab('orders');
  };

  const handleDownloadContract = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Helper to draw boxes
    const drawBoxes = (x: number, y: number, count: number, w = 5, h = 5) => {
      for (let i = 0; i < count; i++) {
        doc.rect(x + (i * w), y, w, h);
      }
    };

    // --- LEFT SIDE ---
    // Header
    doc.setFontSize(10);
    // Logo placeholder (Text)
    doc.setTextColor(0, 50, 150);
    doc.setFont("helvetica", "bold");
    doc.text("Algérie Poste", 20, 20);
    doc.text("بريد الجزائر", 20, 25);
    
    // Box Title
    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.rect(70, 15, 60, 12);
    doc.setFontSize(11);
    doc.text("DEMANDE DE", 100, 20, { align: "center" });
    doc.text("PRELEVEMENT", 100, 25, { align: "center" });

    let y = 45;
    const leftLabelX = 15;
    const leftInputX = 70;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    doc.text("NOM DU CLIENT:", leftLabelX, y);
    drawBoxes(leftInputX, y - 4, 18, 4, 5);
    
    y += 8;
    doc.text("PRENOM DU CLIENT:", leftLabelX, y);
    drawBoxes(leftInputX, y - 4, 18, 4, 5);

    y += 8;
    doc.text("N° CCP A DEBITER:", leftLabelX, y);
    drawBoxes(leftInputX, y - 4, 10, 4, 5);
    doc.text("CLE", leftInputX + 45, y);
    drawBoxes(leftInputX + 52, y - 4, 2, 4, 5);

    y += 8;
    doc.text("N° CCP A CREDITER:", leftLabelX, y);
    drawBoxes(leftInputX, y - 4, 10, 4, 5);
    doc.text("CLE", leftInputX + 45, y);
    drawBoxes(leftInputX + 52, y - 4, 2, 4, 5);

    y += 8;
    doc.text("DATE DE PRELEVEMENT:", leftLabelX, y);
    drawBoxes(leftInputX + 10, y - 4, 2, 4, 5);
    doc.text("DE CHAQUE MOIS", leftInputX + 25, y);

    y += 8;
    doc.text("MONTANT A PRELEVER:", leftLabelX, y);
    drawBoxes(leftInputX, y - 4, 12, 4, 5);
    doc.text("DA", leftInputX + 55, y);

    y += 8;
    doc.text("DATE DE DEBUT DE PRELEVEMENT:", leftLabelX, y);
    drawBoxes(leftInputX + 15, y - 4, 8, 4, 5);

    y += 8;
    doc.text("DATE DE FIN DE PRELEVEMENT:", leftLabelX, y);
    drawBoxes(leftInputX + 15, y - 4, 8, 4, 5);

    y += 15;
    doc.text("Fait à ....................................... le ............................", 80, y, { align: "center" });

    // Bottom Box
    y += 10;
    doc.rect(20, y, 110, 35);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CADRE RESERVE AU CCP", 75, y + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.text("DEMANDE ACCEPTEE", 25, y + 12);
    doc.rect(65, y + 9, 8, 5); doc.text("OUI", 67, y + 12.5);
    doc.rect(80, y + 9, 8, 5); doc.text("NON", 82, y + 12.5);
    
    doc.text("MOTIF DU PRÊT", 25, y + 20);
    doc.line(25, y+22, 125, y+22); // line for motif
    doc.text("(1) Barrer la mention inutile", 25, y + 30);


    // --- VERTICAL SEPARATOR ---
    doc.setLineDash([2, 2], 0);
    doc.line(148, 10, 148, 200);
    doc.setLineDash([], 0);


    // --- RIGHT SIDE ---
    const rightX = 158;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("ANNEXE 2", 280, 15, { align: "right" });

    // Title Box
    doc.rect(rightX + 25, 18, 90, 12);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("AUTORISATION DE PRELEVEMENT", rightX + 70, 22, { align: "center" });
    doc.text("SUR CCP", rightX + 70, 27, { align: "center" });

    y = 45;
    const rLabelX = rightX;
    const rInputX = rightX + 55;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text("NOM DU CLIENT:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 18, 4, 5);

    y += 8;
    doc.text("PRENOM DU CLIENT:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 18, 4, 5);

    y += 8;
    doc.text("N° CCP A DEBITER:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 10, 4, 5);
    doc.text("CLE", rInputX + 45, y);
    drawBoxes(rInputX + 52, y - 4, 2, 4, 5);

    y += 8;
    doc.text("N° RIP:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 18, 4, 5); // RIP is usually long

    y += 8;
    doc.text("N° CCP A CREDITER:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 10, 4, 5);
    doc.text("CLE", rInputX + 45, y);
    drawBoxes(rInputX + 52, y - 4, 2, 4, 5);

    y += 8;
    doc.text("DATE DE PRELEVEMENT:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 2, 4, 5);
    doc.text("DE CHAQUE MOIS", rInputX + 12, y);

    y += 8;
    doc.text("MONTANT A PRELEVER:", rLabelX, y);
    drawBoxes(rInputX, y - 4, 12, 4, 5);
    doc.text("DA", rInputX + 55, y);

    y += 8;
    doc.text("DATE DE DEBUT:", rLabelX, y);
    drawBoxes(rInputX + 5, y - 4, 8, 4, 5);
    
    y += 8;
    doc.text("DATE DE FIN:", rLabelX, y);
    drawBoxes(rInputX + 5, y - 4, 8, 4, 5);

    y += 10;
    doc.setFontSize(8);
    const textWidth = 125;
    const t1 = "Je soussigné(e) autorise le Directeur du Centre National des Chèques Postaux à débiter mon compte des ordres de prélèvement établis à mon nom par DzInstallments SARL.";
    const lines1 = doc.splitTextToSize(t1, textWidth);
    doc.text(lines1, rLabelX, y);
    
    y += 12;
    const t2 = "Je déclare en outre que les réclamations éventuelles concernant les ordres de prélèvement présentés seront adressés par mes soins au créancier (DzInstallments).";
    const lines2 = doc.splitTextToSize(t2, textWidth);
    doc.text(lines2, rLabelX, y);

    y += 12;
    const t3 = "Je m'engage à maintenir au compte ou à y constituer 10 jours avant la date d'échéance une provision suffisante permettant la réalisation de ces opérations.";
    const lines3 = doc.splitTextToSize(t3, textWidth);
    doc.text(lines3, rLabelX, y);

    y += 12;
    const t4 = "Les ordres de débits ne pouvant être exécutés par suite d'insuffisance d'avoir au compte courant postal sont soumis à une taxe de 150,00 DA.";
    const lines4 = doc.splitTextToSize(t4, textWidth);
    doc.text(lines4, rLabelX, y);

    y += 15;
    doc.text("Fait à ....................................... Le ............................", rLabelX + 30, y);

    y += 10;
    doc.setLineDash([1, 1], 0);
    doc.rect(rLabelX, y, 30, 20); // Cachet APC box
    doc.setLineDash([], 0);
    doc.text("Cachet de l'APC", rLabelX + 3, y - 2);

    doc.setFontSize(10);
    doc.text("Signature du client", rLabelX + 80, y + 5);

    doc.save("عقد التقسيط.pdf");
    
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const openDeliveryModal = (order: Order) => {
    setNotificationOrder(order);
    setSelectedCompany(order.deliveryCompany || '');
    setTrackingInput(order.trackingNumber || '');
  };

  const isAdmin = user?.role === 'admin';

  if (showAuth) {
    return (
      <Auth 
        onLogin={handleLogin} 
        onRegister={handleRegister}
        onBack={() => setShowAuth(false)}
        existingUsers={users}
      />
    );
  }

  // Styles for the explosion animation
  const explosionStyles = `
    @keyframes explode {
      0% { transform: scale(0); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .explosion-particle {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      animation: explode 1s ease-out infinite;
    }
  `;

  return (
    <div className="pb-20 md:pb-0 min-h-screen bg-gray-50 font-sans">
      <style>{explosionStyles}</style>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => setActiveTab('home')}>
             <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
               <Package size={24} />
             </div>
             <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">DzInstallments</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                 <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hidden sm:flex">
                    <div className="bg-emerald-100 text-emerald-700 p-1 rounded-full">
                       <CheckCircle size={14} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user.firstName}</span>
                 </div>
                 {/* Mobile User Name Display */}
                 <div className="flex sm:hidden items-center gap-2 text-xs font-bold text-gray-700">
                    <span className="truncate max-w-[80px]">{user.firstName}</span>
                 </div>
                 <button 
                   onClick={handleLogout}
                   className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                   title="تسجيل خروج"
                 >
                   <LogOut size={20} />
                 </button>
              </>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                <LogIn size={16} />
                <span>دخول / تسجيل</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isAdmin ? (
          <AdminDashboard 
            orders={orders} 
            users={users}
            products={products}
            onUpdateStatus={handleUpdateOrderStatus}
            onAddUser={handleAddUserByAdmin}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <>
             {activeTab === 'home' && (
               <div className="animate-fadeIn">
                 {/* Hero Banner */}
                 <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                       <h2 className="text-2xl font-bold mb-2">أفضل عروض التقسيط في الجزائر</h2>
                       <p className="opacity-90 text-sm mb-4">اطلب أجهزتك المفضلة الآن وادفع براحتك على 12، 18، أو 24 شهر.</p>
                       <button className="bg-white text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-gray-50 transition-colors">
                         اكتشف العروض
                       </button>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                       <Package size={140} />
                    </div>
                 </div>

                 <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Smartphone className="text-emerald-600" /> أحدث المنتجات
                 </h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {products.map((product) => (
                     <ProductCard 
                       key={product.id} 
                       product={product} 
                       onClick={() => setSelectedProduct(product)} 
                     />
                   ))}
                 </div>
               </div>
             )}

             {activeTab === 'orders' && (
               <div className="animate-fadeIn">
                 <MyOrders 
                   orders={orders.filter(o => o.customerPhone === user?.phone1)} 
                   onAddDeliveryInfo={openDeliveryModal}
                 />
               </div>
             )}
          </>
        )}
      </main>

      {/* Customer Bottom Navigation */}
      {!isAdmin && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-30 safe-area-bottom">
          <div className="flex justify-around items-center">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              <div className={`p-1 rounded-full ${activeTab === 'home' ? 'bg-emerald-50' : ''}`}>
                 <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold">الرئيسية</span>
            </button>
            
            {user && (
              <button 
                onClick={() => {
                  setActiveTab('orders');
                  setHasUnreadOrders(false);
                }}
                className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'orders' ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                <div className={`p-1 rounded-full ${activeTab === 'orders' ? 'bg-emerald-50' : ''} relative`}>
                   <Package size={24} strokeWidth={activeTab === 'orders' ? 2.5 : 2} />
                   {hasUnreadOrders && (
                     <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                   )}
                </div>
                <span className="text-[10px] font-bold">طلباتي</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails 
          product={selectedProduct} 
          user={user}
          onClose={() => setSelectedProduct(null)}
          onOrder={handleOrder}
          onLoginRequired={() => {
             setSelectedProduct(null);
             setShowAuth(true);
          }}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[60] animate-bounce-in border-2 border-orange-300">
           <div className="bg-white/20 p-2 rounded-full">
             <CheckCircle className="text-white animate-pulse" size={28} />
           </div>
           <span className="font-bold text-lg">تمت العملية بنجاح!</span>
        </div>
      )}

      {/* Preliminary Approval & Delivery Info Modal */}
      {notificationOrder && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={(e) => {
            // Clicking backdrop allows closing
            closeNotification();
        }}>
           <div className="flex min-h-full items-center justify-center p-4">
               <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleUp relative my-8" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-emerald-600 p-6 text-white text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 pattern-dots"></div>
                     <div className="relative z-10">
                       <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                          <Bell size={32} />
                       </div>
                       <h2 className="text-2xl font-bold">مبروك! تمت الموافقة الأولية</h2>
                       <p className="text-emerald-100 text-sm mt-1">طلبك لـ "{notificationOrder.productName}" قيد المعالجة</p>
                     </div>
                     <button 
                       onClick={closeNotification} 
                       className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-20 hover:bg-white/20 active:scale-95"
                     >
                        <X size={28} />
                     </button>
                  </div>

                  <div className="p-6 space-y-6">
                     
                     {/* Warning/Instruction Block - REDESIGNED */}
                     <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div> {/* Accent strip */}
                        <div className="flex gap-3 mb-3">
                           <div className="bg-orange-100 p-2 rounded-full h-fit shrink-0">
                              <AlertCircle className="text-orange-600" size={24} />
                           </div>
                           <div>
                              <h3 className="font-bold text-orange-900 text-lg mb-1">تعليمات إكمال الملف</h3>
                              <p className="text-xs text-orange-700/80 font-semibold">لضمان قبول ملفك بسرعة، يرجى اتباع الخطوات التالية بدقة:</p>
                           </div>
                        </div>
                        <ul className="space-y-2 pr-2">
                           <li className="flex items-start gap-2 text-sm font-bold text-orange-800">
                              <span className="bg-orange-200 text-orange-800 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                              تحميل وطباعة عقد البيع بالتقسيط.
                           </li>
                           <li className="flex items-start gap-2 text-sm font-bold text-orange-800">
                              <span className="bg-orange-200 text-orange-800 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                              إمضاء العقد والمصادقة عليه في البلدية.
                           </li>
                           <li className="flex items-start gap-2 text-sm font-bold text-orange-800">
                              <span className="bg-orange-200 text-orange-800 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                              إرفاق كشف الحساب البريدي (CCP).
                           </li>
                           <li className="flex items-start gap-2 text-sm font-bold text-orange-800">
                              <span className="bg-orange-200 text-orange-800 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                              إرفاق نسخة من بطاقة التعريف الوطنية.
                           </li>
                        </ul>
                     </div>

                     {/* Step 1: Download Contract - REDESIGNED */}
                     <button
                       onClick={handleDownloadContract}
                       className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-between group border border-emerald-500"
                     >
                         <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl">
                               <FileText size={32} className="text-white" />
                            </div>
                            <div className="text-right">
                               <div className="font-extrabold text-xl">تحميل عقد البيع</div>
                               <div className="text-emerald-100 text-xs font-medium">اضغط هنا لتحميل ملف PDF</div>
                            </div>
                         </div>
                         <div className="bg-white text-emerald-600 p-2 rounded-full shadow-sm">
                            <Download size={24} className="group-hover:animate-bounce" />
                         </div>
                     </button>

                     {/* Step 2: Company Address Info */}
                     <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                           <MapPin size={16} /> عنوان إرسال الملفات
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                           <div className="flex items-start gap-2">
                              <span className="font-bold min-w-[60px]">الشركة:</span>
                              <span>DzInstallments SARL</span>
                           </div>
                           <div className="flex items-start gap-2">
                              <span className="font-bold min-w-[60px]">العنوان:</span>
                              <span>حي 5 جويلية، باب الزوار، الجزائر العاصمة (16024)</span>
                           </div>
                           <div className="flex items-start gap-2">
                              <span className="font-bold min-w-[60px]">الهاتف:</span>
                              <span dir="ltr" className="font-mono">0550 12 34 56</span>
                           </div>
                        </div>
                     </div>

                     {/* Step 3: Delivery Info Form */}
                     <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                           <Truck size={18} className="text-emerald-600" />
                           معلومات إرسال الملف (عبر شركة التوصيل)
                        </h3>
                        
                        <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1.5">شركة التوصيل</label>
                           <div className="relative">
                              <select 
                                 value={selectedCompany}
                                 onChange={(e) => setSelectedCompany(e.target.value)}
                                 className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none appearance-none font-medium text-sm text-gray-700"
                              >
                                 <option value="">اختر شركة التوصيل...</option>
                                 {DELIVERY_COMPANIES.map(company => (
                                   <option key={company} value={company}>{company}</option>
                                 ))}
                              </select>
                              <div className="absolute left-3 top-3.5 pointer-events-none text-gray-400">
                                 <Truck size={16} />
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1.5">رقم التتبع (Tracking Number)</label>
                           <input 
                             type="text" 
                             value={trackingInput}
                             onChange={(e) => setTrackingInput(e.target.value)}
                             placeholder="أدخل رقم تتبع الطرد"
                             className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none font-mono text-sm"
                           />
                        </div>
                        
                        {deliveryFormError && (
                           <p className="text-red-500 text-xs font-bold">{deliveryFormError}</p>
                        )}
                     </div>

                     <Button fullWidth onClick={handleSubmitDeliveryInfo}>
                        <Send size={18} />
                        إرسال المعلومات
                     </Button>
                     
                     <div className="text-center pt-2">
                        <button 
                           onClick={closeNotification}
                           className="text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors"
                        >
                           إغلاق وإدخال المعلومات لاحقاً
                        </button>
                     </div>
                  </div>
               </div>
           </div>
        </div>
      )}

      {/* Celebratory Final Approval Popup (Ready For Shipping) */}
      {finalApprovalPopup && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={closeFinalApprovalPopup}>
          <div className="flex min-h-full items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scaleUp relative" onClick={(e) => e.stopPropagation()}>
                {/* Header with gradient and celebration */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
                   <div className="absolute top-2 left-4 w-4 h-4 rounded-full bg-yellow-400 opacity-80 animate-bounce"></div>
                   <div className="absolute bottom-6 right-8 w-3 h-3 rounded-full bg-pink-400 opacity-80 animate-pulse"></div>
                   <div className="absolute top-8 right-4 w-5 h-5 rounded-full bg-blue-300 opacity-60"></div>

                   <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm ring-4 ring-white/10 animate-pulse">
                         <PartyPopper size={40} className="text-yellow-300" />
                      </div>
                      <h2 className="text-2xl font-extrabold mb-1">ألف مبروك!</h2>
                      <p className="text-indigo-100 font-medium">تمت الموافقة النهائية على طلبك</p>
                   </div>

                   <button 
                     onClick={closeFinalApprovalPopup} 
                     className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-20 hover:bg-white/20 active:scale-95"
                   >
                      <X size={28} />
                   </button>
                </div>

                <div className="p-6 text-center space-y-6">
                   <div className="flex flex-col items-center gap-3">
                      <div className="bg-indigo-50 p-4 rounded-full text-indigo-600">
                         <Gift size={32} />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900 text-lg">{finalApprovalPopup.productName}</h3>
                         <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                            تمت مراجعة ملفك والموافقة عليه بنجاح. سنقوم بتجهيز طلبك وإرساله إليك في أقرب وقت.
                         </p>
                      </div>
                   </div>

                   <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-left">
                       <Truck className="text-emerald-600 shrink-0" size={24} />
                       <div>
                          <h4 className="font-bold text-emerald-800 text-sm">التوصيل قريباً</h4>
                          <p className="text-xs text-emerald-700">سيتم إشعارك عند خروج الطلب للتوصيل.</p>
                       </div>
                   </div>

                   <Button fullWidth onClick={closeFinalApprovalPopup} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
                      شكراً لكم
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* SHIPPED / DELIVERED Popup */}
      {shippedPopup && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/75 backdrop-blur-md" onClick={closeShippedPopup}>
          <div className="flex min-h-full items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scaleUp relative" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-8 text-white text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/10 pattern-grid-lg opacity-20"></div>
                   
                   <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-lg ring-4 ring-white/20 animate-bounce">
                         <Truck size={40} className="text-white drop-shadow-md" />
                      </div>
                      <h2 className="text-2xl font-extrabold mb-1 drop-shadow-sm">تم إرسال طلبك!</h2>
                      <p className="text-emerald-100 font-medium text-sm">طلبك في طريقه إليك الآن</p>
                   </div>

                   <button 
                     onClick={closeShippedPopup} 
                     className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-20 hover:bg-white/20 active:scale-95"
                   >
                      <X size={28} />
                   </button>
                </div>

                <div className="p-6 text-center space-y-6">
                   <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm mb-1">{shippedPopup.productName}</h3>
                        <p className="text-xs text-gray-500">تم تسليم الطلب لشركة التوصيل بنجاح</p>
                   </div>

                   <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-4">
                       <h4 className="font-bold text-emerald-900 flex items-center justify-center gap-2">
                          <PackageCheck size={18} /> معلومات التتبع
                       </h4>
                       
                       <div className="space-y-3">
                           <div className="flex justify-between items-center text-sm border-b border-emerald-100 pb-2">
                              <span className="text-gray-500 font-bold">شركة التوصيل</span>
                              <span className="font-bold text-gray-800">{shippedPopup.shippingCompany}</span>
                           </div>
                           <div className="flex flex-col gap-1.5">
                              <span className="text-gray-500 font-bold text-xs text-right">رقم التتبع</span>
                              <button 
                                onClick={() => handleCopyTracking(shippedPopup.shippingTrackingNumber || '')}
                                className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-3 hover:bg-emerald-50 transition-colors group"
                              >
                                 <span className="font-mono font-bold text-lg text-gray-800 tracking-wider">
                                    {shippedPopup.shippingTrackingNumber}
                                 </span>
                                 {copiedTracking ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-400 group-hover:text-emerald-600" />}
                              </button>
                           </div>
                       </div>
                   </div>

                   <Button fullWidth onClick={closeShippedPopup} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                      متابعة الطلب
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* COMPLETED / RECEIVED Popup (New! Explosive Celebration) */}
      {completedPopup && (
        <div className="fixed inset-0 z-[90] overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center" onClick={closeCompletedPopup}>
            {/* CSS Explosion Particles Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="explosion-particle" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        backgroundColor: ['#fbbf24', '#f472b6', '#34d399', '#60a5fa'][Math.floor(Math.random() * 4)],
                        animationDelay: `${Math.random() * 2}s`,
                        width: `${Math.random() * 15 + 5}px`,
                        height: `${Math.random() * 15 + 5}px`
                    }}></div>
                ))}
            </div>

            <div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl animate-scaleUp overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-10 text-center relative overflow-hidden">
                    {/* Sunburst effect */}
                    <div className="absolute inset-0 opacity-20 animate-spin-slow">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_10deg,white_10deg_20deg,transparent_20deg_30deg,white_30deg_40deg,transparent_40deg_50deg,white_50deg_60deg,transparent_60deg_70deg,white_70deg_80deg,transparent_80deg_90deg,white_90deg_100deg,transparent_100deg_110deg,white_110deg_120deg,transparent_120deg_130deg,white_130deg_140deg,transparent_140deg_150deg,white_150deg_160deg,transparent_160deg_170deg,white_170deg_180deg,transparent_180deg_190deg,white_190deg_200deg,transparent_200deg_210deg,white_210deg_220deg,transparent_220deg_230deg,white_230deg_240deg,transparent_240deg_250deg,white_250deg_260deg,transparent_260deg_270deg,white_270deg_280deg,transparent_280deg_290deg,white_290deg_300deg,transparent_300deg_310deg,white_310deg_320deg,transparent_320deg_330deg,white_330deg_340deg,transparent_340deg_350deg,white_350deg_360deg)]"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative mb-6">
                            <Star size={64} className="text-white fill-yellow-200 animate-pulse drop-shadow-lg" />
                            <Sparkles size={32} className="absolute -top-2 -right-4 text-white animate-bounce" />
                            <Sparkles size={24} className="absolute bottom-0 -left-4 text-white animate-bounce delay-100" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white drop-shadow-md mb-2">وصل طلبك!</h2>
                        <p className="text-yellow-50 font-bold text-lg">نتمنى أن ينال إعجابك</p>
                    </div>
                    
                    <button onClick={closeCompletedPopup} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm z-20">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-gray-600">شكراً لثقتكم بخدمة</p>
                        <h3 className="text-2xl font-bold text-emerald-600">DzInstallments</h3>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                        <img src={completedPopup.productImage} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                        <div className="text-right flex-1">
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{completedPopup.productName}</h4>
                            <p className="text-emerald-600 font-bold text-xs mt-1">تم الاستلام بنجاح ✅</p>
                        </div>
                    </div>

                    <Button fullWidth onClick={closeCompletedPopup} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-orange-200 transform hover:-translate-y-1 transition-all">
                        رائع! شكراً لكم
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Rejection Notification Modal */}
      {rejectionPopup && (
         <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={closeRejectionPopup}>
            <div className="flex min-h-full items-center justify-center p-4">
               <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleUp relative my-8" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-red-600 p-6 text-white text-center relative">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                          <XCircle size={32} />
                       </div>
                       <h2 className="text-2xl font-bold">عذراً، تم رفض طلبك</h2>
                       <p className="text-red-100 text-sm mt-1">
                          طلبك لـ "{rejectionPopup.productName}"
                       </p>
                       <button 
                         onClick={closeRejectionPopup} 
                         className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-20 hover:bg-white/20 active:scale-95"
                       >
                          <X size={28} />
                       </button>
                  </div>

                  <div className="p-6">
                     <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                        <img src={rejectionPopup.productImage} alt="" className="w-16 h-16 rounded-lg object-cover bg-white" />
                        <div>
                           <div className="font-bold text-gray-900">{rejectionPopup.productName}</div>
                           <div className="text-xs text-gray-500 mt-1">{rejectionPopup.date}</div>
                        </div>
                     </div>

                     <div className="space-y-2 mb-6">
                        <h3 className="text-sm font-bold text-gray-700">سبب الرفض:</h3>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-sm leading-relaxed">
                           {rejectionPopup.rejectionReason || "لم يتم تحديد سبب، يرجى الاتصال بخدمة العملاء."}
                        </div>
                     </div>

                     <Button fullWidth onClick={closeRejectionPopup} variant="secondary">
                        إغلاق
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

export default App;
