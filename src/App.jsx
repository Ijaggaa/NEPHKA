import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const DEFAULT_STORES = [
  { id: 'store-1', name: 'Shree Balaji Sweets & Chaat', category: 'Sweets & Snacks', delivery_time: '12-15 min', rating: 4.8 },
  { id: 'store-2', name: 'Kisan Kirana & Daily Dairy', category: 'Kirana & Milk', delivery_time: '15-20 min', rating: 4.9 },
  { id: 'store-3', name: 'Haryana Medicos & Health', category: 'Pharmacy', delivery_time: '10-15 min', rating: 4.9 },
  { id: 'store-4', name: 'Kisan Taaza Sabzi & Fal Mandi', category: 'Fruits & Vegetables', delivery_time: '12-18 min', rating: 4.7 }
];

const DEFAULT_PRODUCTS = [
  // Sweets
  { id: 'p1', store_id: 'store-1', name: 'Desi Ghee Jalebi & Malai Rabri', price: 80, mrp: 110, unit: '250 gm', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500', in_stock: true },
  { id: 'p2', store_id: 'store-1', name: 'Special Aloo Matar Samosa (2 Pcs)', price: 30, mrp: 40, unit: '2 Pcs with Chutney', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500', in_stock: true },
  { id: 'p3', store_id: 'store-1', name: 'Gulab Jamun Shahi Box', price: 70, mrp: 90, unit: '4 Pcs Box', image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=500', in_stock: true },
  // Kirana & Milk
  { id: 'p4', store_id: 'store-2', name: 'Fresh Cow Milk Pouch', price: 65, mrp: 68, unit: '1 Litre Pouch', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500', in_stock: true },
  { id: 'p5', store_id: 'store-2', name: 'Chakki Fresh Sharbati Gehu Atta', price: 210, mrp: 245, unit: '5 kg Bag', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500', in_stock: true },
  { id: 'p6', store_id: 'store-2', name: 'Amul Salted Table Butter', price: 58, mrp: 60, unit: '100 gm Pack', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500', in_stock: true },
  // Pharmacy
  { id: 'p7', store_id: 'store-3', name: 'Dolo 650mg Paracetamol Tablets', price: 32, mrp: 35, unit: 'Strip of 15 Tablets', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500', in_stock: true },
  { id: 'p8', store_id: 'store-3', name: 'Band-Aid Washproof Strips', price: 50, mrp: 60, unit: 'Pack of 20 Strips', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500', in_stock: true },
  // Vegetables & Fruits
  { id: 'p9', store_id: 'store-4', name: 'Desi Pahadi Aloo (Potatoes)', price: 35, mrp: 45, unit: '1 kg Taaza Sabzi', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500', in_stock: true },
  { id: 'p10', store_id: 'store-4', name: 'Fresh Robusta Bananas (Kela)', price: 50, mrp: 60, unit: '1 Dozen (12 Pcs)', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500', in_stock: true }
];

const PHOTO_PRESETS = [
  { label: '🍨 Mithai', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500' },
  { label: '🥟 Samosa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500' },
  { label: '🥛 Doodh', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500' },
  { label: '🌾 Atta', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500' },
  { label: '💊 Dawa', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500' },
  { label: '🥔 Sabzi', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500' }
];

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nephka_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authRole, setAuthRole] = useState('customer'); // 'customer', 'dukaan'
  const [dukaanAuthMode, setDukaanAuthMode] = useState('login'); // 'login', 'register'

  // Customer Auth Input
  const [custNameInput, setCustNameInput] = useState('');
  const [custPhoneInput, setCustPhoneInput] = useState('');

  // Dukaan KYC & Login Input
  const [dukaanLoginPhone, setDukaanLoginPhone] = useState('');
  const [dukaanLoginPin, setDukaanLoginPin] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCategory, setRegCategory] = useState('Kirana & Milk');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regPin, setRegPin] = useState('1111');

  // General App State
  const [currentView, setCurrentView] = useState('customer'); // 'customer', 'dukaan', 'admin', 'rider', 'poster'
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);

  // Business Configuration
  const [upiId, setUpiId] = useState(() => localStorage.getItem('nephka_upi') || 'nephka@upi');
  const [supportPhone, setSupportPhone] = useState(() => localStorage.getItem('nephka_phone') || '919876543210');
  const [savedNotice, setSavedNotice] = useState(false);

  // Siren & PWA
  const sirenAudioRef = useRef(null);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Customer Shopping Flow
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dukaan Panel Form
  const [dukaanTab, setDukaanTab] = useState('orders');
  const [selectedDukaanStore, setSelectedDukaanStore] = useState('store-1');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemMrp, setNewItemMrp] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Standard Pack');
  const [newItemImage, setNewItemImage] = useState(PHOTO_PRESETS[0].url);

  // Cart Calculations
  const itemTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const deliveryFee = itemTotal === 0 || itemTotal >= 149 ? 0 : 20;
  const platformFee = itemTotal > 0 ? 3 : 0;
  const grandTotalAmount = itemTotal + deliveryFee + platformFee;

  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=NEPHKA&am=${grandTotalAmount}&cu=INR&tn=QuickOrder`;
  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiIntentUrl)}`;
  const counterStandeeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('https://nephka.com')}`;

  const sendWhatsAppReceipt = (order) => {
    const mapLink = order.lat && order.lng 
      ? `https://maps.google.com/?q=${order.lat},${order.lng}` 
      : `https://maps.google.com/?q=${encodeURIComponent(order.address)}`;

    const msg = 
`⚡ *NEPHKA 15-MIN EXPRESS RECEIPT* ⚡
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${order.customer_name}
📞 *Phone:* ${order.customer_phone}
📍 *Address:* ${order.address}

🛒 *ORDERED ITEMS:*
${order.items.map((it, idx) => `${idx + 1}. ${it.name} x ${it.qty} = ₹${it.price * it.qty}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
💵 *Items Total:* ₹${order.item_subtotal || order.total_amount}
🛵 *Delivery Fee:* ${order.delivery_fee === 0 ? 'FREE' : '₹' + order.delivery_fee}
⚙️ *Platform Fee:* ₹${order.platform_fee || 0}
💰 *GRAND TOTAL:* ₹${order.total_amount}
💳 *PAYMENT:* ${order.payment_status} (${order.payment_method})
🗺️ *MAP NAVIGATION:* ${mapLink}
━━━━━━━━━━━━━━━━━━━━
*NEPHKA - Apna Shehar, Aapki Dukaan*`;

    const sanitizedPhone = order.customer_phone.replace(/[^0-9]/g, '');
    const fullPhone = sanitizedPhone.length === 10 ? '91' + sanitizedPhone : sanitizedPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  useEffect(() => {
    sirenAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    sirenAudioRef.current.loop = true;

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }
    const beforeInstallListener = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', beforeInstallListener);

    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('poster') || hash.includes('poster')) setCurrentView('poster');
    else if (path.includes('dukaan') || hash.includes('dukaan')) setCurrentView('dukaan');
    else if (path.includes('admin') || hash.includes('admin')) setCurrentView('admin');
    else if (path.includes('rider') || hash.includes('rider')) setCurrentView('rider');
    else setCurrentView('customer');

    const fetchDatabase = async () => {
      try {
        const { data: stData } = await supabase.from('stores').select('*');
        if (stData && stData.length > 0) setStores(stData);

        const { data: prData } = await supabase.from('products').select('*');
        if (prData && prData.length > 0) setProducts(prData);

        const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (ordData) setOrders(ordData);
      } catch (e) {}
    };
    fetchDatabase();

    const realtimeSync = supabase
      .channel('master_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)));
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallListener);
      supabase.removeChannel(realtimeSync);
      if (sirenAudioRef.current) sirenAudioRef.current.pause();
    };
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'placed').length;
  useEffect(() => {
    if (currentView === 'dukaan' && pendingOrders > 0 && !isSirenMuted) {
      sirenAudioRef.current?.play().catch(() => {});
    } else {
      sirenAudioRef.current?.pause();
      if (sirenAudioRef.current) sirenAudioRef.current.currentTime = 0;
    }
  }, [currentView, pendingOrders, isSirenMuted]);

  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') setShowInstallBanner(false);
        setDeferredPrompt(null);
      });
    } else {
      alert('iPhone / Safari: Share icon (⎋) dabakar "Add to Home Screen" par tap karein.');
    }
  };

  const routeTo = (view) => {
    setCurrentView(view);
    window.history.pushState({}, '', view === 'customer' ? '/' : `/${view}`);
    window.scrollTo(0, 0);
  };

  const logoutUser = () => {
    localStorage.removeItem('nephka_user');
    setCurrentUser(null);
    setCart([]);
    routeTo('customer');
  };

  // --- 1. Customer Login Handler ---
  const handleCustomerLogin = (e) => {
    e.preventDefault();
    if (!custNameInput || !custPhoneInput) return alert('Naam aur mobile number bharein!');
    const userObj = {
      role: 'customer',
      name: custNameInput.trim(),
      phone: custPhoneInput.trim()
    };
    localStorage.setItem('nephka_user', JSON.stringify(userObj));
    setCurrentUser(userObj);
    routeTo('customer');
  };

  // --- 2. Dukaan Login Handler ---
  const handleDukaanLogin = (e) => {
    e.preventDefault();
    if (!dukaanLoginPhone || !dukaanLoginPin) return alert('Phone aur PIN enter karein!');
    if (dukaanLoginPin !== '1111') return alert('Galat Security PIN! (Default PIN: 1111)');

    const matchedStore = stores.find((s) => s.phone === dukaanLoginPhone) || stores[0];
    const userObj = {
      role: 'dukaan',
      name: matchedStore.name,
      phone: dukaanLoginPhone,
      storeId: matchedStore.id
    };
    localStorage.setItem('nephka_user', JSON.stringify(userObj));
    setCurrentUser(userObj);
    setSelectedDukaanStore(matchedStore.id);
    routeTo('dukaan');
  };

  // --- 3. Dukaan Registration With Aadhaar & PAN Card KYC ---
  const handleDukaanKycRegister = async (e) => {
    e.preventDefault();
    if (!regStoreName || !regOwnerName || !regPhone || !regAadhaar || !regPan) {
      return alert('Kripya Aadhaar, PAN aur Dukaan ki poori jaankari bharein!');
    }

    if (regAadhaar.length !== 12) {
      return alert('Aadhaar Card number theek 12 digits ka hona chahiye!');
    }

    if (regPan.length !== 10) {
      return alert('PAN Card number theek 10 characters (e.g. ABCDE1234F) ka hona chahiye!');
    }

    const newStoreId = 'store_' + Date.now();
    const freshStore = {
      id: newStoreId,
      name: regStoreName,
      owner_name: regOwnerName,
      phone: regPhone,
      category: regCategory,
      aadhaar_number: regAadhaar,
      pan_number: regPan.toUpperCase(),
      delivery_time: '15-20 min',
      rating: 4.9,
      is_verified: true
    };

    try {
      await supabase.from('stores').insert([freshStore]);
    } catch {}

    setStores((prev) => [...prev, freshStore]);

    const userObj = {
      role: 'dukaan',
      name: freshStore.name,
      phone: freshStore.phone,
      storeId: newStoreId,
      aadhaar: regAadhaar,
      pan: regPan.toUpperCase()
    };

    localStorage.setItem('nephka_user', JSON.stringify(userObj));
    setCurrentUser(userObj);
    setSelectedDukaanStore(newStoreId);
    alert(`🎉 "${freshStore.name}" Aadhaar & PAN KYC ke sath verify ho gayi hai!`);
    routeTo('dukaan');
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try { await supabase.from('orders').update({ status: newStatus }).eq('id', orderId); } catch {}
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const toggleProductStock = async (prodId, currentStock) => {
    const nextStock = !currentStock;
    try { await supabase.from('products').update({ in_stock: nextStock }).eq('id', prodId); } catch {}
    setProducts((prev) => prev.map((p) => (p.id === prodId ? { ...p, in_stock: nextStock } : p)));
  };

  const deleteProduct = async (prodId) => {
    if (!window.confirm('Kya aap is item ko menu se hatana chahte hain?')) return;
    try { await supabase.from('products').delete().eq('id', prodId); } catch {}
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
  };

  const modifyProductPrice = async (prodId) => {
    const entered = prompt('Naya Price (₹) enter karein:');
    if (!entered || isNaN(entered)) return;
    const priceNumber = Number(entered);
    try { await supabase.from('products').update({ price: priceNumber }).eq('id', prodId); } catch {}
    setProducts((prev) => prev.map((p) => (p.id === prodId ? { ...p, price: priceNumber } : p)));
  };

  const detectGpsLocation = () => {
    if (!navigator.geolocation) return alert('Browser mein GPS available nahi hai.');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const geoData = await res.json();
          setAddress(geoData?.display_name || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('GPS location permission allow karein.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addItemToCart = (item) => {
    if (item.in_stock === false) return;
    if (cart.length > 0 && cart[0].store_id !== item.store_id) {
      const activeStoreName = stores.find((s) => s.id === cart[0].store_id)?.name || 'Pehli Dukaan';
      const targetStoreName = stores.find((s) => s.id === item.store_id)?.name || 'Nayi Dukaan';
      const proceed = window.confirm(
        `Cart mein pehle se "${activeStoreName}" ke items hain!\n\nEk baar mein sirf ek dukaan se order ho sakta hai.\n\nKya aap cart reset karke "${targetStoreName}" se order shuru karna chahte hain?`
      );
      if (proceed) {
        setCart([{ ...item, qty: 1 }]);
      }
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      return existing
        ? prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItemFromCart = (prodId) => {
    setCart((prev) => prev.map((i) => (i.id === prodId ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || !currentUser?.name || !currentUser?.phone || !address) {
      return alert('Poori delivery details bharein!');
    }

    setIsSubmitting(true);
    const orderRecord = {
      id: 'ord_' + Date.now(),
      store_id: cart[0]?.store_id || 'store-1',
      customer_name: currentUser.name,
      customer_phone: currentUser.phone,
      address,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      items: cart,
      item_subtotal: itemTotal,
      delivery_fee: deliveryFee,
      platform_fee: platformFee,
      total_amount: grandTotalAmount,
      status: 'placed',
      payment_method: paymentMethod === 'upi' ? 'UPI Online' : 'Cash on Delivery',
      payment_status: paymentMethod === 'upi' ? 'Paid (UPI)' : 'Cash to Collect',
      utr: utrNumber || null,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('orders').insert([orderRecord]);
    } catch {}

    setOrders((prev) => [orderRecord, ...prev]);
    setActiveOrderId(orderRecord.id);
    setIsSubmitting(false);
    setShowCheckout(false);
    setCart([]);
  };

  const handleAddNewItemToDukaan = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return alert('Item ka naam aur price enter karein!');

    const freshItem = {
      id: 'p_' + Date.now(),
      store_id: currentUser?.storeId || selectedDukaanStore,
      name: newItemName,
      price: Number(newItemPrice),
      mrp: newItemMrp ? Number(newItemMrp) : Math.round(Number(newItemPrice) * 1.2),
      unit: newItemUnit || 'Standard Pack',
      image: newItemImage || PHOTO_PRESETS[0].url,
      in_stock: true
    };

    try { await supabase.from('products').insert([freshItem]); } catch {}

    setProducts((prev) => [freshItem, ...prev]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemMrp('');
    setNewItemUnit('Standard Pack');
    alert(`✅ "${freshItem.name}" live jud gaya!`);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('nephka_upi', upiId);
    localStorage.setItem('nephka_phone', supportPhone);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const trackedOrder = orders.find((o) => o.id === activeOrderId);
  const trackStep = trackedOrder?.status === 'delivered' ? 4 : trackedOrder?.status === 'out_for_delivery' ? 3 : trackedOrder?.status === 'accepted' ? 2 : 1;
  const grossSalesVolume = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  // ========================================================
  // RENDER SCREEN: IF NOT LOGGED IN -> UNIFIED LOGIN SCREEN
  // ========================================================
  if (!currentUser && currentView !== 'poster') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
          
          {/* Header & Logo */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-md">
              N
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">NEPHKA</h1>
            <p className="text-xs text-slate-500 font-semibold">⚡ 15-Minute Hyperlocal Superfast Delivery</p>
          </div>

          {/* Role Tabs: Customer vs Dukaan */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold gap-1">
            <button
              onClick={() => setAuthRole('customer')}
              className={`py-2.5 rounded-xl transition ${authRole === 'customer' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}
            >
              👤 Customer (Grahak)
            </button>
            <button
              onClick={() => setAuthRole('dukaan')}
              className={`py-2.5 rounded-xl transition ${authRole === 'dukaan' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}
            >
              🏪 Dukaan (Partner KYC)
            </button>
          </div>

          {/* 1. CUSTOMER LOGIN FORM */}
          {authRole === 'customer' && (
            <form onSubmit={handleCustomerLogin} className="space-y-3.5 text-xs">
              <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-100 text-orange-900">
                <p className="font-bold">🛒 Quick Customer Access</p>
                <p className="text-[11px] text-orange-700">Apne shehar ki dukaano se 15 min mein samaan ghar mangwayein.</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Aapka Naam:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={custNameInput}
                  onChange={(e) => setCustNameInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number (WhatsApp):</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="10-digit Mobile Number"
                  value={custPhoneInput}
                  onChange={(e) => setCustPhoneInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-sm shadow-md transition active:scale-98"
              >
                App Kholein ➔
              </button>
            </form>
          )}

          {/* 2. DUKAAN AUTH & GOVT KYC FORM */}
          {authRole === 'dukaan' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-4 text-xs font-bold border-b pb-2">
                <button
                  type="button"
                  onClick={() => setDukaanAuthMode('login')}
                  className={`${dukaanAuthMode === 'login' ? 'text-orange-600 border-b-2 border-orange-600 pb-1' : 'text-slate-400'}`}
                >
                  Existing Store Login
                </button>
                <button
                  type="button"
                  onClick={() => setDukaanAuthMode('register')}
                  className={`${dukaanAuthMode === 'register' ? 'text-orange-600 border-b-2 border-orange-600 pb-1' : 'text-slate-400'}`}
                >
                  Nayi Dukaan Register (KYC)
                </button>
              </div>

              {/* DUKAAN SUB-OPTION A: LOGIN */}
              {dukaanAuthMode === 'login' && (
                <form onSubmit={handleDukaanLogin} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Registered Mobile Number:</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={dukaanLoginPhone}
                      onChange={(e) => setDukaanLoginPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dukaan Security PIN (Default 1111):</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={dukaanLoginPin}
                      onChange={(e) => setDukaanLoginPin(e.target.value)}
                      className="w-full p-3 text-center tracking-widest text-lg font-black rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-sm shadow-md transition"
                  >
                    Dukaan Dashboard Kholein ➔
                  </button>
                </form>
              )}

              {/* DUKAAN SUB-OPTION B: REGISTRATION WITH AADHAAR & PAN CARD */}
              {dukaanAuthMode === 'register' && (
                <form onSubmit={handleDukaanKycRegister} className="space-y-2.5 text-xs max-h-[62vh] overflow-y-auto pr-1">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-900 text-[11px]">
                    <span className="font-bold">🛡️ Merchant KYC Verification:</span>
                    <p>Dukaan link karne ke liye Aadhaar Card aur PAN Card number bharna zaroori hai.</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Dukaan Ka Naam:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Balaji Sweets / Gupta Kirana"
                      value={regStoreName}
                      onChange={(e) => setRegStoreName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Owner / Maalik Ka Naam:</label>
                    <input
                      type="text"
                      required
                      placeholder="Aapka Poora Naam"
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-0.5">Mobile Number:</label>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="10-digit number"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-0.5">Category:</label>
                      <select
                        value={regCategory}
                        onChange={(e) => setRegCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border outline-none bg-white font-medium"
                      >
                        <option value="Kirana & Milk">Kirana & Milk</option>
                        <option value="Sweets & Snacks">Sweets & Snacks</option>
                        <option value="Pharmacy">Pharmacy / Dawa</option>
                        <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                      </select>
                    </div>
                  </div>

                  {/* AADHAAR CARD NUMBER FIELD */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-0.5">
                      Aadhaar Card Number (12 Digits):
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      required
                      placeholder="12-digit Aadhaar Number"
                      value={regAadhaar}
                      onChange={(e) => setRegAadhaar(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold text-slate-900 tracking-wider"
                    />
                  </div>

                  {/* PAN CARD NUMBER FIELD */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-0.5">
                      PAN Card Number (10 Characters):
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="e.g. ABCDE1234F"
                      value={regPan}
                      onChange={(e) => setRegPan(e.target.value.toUpperCase())}
                      className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-bold text-slate-900 uppercase tracking-wider"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md transition"
                  >
                    Verify KYC & Register Dukaan ➔
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Standee & Admin Links */}
          <div className="pt-2 border-t text-center flex justify-center gap-3 text-[11px] text-slate-400">
            <button onClick={() => routeTo('poster')} className="hover:underline">🖨️ QR Standee</button>
            <span>•</span>
            <button
              onClick={() => {
                const pin = prompt('Enter Admin Master PIN:');
                if (pin === '1111') {
                  setCurrentUser({ role: 'admin', name: 'Master Admin' });
                  routeTo('admin');
                } else alert('Galat PIN!');
              }}
              className="hover:underline text-amber-600 font-bold"
            >
              👑 Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER APP ONCE LOGGED IN
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-sans select-none">
      
      {/* Top Universal Navbar with User Profile & Logout */}
      <header className="sticky top-0 z-40 bg-white shadow-xs border-b px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              N
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">NEPHKA</p>
              <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[130px]">
                {currentUser ? `👤 ${currentUser.name}` : '15-Min Express'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            {currentUser?.role === 'customer' && (
              <button
                onClick={detectGpsLocation}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[11px]"
              >
                {isLocating ? '...' : '📍 GPS'}
              </button>
            )}
            <button
              onClick={logoutUser}
              className="bg-rose-50 border border-rose-200 text-rose-700 px-2 py-1 rounded-lg text-[11px] font-bold active:scale-95"
            >
              Logout ➔
            </button>
          </div>
        </div>
      </header>

      {/* VIEW 1: PRINTABLE DUKAAN QR STANDEE */}
      {currentView === 'poster' && (
        <div className="min-h-screen bg-white text-slate-900 p-6 max-w-lg mx-auto flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center print:hidden pb-4 border-b">
            <button onClick={() => routeTo('customer')} className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              ✕ Back to App
            </button>
            <button onClick={() => window.print()} className="text-xs font-black bg-orange-600 text-white px-4 py-2 rounded-xl shadow-md">
              🖨️ Print Poster (A4)
            </button>
          </div>
          <div className="my-auto py-6 border-4 border-orange-600 rounded-3xl p-6 w-full shadow-2xl bg-gradient-to-b from-orange-50/60 to-white">
            <div className="inline-block bg-orange-600 text-white font-black text-2xl px-5 py-1.5 rounded-2xl mb-2">NEPHKA</div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Ab Dukaan Seedha <br /><span className="text-orange-600">Aapke Ghar Pe!</span></h1>
            <p className="text-sm font-bold text-slate-600 mt-1">⚡ 15-20 Min Superfast Local Delivery</p>
            <div className="my-6 flex flex-col items-center">
              <div className="p-3 bg-white border-4 border-slate-900 rounded-3xl shadow-xl">
                <img src={counterStandeeQrUrl} alt="Scan to Order" className="w-56 h-56 object-contain" />
              </div>
              <p className="text-xs font-black uppercase text-slate-900 mt-2 bg-yellow-300 px-3 py-1 rounded-full">📸 Phone Camera Se Scan Karein</p>
            </div>
            <p className="text-emerald-700 font-black text-xs">✓ Free Delivery ₹149+ Orders Par!</p>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER SHOPPING VIEW */}
      {currentView === 'customer' && (
        <main className="max-w-md mx-auto px-3 pt-3 space-y-3">
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-4 rounded-2xl text-white shadow-md relative overflow-hidden">
            <span className="text-[10px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded-full">Superfast Local</span>
            <h2 className="text-xl font-black mt-1">NEPHKA 15-Min Store</h2>
            <p className="text-xs text-orange-100 font-medium">Shuddh Mithai, Dairy, Dawa & Sabzi</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            {['All', 'Sweets & Snacks', 'Kirana & Milk', 'Pharmacy', 'Fruits & Vegetables'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${activeTab === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {stores.filter((st) => activeTab === 'All' || st.category === activeTab).map((store) => {
              const storeProducts = products.filter((p) => p.store_id === store.id);
              if (storeProducts.length === 0) return null;
              return (
                <div key={store.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{store.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">⭐ {store.rating} • {store.category}</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">⏱ {store.delivery_time}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {storeProducts.map((item) => {
                      const inCart = cart.find((i) => i.id === item.id);
                      return (
                        <div key={item.id} className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
                          <div>
                            <div className="w-full h-28 bg-white rounded-lg overflow-hidden border border-slate-100 mb-2 relative">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              {item.mrp > item.price && (
                                <span className="absolute top-1 left-1 bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</p>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5">{item.name}</h4>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-1">
                            <span className="text-xs font-black text-slate-900">₹{item.price}</span>
                            {inCart ? (
                              <div className="flex items-center gap-2 bg-emerald-700 text-white font-black text-xs px-2 py-1 rounded-lg">
                                <button onClick={() => removeItemFromCart(item.id)} className="px-1 text-emerald-200">-</button>
                                <span>{inCart.qty}</span>
                                <button onClick={() => addItemToCart(item)} className="px-1 text-emerald-200">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addItemToCart(item)} className="bg-white border-2 border-emerald-600 text-emerald-700 text-xs font-black px-3 py-1 rounded-lg">ADD</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Cart */}
          {cart.length > 0 && !showCheckout && (
            <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
              <div onClick={() => setShowCheckout(true)} className="max-w-md mx-auto bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-emerald-500">
                <div>
                  <p className="text-sm font-black leading-tight">₹{grandTotalAmount} • {totalCartCount} ITEMS</p>
                  <p className="text-[10px] text-emerald-200 font-bold">{deliveryFee === 0 ? '✓ Free Delivery Applied' : 'Add more for Free Delivery'}</p>
                </div>
                <span className="font-black text-xs bg-emerald-800/80 px-3 py-1.5 rounded-xl">View Bill ➔</span>
              </div>
            </div>
          )}

          {/* Checkout Slide-Up Sheet */}
          {showCheckout && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-base text-slate-800">Checkout Bill</h3>
                  <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-full bg-slate-100 font-bold">✕</button>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border space-y-1.5 text-xs">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-700">
                      <span>{item.name} x {item.qty}</span>
                      <span className="font-bold">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 flex justify-between font-black text-sm">
                    <span>Payable Total:</span>
                    <span className="text-emerald-700">₹{grandTotalAmount}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrderSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700">Delivery Address:</label>
                    <textarea rows={2} required placeholder="Ghar / Flat / Gali No." value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-medium mt-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPaymentMethod('cod')} className={`py-2 rounded-xl border font-bold ${paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-slate-50'}`}>💵 Cash on Delivery</button>
                    <button type="button" onClick={() => setPaymentMethod('upi')} className={`py-2 rounded-xl border font-bold ${paymentMethod === 'upi' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-slate-50'}`}>⚡ UPI / GPay</button>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-2">
                      <img src={upiQrCodeUrl} alt="UPI QR" className="w-32 h-32 mx-auto border rounded-xl" />
                      <a href={upiIntentUrl} className="block w-full py-2 bg-emerald-600 text-white font-black rounded-xl">📱 Open GPay / PhonePe</a>
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-emerald-600 text-white font-black rounded-2xl text-sm">
                    {isSubmitting ? 'Placing...' : `Confirm Order • ₹${grandTotalAmount}`}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tracking Bar */}
          {trackedOrder && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-4 max-w-md mx-auto rounded-t-3xl shadow-2xl space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-slate-900">{trackStep === 4 ? '🎉 Delivered!' : 'Arriving in 14 Mins'}</h3>
                <button onClick={() => sendWhatsAppReceipt(trackedOrder)} className="text-xs bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg">💬 WhatsApp</button>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full flex">
                <div className={`h-full bg-emerald-500 ${trackStep === 1 ? 'w-1/4' : trackStep === 2 ? 'w-2/4' : trackStep === 3 ? 'w-3/4' : 'w-full'}`} />
              </div>
            </div>
          )}
        </main>
      )}

      {/* VIEW 3: DUKAAN DASHBOARD */}
      {currentView === 'dukaan' && (
        <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto space-y-3">
          {pendingOrders > 0 && (
            <div className="bg-rose-600 text-white p-3 rounded-2xl flex items-center justify-between animate-pulse">
              <div>
                <p className="font-black text-xs">🚨 {pendingOrders} NAYA ORDER AAYA HAI!</p>
                <p className="text-[10px]">Siren lagatar baj rahi hai</p>
              </div>
              <button onClick={() => setIsSirenMuted(!isSirenMuted)} className="bg-white text-rose-700 text-xs font-black px-2.5 py-1 rounded-xl">
                {isSirenMuted ? '🔊 Unmute' : '🔇 Mute'}
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h1 className="text-lg font-black text-orange-500">🏪 DUKAAN DASHBOARD</h1>
              <p className="text-[11px] text-slate-400">{currentUser?.name || 'Verified Merchant'}</p>
            </div>
            <button onClick={() => routeTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700">
              Customer App
            </button>
          </div>

          <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1">
            <button onClick={() => setDukaanTab('orders')} className={`py-2 rounded-lg ${dukaanTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
              Orders ({orders.filter((o) => o.status !== 'delivered').length})
            </button>
            <button onClick={() => setDukaanTab('menu')} className={`py-2 rounded-lg ${dukaanTab === 'menu' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
              Manage Menu & Add
            </button>
          </div>

          {dukaanTab === 'orders' && (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{ord.customer_name}</h4>
                      <p className="text-slate-400">📞 {ord.customer_phone}</p>
                    </div>
                    <span className="font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">{ord.status}</span>
                  </div>
                  <p className="text-slate-300">📍 {ord.address}</p>
                  <div className="border-t border-slate-700 pt-2 text-slate-300">
                    {ord.items?.map((it, idx) => <div key={idx}>{it.name} x {it.qty} (₹{it.price * it.qty})</div>)}
                    <div className="font-bold text-white pt-1">Total: ₹{ord.total_amount} ({ord.payment_status})</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => sendWhatsAppReceipt(ord)} className="py-2 bg-emerald-600 font-bold rounded-lg text-white">💬 WhatsApp</button>
                    {ord.status === 'placed' && (
                      <button onClick={() => updateOrderStatus(ord.id, 'accepted')} className="py-2 bg-orange-600 font-bold rounded-lg text-white">✓ Accept</button>
                    )}
                    {ord.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')} className="py-2 bg-blue-600 font-bold rounded-lg text-white">📦 Send Rider</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dukaanTab === 'menu' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNewItemToDukaan} className="bg-slate-800 p-3 rounded-xl space-y-2 text-xs border border-slate-700">
                <p className="font-black text-sm text-orange-400">➕ Add Item with Photo</p>
                <input type="text" placeholder="Item Name" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Price (₹)" required value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                  <input type="text" placeholder="Unit (500g / 1pc)" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {PHOTO_PRESETS.map((pst, idx) => (
                    <button key={idx} type="button" onClick={() => setNewItemImage(pst.url)} className={`px-2 py-1 rounded text-[10px] font-bold ${newItemImage === pst.url ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-300'}`}>
                      {pst.label}
                    </button>
                  ))}
                </div>
                <button type="submit" className="w-full py-2.5 bg-orange-600 font-bold rounded-xl text-white">Save Item</button>
              </form>

              <div className="space-y-2">
                {products.filter((p) => p.store_id === (currentUser?.storeId || selectedDukaanStore)).map((item) => (
                  <div key={item.id} className="bg-slate-800 p-2.5 rounded-xl flex justify-between items-center text-xs border border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-orange-400 font-bold">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleProductStock(item.id, item.in_stock)} className={`px-2.5 py-1 rounded-lg font-bold ${item.in_stock !== false ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                        {item.in_stock !== false ? 'In Stock' : 'Out'}
                      </button>
                      <button onClick={() => deleteProduct(item.id)} className="px-2 py-1 rounded bg-slate-700 text-slate-300 font-bold">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: ADMIN VIEW */}
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h1 className="text-xl font-black text-amber-500">👑 MASTER ADMIN</h1>
            <button onClick={() => routeTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg">Exit</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <p className="text-[11px] text-slate-400">Total Volume</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">₹{grossSalesVolume}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <p className="text-[11px] text-slate-400">Total Orders</p>
              <p className="text-2xl font-black text-orange-400 mt-1">{orders.length}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
            <h3 className="font-bold text-amber-400 uppercase">Onboarded Stores ({stores.length})</h3>
            {stores.map((s) => (
              <div key={s.id} className="py-1.5 border-b border-slate-800/80 last:border-0 flex justify-between">
                <span>{s.name} ({s.category})</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
