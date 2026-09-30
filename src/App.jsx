import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const DEFAULT_STORES = [
  { id: 'store-1', name: 'Shree Balaji Sweets & Chaat', category: 'Sweets & Snacks', delivery_time: '12-15 min', rating: 4.8 },
  { id: 'store-2', name: 'Kisan Kirana & Daily Dairy', category: 'Kirana & Milk', delivery_time: '15-20 min', rating: 4.9 }
];

const DEFAULT_PRODUCTS = [
  { 
    id: 'p1', 
    store_id: 'store-1', 
    name: 'Desi Ghee Jalebi & Rabri', 
    price: 80, 
    mrp: 110, 
    unit: '250 gm',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
    in_stock: true 
  },
  { 
    id: 'p2', 
    store_id: 'store-1', 
    name: 'Special Aloo Samosa', 
    price: 30, 
    mrp: 40, 
    unit: '2 Pcs with Chutney',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80',
    in_stock: true 
  },
  { 
    id: 'p3', 
    store_id: 'store-1', 
    name: 'Amritsari Chole Bhature', 
    price: 90, 
    mrp: 120, 
    unit: '2 Bhature + Chole',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80',
    in_stock: true 
  },
  { 
    id: 'p4', 
    store_id: 'store-2', 
    name: 'Taaza Cow Milk Pouch', 
    price: 65, 
    mrp: 68, 
    unit: '1 Litre Pouch',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
    in_stock: true 
  },
  { 
    id: 'p5', 
    store_id: 'store-2', 
    name: 'Chakki Fresh Sharbati Atta', 
    price: 210, 
    mrp: 245, 
    unit: '5 kg Bag',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
    in_stock: true 
  },
  { 
    id: 'p6', 
    store_id: 'store-2', 
    name: 'Amul Salted Table Butter', 
    price: 58, 
    mrp: 60, 
    unit: '100 gm Pack',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',
    in_stock: true 
  }
];

// ==========================================
// CONFIGURATION (Yahan apna asli UPI ID daalein)
// ==========================================
const ADMIN_UPI_ID = 'nephka@upi'; // Apna PhonePe / GPay UPI ID yahan daal sakte hain
const STORE_SUPPORT_PHONE = '919999999999';

export default function App() {
  const [currentView, setCurrentView] = useState('customer'); // 'customer', 'dukaan', 'admin', 'rider', 'poster'
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);

  // PWA & Siren State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const sirenAudioRef = useRef(null);
  const [isSirenMuted, setIsSirenMuted] = useState(false);

  // Customer State
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dukaan State
  const [dukaanTab, setDukaanTab] = useState('orders');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Admin Onboarding State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCat, setNewStoreCat] = useState('Kirana & Milk');
  const [newStoreTime, setNewStoreTime] = useState('15-20 min');
  const [newStoreRating, setNewStoreRating] = useState('4.8');

  // ==========================================
  // PRICING & DELIVERY FEE LOGIC
  // ==========================================
  const itemTotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalCartCount = cart.reduce((acc, i) => acc + i.qty, 0);
  const totalSavings = cart.reduce((acc, i) => acc + ((i.mrp || i.price) - i.price) * i.qty, 0);
  
  // Delivery Fee: ₹20 if under ₹149, else FREE (₹0)
  const deliveryFee = itemTotal === 0 || itemTotal >= 149 ? 0 : 20;
  const platformFee = itemTotal > 0 ? 3 : 0;
  const finalTotalAmount = itemTotal + deliveryFee + platformFee;

  const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=NEPHKA&am=${finalTotalAmount}&cu=INR&tn=QuickOrder`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`;
  const websiteQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('https://nephka.com')}`;

  const sendWhatsAppReceipt = (ord) => {
    const mapUrl = ord.lat && ord.lng 
      ? `https://maps.google.com/?q=${ord.lat},${ord.lng}` 
      : `https://maps.google.com/?q=${encodeURIComponent(ord.address)}`;

    const text = 
