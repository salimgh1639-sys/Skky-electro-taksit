
import React, { useState } from 'react';
import { User } from '../types';
import { ALGERIA_WILAYAS } from '../constants';
import Button from './Button';
import { Eye, EyeOff, Upload, User as UserIcon, Lock, Mail, Phone, CreditCard, MapPin, FileText, CheckCircle, Zap, AlertCircle, X } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onRegister?: (user: User) => void;
  onBack: () => void;
  existingUsers?: User[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, onBack, existingUsers = [] }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email, Phone, or CCP
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [formData, setFormData] = useState<User & { password: string; confirmPassword: string }>({
    firstName: '',
    lastName: '',
    birthDate: '',
    phone1: '',
    phone2: '',
    email: '',
    password: '',
    confirmPassword: '',
    wilaya: ALGERIA_WILAYAS[0],
    baladyia: '',
    address: '',
    ccpNumber: '',
    ccpKey: '',
    nin: '',
    ninExpiry: '',
  });

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

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldWarning, setFieldWarning] = useState<{field: string, msg: string} | null>(null);

  // Regex for Latin characters only
  const latinRegex = /^[A-Za-z\s]+$/;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Latin validation for names
    if (name === 'firstName' || name === 'lastName') {
      if (value !== '' && !latinRegex.test(value)) {
        setFieldWarning({ field: name, msg: 'يرجى الكتابة بالأحرف اللاتينية فقط' });
        return; 
      } else {
        setFieldWarning(null);
      }
    }

    // CCP Key max length validation
    if (name === 'ccpKey' && value.length > 2) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const handleQuickLogin = (role: 'admin' | 'customer') => {
    const now = new Date().toISOString();
    const mockUser: User = {
      firstName: role === 'admin' ? 'Admin' : 'Ahmed',
      lastName: role === 'admin' ? 'Manager' : 'Ben Mohamed',
      birthDate: '1990-01-01',
      email: role === 'admin' ? 'admin@dzinstall.com' : 'client@dzinstall.com',
      phone1: '0550000000',
      wilaya: ALGERIA_WILAYAS[0], // Adrar
      baladyia: 'Adrar Centre',
      address: 'Hay 5 Juillet',
      ccpNumber: '12345678',
      ccpKey: '99',
      nin: '1099000111222',
      ninExpiry: '2030-12-31',
      role: role,
      registrationDate: role === 'admin' ? '2023-01-01T00:00:00.000Z' : now,
      lastLoginDate: now
    };
    onLogin(mockUser);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login logic
    
    // First check existing users from props (Real registered users)
    const foundUser = existingUsers.find(u => 
      u.email === loginIdentifier || 
      u.phone1 === loginIdentifier || 
      u.ccpNumber === loginIdentifier
    );

    if (foundUser) {
      if (foundUser.password === loginPassword || !foundUser.password) { // Simple check, real app hashes passwords
        onLogin(foundUser);
        return;
      } else {
        setError('كلمة المرور غير صحيحة');
        return;
      }
    }

    // Fallback for demo login if no user found
    if (loginIdentifier && loginPassword) {
      const now = new Date().toISOString();
      const mockUser: User = {
        firstName: 'User',
        lastName: 'Demo',
        birthDate: '1990-01-01',
        email: loginIdentifier.includes('@') ? loginIdentifier : 'user@example.com',
        phone1: !loginIdentifier.includes('@') ? loginIdentifier : '0550000000',
        wilaya: ALGERIA_WILAYAS[0],
        baladyia: 'Demo City',
        address: 'Cite 100 Logements',
        ccpNumber: '00000000',
        ccpKey: '00',
        nin: '1111111111',
        ninExpiry: '2030-01-01',
        role: 'customer',
        registrationDate: now,
        lastLoginDate: now
      };
      onLogin(mockUser);
    } else {
      setError('يرجى ملء جميع الحقول');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
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

    // Check duplicates
    if (existingUsers.some(u => u.email === formData.email)) {
      setError('البريد الإلكتروني مسجل مسبقاً');
      return;
    }
    if (existingUsers.some(u => u.phone1 === formData.phone1)) {
      setError('رقم الهاتف مسجل مسبقاً');
      return;
    }
    if (existingUsers.some(u => u.ccpNumber === formData.ccpNumber)) {
      setError('رقم الحساب البريدي مسجل مسبقاً');
      return;
    }
    if (existingUsers.some(u => u.nin === formData.nin)) {
      setError('رقم بطاقة التعريف مسجل مسبقاً');
      return;
    }

    // Check files
    if (!files.idCardFront || !files.idCardBack || !files.chequeImage || !files.accountStatement) {
      setError('يرجى رفع جميع الوثائق المطلوبة');
      return;
    }

    // Success
    const now = new Date().toISOString();
    const newUser: User = {
      ...formData,
      idCardFront: files.idCardFront.name,
      idCardBack: files.idCardBack.name,
      chequeImage: files.chequeImage.name,
      accountStatement: files.accountStatement.name,
      role: 'customer',
      registrationDate: now,
      lastLoginDate: now
    };

    if (onRegister) {
      onRegister(newUser);
    } else {
      onLogin(newUser);
    }
  };

  const FileInput = ({ label, name }: { label: string; name: keyof typeof files }) => (
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 bg-gray-100 relative">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden relative">
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-10 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          title="رجوع للرئيسية"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="bg-emerald-600 p-8 text-white text-center">
          <h1 className="text-3xl font-extrabold mb-2">DzInstallments</h1>
          <p className="opacity-90">منصة البيع بالتقسيط الأولى في الجزائر</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 font-bold text-center transition-colors ${isLogin ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
          >
            تسجيل الدخول
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 font-bold text-center transition-colors ${!isLogin ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          {isLogin ? (
            <div className="space-y-6">
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني / الهاتف / رقم الحساب</label>
                  <div className="relative">
                     <UserIcon className="absolute right-3 top-3.5 text-gray-400" size={20} />
                     <input 
                       type="text" 
                       className="w-full border p-3 pr-10 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                       placeholder="ادخل معلومات الدخول"
                       value={loginIdentifier}
                       onChange={(e) => setLoginIdentifier(e.target.value)}
                       required
                     />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                  <div className="relative">
                     <Lock className="absolute right-3 top-3.5 text-gray-400" size={20} />
                     <input 
                       type="password" 
                       className="w-full border p-3 pr-10 pl-10 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                       placeholder="********"
                       value={loginPassword}
                       onChange={(e) => setLoginPassword(e.target.value)}
                       required
                     />
                  </div>
                </div>

                <Button fullWidth type="submit" className="mt-4">دخول</Button>
              </form>

              {/* Quick Login Section */}
              <div className="pt-6 border-t border-gray-100">
                 <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4 font-bold">
                   <Zap size={16} />
                   <span>دخول سريع (تجريبي)</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleQuickLogin('customer')}
                      className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    >
                      دخول زبون
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => handleQuickLogin('admin')}
                      className="bg-gray-800 hover:bg-gray-900"
                    >
                      دخول مسؤول
                    </Button>
                 </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                  <UserIcon size={20} className="text-emerald-600" /> المعلومات الشخصية
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الاسم <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="firstName"
                      value={formData.firstName} onChange={handleInputChange}
                      placeholder="Nom"
                      className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none ltr text-left"
                      required
                      dir="ltr"
                    />
                    {fieldWarning?.field === 'firstName' && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1 font-bold animate-pulse">
                        <AlertCircle size={12} />
                        {fieldWarning.msg}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اللقب <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="lastName"
                      value={formData.lastName} onChange={handleInputChange}
                      placeholder="Prénom"
                      className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none ltr text-left"
                      required
                      dir="ltr"
                    />
                    {fieldWarning?.field === 'lastName' && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1 font-bold animate-pulse">
                        <AlertCircle size={12} />
                        {fieldWarning.msg}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد <span className="text-red-500">*</span></label>
                   <input 
                    type="date" 
                    name="birthDate"
                    value={formData.birthDate} 
                    onChange={handleInputChange}
                    className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none" 
                    required 
                   />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-6 flex items-center gap-2">
                  <Phone size={20} className="text-emerald-600" /> معلومات الاتصال
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف 1 <span className="text-red-500">*</span></label>
                      <input 
                        type="tel" name="phone1"
                        value={formData.phone1} onChange={handleInputChange}
                        className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                        placeholder="05/06/07..."
                        required
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف 2</label>
                      <input 
                        type="tel" name="phone2"
                        value={formData.phone2} onChange={handleInputChange}
                        className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                        placeholder="اختياري"
                      />
                   </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3.5 text-gray-400" size={20} />
                      <input 
                        type="email" name="email"
                        value={formData.email} onChange={handleInputChange}
                        className="w-full border p-3 pr-10 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-6 flex items-center gap-2">
                  <MapPin size={20} className="text-emerald-600" /> العنوان
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الولاية <span className="text-red-500">*</span></label>
                      <select 
                        name="wilaya"
                        value={formData.wilaya} onChange={handleInputChange}
                        className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                        required
                      >
                        {ALGERIA_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">البلدية <span className="text-red-500">*</span></label>
                      <input 
                        type="text" name="baladyia"
                        value={formData.baladyia} onChange={handleInputChange}
                        className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان التفصيلي <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="address"
                      value={formData.address} onChange={handleInputChange}
                      className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                      placeholder="رقم المنزل، الشارع، الحي"
                      required
                    />
                 </div>
              </div>

              {/* CCP & ID */}
              <div className="space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-6 flex items-center gap-2">
                  <CreditCard size={20} className="text-emerald-600" /> المعلومات المالية والهوية
                 </h3>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الحساب البريدي (CCP) <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                       <input 
                         type="number" name="ccpNumber"
                         value={formData.ccpNumber} onChange={handleInputChange}
                         className="flex-1 border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                         placeholder="رقم الحساب"
                         required
                       />
                       <input 
                         type="number" name="ccpKey"
                         value={formData.ccpKey} onChange={handleInputChange}
                         className="w-24 border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none text-center"
                         placeholder="Cle"
                         required
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">رقم بطاقة التعريف <span className="text-red-500">*</span></label>
                       <input 
                         type="number" name="nin"
                         value={formData.nin} onChange={handleInputChange}
                         className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                         required
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ انتهاء الصلاحية <span className="text-red-500">*</span></label>
                       <input 
                         type="date" name="ninExpiry"
                         value={formData.ninExpiry} onChange={handleInputChange}
                         className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                         required
                       />
                    </div>
                 </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-6 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> الملفات المرفقة
                 </h3>
                 
                 <FileInput label="صورة بطاقة التعريف (الوجه الأمامي)" name="idCardFront" />
                 <FileInput label="صورة بطاقة التعريف (الوجه الخلفي)" name="idCardBack" />
                 <FileInput label="صورة الشيك البريدي (Chèque Barré)" name="chequeImage" />
                 <FileInput label="كشف الحساب البريدي (آخر 3 أشهر)" name="accountStatement" />
              </div>

              {/* Password */}
              <div className="space-y-4">
                 <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-6 flex items-center gap-2">
                  <Lock size={20} className="text-emerald-600" /> كلمة المرور
                 </h3>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور <span className="text-red-500">*</span></label>
                    <input 
                      type="password" name="password"
                      value={formData.password} onChange={handleInputChange}
                      className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                      required
                      minLength={6}
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                    <input 
                      type="password" name="confirmPassword"
                      value={formData.confirmPassword} onChange={handleInputChange}
                      className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none"
                      required
                      minLength={6}
                    />
                 </div>
              </div>

              <div className="pt-4">
                 <Button fullWidth type="submit">تسجيل وإنشاء حساب</Button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
