
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, CalendarCheck, FileText, FolderCheck, Truck, Hash, Edit, CalendarX, PackageCheck, Receipt, Wallet } from 'lucide-react';

interface MyOrdersProps {
  orders: Order[];
  onAddDeliveryInfo: (order: Order) => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ orders, onAddDeliveryInfo }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'transactions'>('requests');

  // Filter out completed orders for the "Requests" tab so they don't clutter the active view
  const activeRequests = orders.filter(o => o.status !== OrderStatus.COMPLETED);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Package size={64} className="mb-4 opacity-50" />
        <p className="text-lg">لا توجد طلبات حتى الآن</p>
      </div>
    );
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return <PackageCheck size={16} />;
      case OrderStatus.APPROVED: return <CheckCircle size={16} />;
      case OrderStatus.READY_FOR_SHIPPING: return <PackageCheck size={16} />;
      case OrderStatus.WAITING_FOR_FILES: return <FileText size={16} />;
      case OrderStatus.REJECTED: return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800';
      case OrderStatus.APPROVED: return 'bg-green-100 text-green-700';
      case OrderStatus.READY_FOR_SHIPPING: return 'bg-indigo-100 text-indigo-700';
      case OrderStatus.WAITING_FOR_FILES: return 'bg-blue-100 text-blue-700';
      case OrderStatus.REJECTED: return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  // Helper to ensure dates are displayed as DD/MM/YYYY
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    // Handle YYYY-MM-DD (Mock Data)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-2xl font-bold">فضاء الزبون</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-6 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'requests' 
              ? 'text-emerald-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Package size={18} />
          طلباتي
          {activeTab === 'requests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-6 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'transactions' 
              ? 'text-emerald-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Wallet size={18} />
          سجل المعاملات
          {activeTab === 'transactions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
          )}
        </button>
      </div>
      
      {activeTab === 'requests' ? (
        /* Requests Table */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            {activeRequests.length > 0 ? (
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">المنتج</th>
                    <th className="px-6 py-4 whitespace-nowrap">القسط الشهري</th>
                    <th className="px-6 py-4 whitespace-nowrap">تاريخ الطلب</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">الحالة</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">معلومات التوصيل</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">تواريخ</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">تاريخ الرفض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRequests.map((order) => {
                     // Determine which delivery info to show
                     const isDelivered = order.status === OrderStatus.DELIVERED;
                     const displayCompany = isDelivered ? order.shippingCompany : order.deliveryCompany;
                     const displayTracking = isDelivered ? order.shippingTrackingNumber : order.trackingNumber;

                     return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Product Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img 
                            src={order.productImage} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200" 
                          />
                          <div>
                            <div className="font-bold text-gray-900">{order.productName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{order.monthlyPrice.toLocaleString()} دج</span>
                            <span className="text-xs text-gray-500 font-medium">لمدة {order.months} أشهر</span>
                         </div>
                      </td>

                      {/* Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">
                        <span dir="ltr">{formatDate(order.date)}</span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center align-top">
                        <div className="flex flex-col items-center gap-2">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                          {/* Show rejection reason here inside status column */}
                          {order.status === OrderStatus.REJECTED && order.rejectionReason && (
                               <div className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 max-w-[150px] whitespace-normal text-center leading-tight">
                                 {order.rejectionReason}
                               </div>
                          )}
                        </div>
                      </td>

                      {/* Delivery Info Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {displayCompany ? (
                          <div className="flex flex-col items-center gap-1.5">
                             <div className={`flex items-center gap-1.5 font-bold text-xs px-2 py-1 rounded-lg border ${isDelivered ? 'bg-green-50 text-green-800 border-green-100' : 'bg-gray-50 text-gray-800 border-gray-100'}`}>
                               <Truck size={12} className={isDelivered ? "text-green-600" : "text-emerald-600"} />
                               {displayCompany}
                             </div>
                             {displayTracking && (
                               <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[10px] bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100" title="رقم التتبع">
                                  <Hash size={10} />
                                  {displayTracking}
                               </div>
                             )}
                          </div>
                        ) : (
                          order.status === OrderStatus.WAITING_FOR_FILES ? (
                            <button 
                              onClick={() => onAddDeliveryInfo(order)}
                              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold animate-pulse"
                            >
                              <Edit size={18} />
                              إدخال معلومات التوصيل
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs font-medium">-</span>
                          )
                        )}
                      </td>

                      {/* Approval Dates Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col gap-1 items-center w-full">
                          {order.preliminaryApprovalDate ? (
                            <div className="flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 w-full min-w-[200px]">
                               <span className="text-[11px] font-medium whitespace-nowrap">الموافقة الأولية:</span>
                               <span className="font-mono text-xs font-medium" dir="ltr">{formatDate(order.preliminaryApprovalDate)}</span>
                               <CalendarCheck size={14} className="opacity-70 flex-shrink-0" />
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}

                          {order.filesReceiptDate && (
                            <div className="flex items-center justify-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 w-full min-w-[200px]">
                               <span className="text-[11px] font-medium whitespace-nowrap">الموافقة النهائية:</span>
                               <span className="font-mono text-xs font-medium" dir="ltr">{formatDate(order.filesReceiptDate)}</span>
                               <CheckCircle size={14} className="opacity-70 flex-shrink-0" />
                            </div>
                          )}

                          {/* NEW: Shipped Date */}
                          {order.shippedDate && (
                            <div className="flex items-center justify-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-full min-w-[200px]">
                               <span className="text-[11px] font-medium whitespace-nowrap">تاريخ الإرسال:</span>
                               <span className="font-mono text-xs font-medium" dir="ltr">{formatDate(order.shippedDate)}</span>
                               <Truck size={14} className="opacity-70 flex-shrink-0" />
                            </div>
                          )}

                          {/* NEW: Arrival Date */}
                          {order.arrivalDate && (
                            <div className="flex items-center justify-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-100 w-full min-w-[200px]">
                               <span className="text-[11px] font-medium whitespace-nowrap">تاريخ الوصول:</span>
                               <span className="font-mono text-xs font-medium" dir="ltr">{formatDate(order.arrivalDate)}</span>
                               <PackageCheck size={14} className="opacity-70 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Rejection Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         {order.rejectionDate ? (
                            <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-2 py-1 rounded-lg border border-red-100 w-fit mx-auto" title="تاريخ الرفض">
                               <CalendarX size={14} />
                               <span className="font-mono text-xs" dir="ltr">{formatDate(order.rejectionDate)}</span>
                            </div>
                         ) : (
                            <span className="text-gray-300 text-xs">-</span>
                         )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                 <PackageCheck size={48} className="mb-3 opacity-20" />
                 <p>لا توجد طلبات جارية حالياً</p>
                 <p className="text-xs mt-1">الطلبات المكتملة موجودة في سجل المعاملات</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Transactions Table */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">التفاصيل</th>
                    <th className="px-6 py-4 whitespace-nowrap">المبلغ الإجمالي</th>
                    <th className="px-6 py-4 whitespace-nowrap">مبلغ القسط</th>
                    <th className="px-6 py-4 whitespace-nowrap">عدد الأشهر</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">تواريخ</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">تاريخ الرفض</th>
                    <th className="px-6 py-4 whitespace-nowrap">التاريخ</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <img 
                                  src={order.productImage} 
                                  alt="" 
                                  className="w-8 h-8 rounded-lg object-cover bg-gray-100 border border-gray-200" 
                                />
                                <span className="text-gray-900 font-medium">{order.productName}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">{(order.monthlyPrice * order.months).toLocaleString()} دج</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{order.monthlyPrice.toLocaleString()} دج</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.months} أشهر</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col gap-1 items-center w-full">
                                {order.preliminaryApprovalDate ? (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <CalendarCheck size={12} className="text-emerald-600" />
                                        <span>الأولية:</span>
                                        <span className="font-mono" dir="ltr">{formatDate(order.preliminaryApprovalDate)}</span>
                                    </div>
                                ) : <span className="text-gray-300 text-xs">-</span>}
                                {order.filesReceiptDate && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <CheckCircle size={12} className="text-indigo-600" />
                                        <span>النهائية:</span>
                                        <span className="font-mono" dir="ltr">{formatDate(order.filesReceiptDate)}</span>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            {order.rejectionDate ? (
                                <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-2 py-1 rounded-lg border border-red-100 w-fit mx-auto" title="تاريخ الرفض">
                                    <CalendarX size={12} />
                                    <span className="font-mono text-xs" dir="ltr">{formatDate(order.rejectionDate)}</span>
                                </div>
                            ) : (
                                <span className="text-gray-300 text-xs">-</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-500" dir="ltr">{formatDate(order.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-800' :
                                order.status === OrderStatus.DELIVERED ? 'bg-cyan-100 text-cyan-800' :
                                order.status === OrderStatus.REJECTED ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {order.status === OrderStatus.COMPLETED && <PackageCheck size={12} />}
                                {order.status === OrderStatus.COMPLETED ? 'تم الاستلام' : 
                                 order.status === OrderStatus.DELIVERED ? 'تم الإرسال' :
                                 order.status === OrderStatus.REJECTED ? 'ملغاة' : 'قيد المعالجة'}
                            </span>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}
      
      {/* Mobile Hint */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-2 sm:hidden">
         <span>اسحب الجدول يميناً ويساراً لعرض التفاصيل</span>
      </div>
    </div>
  );
};

export default MyOrders;