`⚡ *NEPHKA 15-MIN ORDER RECEIPT* ⚡
━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${ord.customer_name}
📞 *Phone:* ${ord.customer_phone}
📍 *Address:* ${ord.address}

🛒 *ITEMS ORDERED:*
${ord.items.map((i, idx) => `${idx + 1}. ${i.name} x ${i.qty} = ₹${i.price * i.qty}`).join('\n')}

━━━━━━━━━━━━━━━━━━
💵 Items Subtotal: ₹${ord.item_subtotal || ord.total_amount}
🛵 Delivery Fee: ${ord.delivery_fee === 0 ? 'FREE' : '₹' + ord.delivery_fee}
⚙️ Platform Fee: ₹${ord.platform_fee || 0}
💰 *TOTAL BILL:* ₹${ord.total_amount}
💳 *PAYMENT:* ${ord.payment_status} (${ord.payment_method})
🗺️ *MAP PIN:* ${mapUrl}
━━━━━━━━━━━━━━━━━━
*Nephka - 15 Min Local Delivery*`;

    const cleanPhone = ord.customer_phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    sirenAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    sirenAudioRef.current.loop = true;

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    if (p.includes('poster') || h.includes('poster')) setCurrentView('poster');
    else if (p.includes('dukaan') || h.includes('dukaan')) setCurrentView('dukaan');
    else if (p.includes('admin') || h.includes('admin')) setCurrentView('admin');
    else if (p.includes('rider') || h.includes('rider')) setCurrentView('rider');
    else setCurrentView('customer');

    const loadData = async () => {
      try {
        const { data: sData } = await supabase.from('stores').select('*');
        if (sData && sData.length > 0) setStores(sData);

        const { data: pData } = await supabase.from('products').select('*');
        if (pData && pData.length > 0) setProducts(pData);

        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
      } catch (err) {}
    };
    loadData();

    const channel = supabase
      .channel('app_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map((ord) => (ord.id === payload.new.id ? payload.new : ord)));
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      supabase.removeChannel(channel);
      if (sirenAudioRef.current) sirenAudioRef.current.pause();
    };
  }, []);

  const pendingOrdersCount = orders.filter((o) => o.status === 'placed').length;
  useEffect(() => {
    if (currentView === 'dukaan' && pendingOrdersCount > 0 && !isSirenMuted) {
      sirenAudioRef.current?.play().catch(() => {});
    } else {
      sirenAudioRef.current?.pause();
      if (sirenAudioRef.current) sirenAudioRef.current.currentTime = 0;
    }
  }, [currentView, pendingOrdersCount, isSirenMuted]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((r) => {
        if (r.outcome === 'accepted') setShowInstallBanner(false);
        setDeferredPrompt(null);
      });
    } else {
      alert('iPhone / Safari: Share icon (⎋) dabakar "Add to Home Screen" par click karein.');
    }
  };

  const navigateTo = (viewName) => {
    setCurrentView(viewName);
    window.history.pushState({}, '', viewName === 'customer' ? '/' : `/${viewName}`);
    window.scrollTo(0, 0);
  };

  const updateOrderStatus = async (id, status) => {
    try { await supabase.from('orders').update({ status }).eq('id', id); } catch {}
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const toggleStock = async (id, curr) => {
    try { await supabase.from('products').update({ in_stock: !curr }).eq('id', id); } catch {}
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, in_stock: !curr } : p)));
  };

  const detectLiveLocation = () => {
    if (!navigator.geolocation) return alert('GPS support nahi mila.');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setAddress(data?.display_name || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('Location access allow karein.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addToCart = (product) => {
    if (product.in_stock === false) return;
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      return ex ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName || !customerPhone || !address) return alert('Poori details bharein!');

    setIsSubmitting(true);
    const orderObj = {
      id: 'ord_' + Date.now(),
      customer_name: customerName,
      customer_phone: customerPhone,
      address,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      items: cart,
      item_subtotal: itemTotal,
      delivery_fee: deliveryFee,
      platform_fee: platformFee,
      total_amount: finalTotalAmount,
      status: 'placed',
      payment_method: paymentMethod === 'upi' ? 'UPI Online' : 'Cash on Delivery',
      payment_status: paymentMethod === 'upi' ? 'Paid (UPI)' : 'Cash to Collect',
      utr: utrNumber || null,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('orders').insert([orderObj]);
    } catch {}

    setOrders((prev) => [orderObj, ...prev]);
    setActiveOrderId(orderObj.id);
    setIsSubmitting(false);
    setShowCheckout(false);
    setCart([]);
  };

  const handleOnboardStore = async (e) => {
    e.preventDefault();
    if (!newStoreName) return alert('Dukaan ka naam zaroori hai!');
    const newStore = {
      id: 'store_' + Date.now(),
      name: newStoreName,
      category: newStoreCat,
      delivery_time: newStoreTime,
      rating: parseFloat(newStoreRating) || 4.8
    };

    try {
      await supabase.from('stores').insert([newStore]);
    } catch {}

    setStores((prev) => [...prev, newStore]);
    setNewStoreName('');
    alert(`🎉 "${newStore.name}" dukaan live onboard ho gayi!`);
  };

  const currentOrder = orders.find((o) => o.id === activeOrderId);
  const step = currentOrder?.status === 'delivered' ? 4 : currentOrder?.status === 'out_for_delivery' ? 3 : currentOrder?.status === 'accepted' ? 2 : 1;
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-sans select-none">
      
      {/* ======================================================== */}
      {/* VIEW: PRINTABLE DUKAAN COUNTER STANDEE / POSTER          */}
      {/* ======================================================== */}
      {currentView === 'poster' && (
        <div className="min-h-screen bg-white text-slate-900 p-6 max-w-lg mx-auto flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center print:hidden pb-4 border-b">
            <button onClick={() => navigateTo('customer')} className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              ✕ Back to App
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs font-black bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
            >
              🖨️ Print Poster (A4)
            </button>
          </div>

          <div className="my-auto py-6 border-4 border-orange-600 rounded-3xl p-6 w-full shadow-xl bg-gradient-to-b from-orange-50/50 to-white">
            <div className="inline-block bg-orange-600 text-white font-black text-xl px-4 py-1.5 rounded-2xl tracking-wider mb-2">
              NEPHKA
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">
              Ab Dukaan Seedha <br />
              <span className="text-orange-600">Aapke Ghar Pe!</span>
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-1">
              ⚡ 15-20 Min Superfast Local Delivery
            </p>

            <div className="my-5 flex flex-col items-center">
              <div className="p-3 bg-white border-4 border-slate-900 rounded-3xl shadow-lg">
                <img src={websiteQrUrl} alt="Scan to Order" className="w-52 h-52 object-contain" />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-700 mt-2 bg-yellow-300 px-3 py-1 rounded-full">
                📸 Phone Camera Se Scan Karein
              </p>
            </div>

            <div className="space-y-1.5 text-xs font-extrabold text-slate-800">
              <p className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                🍰 Mithai • 🥛 Shuddh Doodh • 🌾 Kirana • 💊 Dawa
              </p>
              <p className="text-emerald-700 font-black">
                ✓ Free Delivery ₹149+ Orders Par!
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500 font-semibold">
              Visit Online: <span className="font-bold text-orange-600 text-xs">nephka.com</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 print:hidden pt-4">
            Tip: A4 size glossy paper par print karke counter ya showcase par lagayein!
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CUSTOMER VIEW                                         */}
      {/* ======================================================== */}
      {currentView === 'customer' && (
        <div>
          {showInstallBanner && (
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
              <div className="flex items-center gap-2">
                <span>📲</span>
                <span>Install NEPHKA App for 1-Tap Access</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleInstallClick} className="bg-white text-orange-600 px-3 py-1 rounded-lg font-black shadow-xs">Install</button>
                <button onClick={() => setShowInstallBanner(false)} className="text-white/80 px-1">✕</button>
              </div>
            </div>
          )}

          <header className="sticky top-0 z-40 bg-white shadow-sm border-b px-4 py-3">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-sm">N</div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black uppercase text-slate-900">Delivery in</span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">⚡ 12 MINS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate max-w-[190px]">
                    {address ? address : 'Tap GPS for 1-Click Address'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={detectLiveLocation} className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition">
                  {isLocating ? '...' : '📍 GPS'}
                </button>
                <button onClick={handleInstallClick} className="text-[11px] bg-orange-50 text-orange-600 border border-orange-200 font-bold px-2 py-1.5 rounded-lg transition">
                  📲 App
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-md mx-auto px-3 pt-3 space-y-3">
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-4 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded-full tracking-wider">Superfast Local</span>
                <h2 className="text-xl font-black mt-1">NEPHKA 15-Min Store</h2>
                <p className="text-xs text-orange-100 font-medium">Shuddh Mithai, Dairy, Dawa & Dukaani Saman</p>
              </div>
              <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 font-black">⚡</div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
              {['All', 'Sweets & Snacks', 'Kirana & Milk', 'Pharmacy', 'Fruits & Vegetables'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
                    activeTab === cat ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {stores
                .filter((st) => activeTab === 'All' || st.category === activeTab)
                .map((store) => (
                  <div key={store.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{store.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">⭐ {store.rating} • {store.category}</p>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        ⏱ {store.delivery_time}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {products
                        .filter((p) => p.store_id === store.id)
                        .map((item) => {
                          const inCart = cart.find((i) => i.id === item.id);
                          const isOutOfStock = item.in_stock === false;

                          return (
                            <div key={item.id} className={`bg-slate-50/60 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between ${isOutOfStock ? 'opacity-40' : ''}`}>
                              <div>
                                <div className="w-full h-28 bg-white rounded-lg overflow-hidden border border-slate-100 mb-2 relative">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                  {item.mrp && item.mrp > item.price && (
                                    <span className="absolute top-1 left-1 bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                                      {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</p>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mt-0.5">{item.name}</h4>
                              </div>

                              <div className="flex justify-between items-center mt-3 pt-1">
                                <div>
                                  <span className="text-xs font-black text-slate-900">₹{item.price}</span>
                                  {item.mrp && (
                                    <span className="text-[10px] text-slate-400 line-through ml-1 font-semibold">₹{item.mrp}</span>
                                  )}
                                </div>

                                {isOutOfStock ? (
                                  <span className="text-[10px] font-bold text-rose-600">Sold Out</span>
                                ) : inCart ? (
                                  <div className="flex items-center gap-2 bg-emerald-700 text-white font-black text-xs px-2 py-1 rounded-lg">
                                    <button onClick={() => removeFromCart(item.id)} className="px-1 text-emerald-200">-</button>
                                    <span>{inCart.qty}</span>
                                    <button onClick={() => addToCart(item)} className="px-1 text-emerald-200">+</button>
                                  </div>
                                ) : (
                                  <button onClick={() => addToCart(item)} className="bg-white border-2 border-emerald-600 text-emerald-700 text-xs font-black px-3 py-1 rounded-lg shadow-sm uppercase">
                                    ADD
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>

            <footer className="text-center pt-8 pb-4 space-y-2">
              <p className="text-[11px] text-slate-400 font-semibold">NEPHKA Hyperlocal Superfast Platform</p>
              <div className="flex justify-center gap-3 text-[11px] text-slate-400 font-medium">
                <button onClick={() => navigateTo('dukaan')} className="hover:underline">🏪 Dukaan Partner</button>
                <span>•</span>
                <button onClick={() => navigateTo('rider')} className="hover:underline">🛵 Rider Panel</button>
                <span>•</span>
                <button onClick={() => navigateTo('admin')} className="hover:underline">👑 Master Admin</button>
                <span>•</span>
                <button onClick={() => navigateTo('poster')} className="hover:underline text-orange-500 font-bold">🖨️ QR Poster</button>
              </div>
            </footer>
          </main>

          {/* Floating Cart Bar */}
          {cart.length > 0 && !showCheckout && (
            <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
              <div onClick={() => setShowCheckout(true)} className="max-w-md mx-auto bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-emerald-500">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-800 text-white font-black text-xs px-2.5 py-1.5 rounded-xl">🛒 {totalCartCount} ITEMS</div>
                  <div>
                    <p className="text-sm font-black leading-tight">₹{finalTotalAmount}</p>
                    <p className="text-[10px] text-emerald-200 font-bold">
                      {deliveryFee === 0 ? '✓ Free Delivery Unlocked' : 'Add ₹' + (149 - itemTotal) + ' for Free Delivery'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-black text-xs bg-emerald-800/80 px-3 py-1.5 rounded-xl">
                  <span>View Bill ➔</span>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Slide-Up with Delivery & Platform Fee Breakdown */}
          {showCheckout && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-black text-base text-slate-800">Bill Breakdown & Checkout</h3>
                    <p className="text-xs text-slate-500 font-semibold">{totalCartCount} Items</p>
                  </div>
                  <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center">✕</button>
                </div>

                {/* Detailed Bill Summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-2 text-xs">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-700 font-medium">
                      <span>{item.name} x {item.qty}</span>
                      <span className="font-bold">₹{item.price * item.qty}</span>
                    </div>
                  ))}

                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Item Subtotal:</span>
                      <span className="font-bold">₹{itemTotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Partner Fee:</span>
                      <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600 font-black' : ''}`}>
                        {deliveryFee === 0 ? 'FREE (Orders ₹149+)' : '₹20'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Handling Fee:</span>
                      <span className="font-bold">₹{platformFee}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-black text-sm text-slate-900">
                    <span>Grand Total Payable</span>
                    <span className="text-emerald-700">₹{finalTotalAmount}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
                  <input type="text" placeholder="Aapka Naam" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-medium" />
                  <input type="tel" placeholder="Mobile Number (WhatsApp)" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-medium" />
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-700">Delivery Address:</label>
                      <button type="button" onClick={detectLiveLocation} className="text-[11px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        {isLocating ? 'GPS...' : '📍 Use Current Location'}
                      </button>
                    </div>
                    <textarea rows={2} required placeholder="Ghar / Flat / Gali No." value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" onClick={() => setPaymentMethod('cod')} className={`py-2.5 rounded-xl border font-bold ${paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600'}`}>💵 Cash on Delivery</button>
                    <button type="button" onClick={() => setPaymentMethod('upi')} className={`py-2.5 rounded-xl border font-bold ${paymentMethod === 'upi' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>⚡ UPI / GPay</button>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-2">
                      <p className="text-xs font-black text-emerald-800">Scan & Pay ₹{finalTotalAmount}</p>
                      <img src={qrCodeUrl} alt="QR" className="w-32 h-32 mx-auto border rounded-xl" />
                      <a href={upiUrl} className="block w-full py-2 bg-emerald-600 text-white font-black rounded-xl text-xs">📱 GPay / PhonePe App</a>
                      <input type="text" placeholder="UTR Number (Optional)" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full p-2 rounded-lg border bg-white text-center text-xs" />
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm shadow-lg transition">
                    {isSubmitting ? 'Placing...' : `Confirm Order • ₹${finalTotalAmount}`}
                  </button>
                </form>
              </div>
            </div>
          )}

          {currentOrder && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl p-4 max-w-md mx-auto rounded-t-3xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">⚡ Live Status</span>
                  <h3 className="font-black text-base text-slate-900 mt-0.5">
                    {step === 4 ? '🎉 Delivered!' : 'Arriving in 14 Mins'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => sendWhatsAppReceipt(currentOrder)} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                    💬 Bill Slip
                  </button>
                  <button onClick={() => setActiveOrderId(null)} className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-lg">✕</button>
                </div>
              </div>

              <div className="space-y-2 py-1">
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-black">
                  <span className={step >= 1 ? 'text-emerald-600' : 'text-slate-400'}>Placed</span>
                  <span className={step >= 2 ? 'text-emerald-600' : 'text-slate-400'}>Packing</span>
                  <span className={step >= 3 ? 'text-emerald-600' : 'text-slate-400'}>On Way</span>
                  <span className={step >= 4 ? 'text-emerald-600' : 'text-slate-400'}>Delivered</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div className={`h-full bg-emerald-500 transition-all duration-700 ${
                    step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
                  }`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-bold">
                <a href={`tel:${STORE_SUPPORT_PHONE}`} className="py-2.5 bg-slate-100 text-slate-800 rounded-xl text-center">📞 Store</a>
                <a href={`tel:${STORE_SUPPORT_PHONE}`} className="py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-center">🛵 Rider</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DUKAAN VIEW WITH CONTINUOUS SIREN & WHATSAPP          */}
      {/* ======================================================== */}
      {currentView === 'dukaan' && (
        <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto">
          {pendingOrdersCount > 0 && (
            <div className="bg-rose-600 text-white p-3 rounded-2xl mb-3 flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <p className="font-black text-xs uppercase tracking-wider">{pendingOrdersCount} NEW ORDER WAITING!</p>
                  <p className="text-[10px] text-rose-100">Siren is ringing continuously</p>
                </div>
              </div>
              <button
                onClick={() => setIsSirenMuted(!isSirenMuted)}
                className="bg-white text-rose-700 text-xs font-black px-3 py-1 rounded-xl shadow-xs"
              >
                {isSirenMuted ? '🔊 Unmute' : '🔇 Mute Siren'}
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h1 className="text-xl font-black text-orange-500">🏪 DUKAAN PARTNER</h1>
              <p className="text-xs text-slate-400">Live Orders & Stock Control</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigateTo('poster')} className="text-xs bg-orange-600 text-white font-bold px-2.5 py-1.5 rounded-lg">
                🖨️ QR Poster
              </button>
              <button onClick={() => navigateTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700">
                Exit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1 my-3">
            <button onClick={() => setDukaanTab('orders')} className={`py-2 rounded-lg ${dukaanTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
              Orders ({orders.filter((o) => o.status !== 'delivered').length})
            </button>
            <button onClick={() => setDukaanTab('menu')} className={`py-2 rounded-lg ${dukaanTab === 'menu' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
              Manage Menu
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
                    <div className="font-bold text-white pt-1">
                      Total: ₹{ord.total_amount} ({ord.payment_status})
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => sendWhatsAppReceipt(ord)}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1"
                    >
                      💬 WhatsApp Slip
                    </button>
                    {ord.status === 'placed' && (
                      <button onClick={() => updateOrderStatus(ord.id, 'accepted')} className="py-2 bg-orange-600 hover:bg-orange-700 font-bold rounded-lg text-white">
                        ✓ Accept Order
                      </button>
                    )}
                    {ord.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')} className="py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-white">
                        📦 Send to Rider
                      </button>
                    )}
                    {ord.status === 'out_for_delivery' && (
                      <span className="py-2 bg-slate-700 text-slate-300 font-bold rounded-lg text-center">
                        🛵 Out with Rider
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dukaanTab === 'menu' && (
            <div className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newItemName || !newItemPrice) return;
                const item = { id: 'p_' + Date.now(), store_id: stores[0]?.id || 'store-1', name: newItemName, price: Number(newItemPrice), unit: 'Standard Pack', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', in_stock: true };
                try { await supabase.from('products').insert([item]); } catch {}
                setProducts((prev) => [item, ...prev]);
                setNewItemName('');
                setNewItemPrice('');
                alert('Item Add Ho Gaya!');
              }} className="bg-slate-800 p-3 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-slate-300">➕ Add Item</p>
                <input type="text" placeholder="Item Name" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white" />
                <input type="number" placeholder="Price (₹)" required value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white" />
                <button type="submit" className="w-full py-2 bg-orange-600 font-bold rounded">Save Item</button>
              </form>

              <div className="space-y-2">
                {products.map((item) => (
                  <div key={item.id} className="bg-slate-800 p-2.5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-orange-400 font-bold">₹{item.price}</p>
                    </div>
                    <button onClick={() => toggleStock(item.id, item.in_stock)} className={`px-2.5 py-1 rounded font-bold ${item.in_stock !== false ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {item.in_stock !== false ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MASTER ADMIN VIEW                                     */}
      {/* ======================================================== */}
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-xl font-black text-amber-500">👑 MASTER ADMIN</h1>
              <p className="text-xs text-slate-400">Total Business & Store Control</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigateTo('poster')} className="text-xs bg-orange-600 text-white font-bold px-2.5 py-1.5 rounded-lg">
                🖨️ QR Poster
              </button>
              <button onClick={() => navigateTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700">
                Exit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <p className="text-[11px] text-slate-400">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">₹{totalRevenue}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <p className="text-[11px] text-slate-400">Total Orders</p>
              <p className="text-2xl font-black text-orange-400 mt-1">{orders.length}</p>
            </div>
          </div>

          {/* STORE ONBOARDING FORM */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xs uppercase tracking-wider text-amber-400">➕ Onboard New Local Store</h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">{stores.length} Live</span>
            </div>

            <form onSubmit={handleOnboardStore} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Dukaan Ka Naam:</label>
                <input
                  type="text"
                  placeholder="e.g. Haryana Medicos / Gupta Fal Bhandar"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Category:</label>
                  <select
                    value={newStoreCat}
                    onChange={(e) => setNewStoreCat(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value="Kirana & Milk">Kirana & Milk</option>
                    <option value="Sweets & Snacks">Sweets & Snacks</option>
                    <option value="Pharmacy">Pharmacy / Dawa</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Bakery & Cakes">Bakery & Cakes</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Delivery Time:</label>
                  <input
                    type="text"
                    placeholder="15-20 min"
                    value={newStoreTime}
                    onChange={(e) => setNewStoreTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
              >
                Onboard Store (Make Live)
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">Live Active Stores</h3>
            {stores.map((s) => (
              <div key={s.id} className="flex justify-between items-center py-1.5 border-b border-slate-800/80 last:border-0">
                <div>
                  <p className="font-bold text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-400">{s.category} • {s.delivery_time}</p>
                </div>
                <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. RIDER VIEW                                            */}
      {/* ======================================================== */}
      {currentView === 'rider' && (
        <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-xl font-black text-emerald-400">🛵 RIDER PARTNER</h1>
              <p className="text-xs text-slate-400">Live Delivery Fleet</p>
            </div>
            <button onClick={() => navigateTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700">
              Customer App ➔
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {orders.filter((o) => o.status !== 'delivered').length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Sabhi delivery complete hain!</p>
            ) : (
              orders.filter((o) => o.status !== 'delivered').map((ord) => {
                const mapLink = ord.lat && ord.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${ord.lat},${ord.lng}`
                  : `https://maps.google.com/?q=${encodeURIComponent(ord.address)}`;
                return (
                  <div key={ord.id} className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{ord.customer_name}</h4>
                        <p className="text-slate-400">📞 {ord.customer_phone}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-400 uppercase">{ord.status}</span>
                    </div>
                    <p className="text-slate-300">📍 {ord.address}</p>
                    <div className="p-2 rounded bg-slate-900 font-bold text-amber-300">
                      {ord.payment_method?.includes('UPI') ? '✅ ONLINE PAID (₹0 Collect)' : `💵 CASH TO COLLECT: ₹${ord.total_amount}`}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <a href={mapLink} target="_blank" rel="noreferrer" className="py-2 bg-blue-600 font-bold text-center rounded text-white flex items-center justify-center">
                        📍 Map
                      </a>
                      <button onClick={() => sendWhatsAppReceipt(ord)} className="py-2 bg-emerald-600 font-bold rounded text-white flex items-center justify-center">
                        💬 WhatsApp
                      </button>
                      <button onClick={() => updateOrderStatus(ord.id, 'delivered')} className="py-2 bg-emerald-500 font-bold rounded text-white flex items-center justify-center">
                        ✅ Deliver
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
