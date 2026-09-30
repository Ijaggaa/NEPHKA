import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

// ==========================================
// 1. CLEAN VERIFIED INVENTORY (REAL IMAGES)
// ==========================================
const DEFAULT_STORES = [
  { id: 'store-1', name: 'Shree Balaji Sweets & Chaat', category: 'Sweets & Snacks', delivery_time: '12-15 min', rating: 4.8 },
  { id: 'store-2', name: 'Kisan Kirana & Daily Dairy', category: 'Kirana & Milk', delivery_time: '15-20 min', rating: 4.9 },
  { id: 'store-3', name: 'Haryana Medicos & Health', category: 'Pharmacy', delivery_time: '10-15 min', rating: 4.9 },
  { id: 'store-4', name: 'Kisan Taaza Sabzi Mandi', category: 'Vegetables & Fruits', delivery_time: '12-18 min', rating: 4.7 }
];

const DEFAULT_PRODUCTS = [
  { id: 'p1', store_id: 'store-1', name: 'Desi Ghee Jalebi', price: 80, mrp: 110, unit: '250 gm', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p2', store_id: 'store-1', name: 'Special Aloo Samosa (2 Pcs)', price: 30, mrp: 40, unit: '2 Pcs with Chutney', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p3', store_id: 'store-1', name: 'Shahi Mawa Gulab Jamun', price: 70, mrp: 90, unit: '4 Pcs Box', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p4', store_id: 'store-2', name: 'Fresh Cow Milk Pouch', price: 65, mrp: 68, unit: '1 Litre', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p5', store_id: 'store-2', name: 'Chakki Fresh Sharbati Atta', price: 210, mrp: 245, unit: '5 kg Bag', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p6', store_id: 'store-2', name: 'Amul Salted Butter', price: 58, mrp: 60, unit: '100 gm Pack', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p7', store_id: 'store-3', name: 'Dolo 650mg Tablets', price: 32, mrp: 35, unit: '15 Tablets Strip', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p8', store_id: 'store-4', name: 'Desi Pahadi Aloo', price: 35, mrp: 45, unit: '1 kg Taaza', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80', in_stock: true }
];

// Clean Audio Engine
const playCleanLaunchAudio = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Whoosh
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.frequency.setValueAtTime(380, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
    g1.gain.setValueAtTime(0.2, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.start(); osc1.stop(ctx.currentTime + 0.6);

    // Impact Thud at 2s
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(140, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      g2.gain.setValueAtTime(0.6, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.connect(g2); g2.connect(ctx.destination);
      osc2.start(); osc2.stop(ctx.currentTime + 0.3);
    }, 2000);
  } catch {}
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nephka_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [authRole, setAuthRole] = useState('customer');
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAadhaar, setAuthAadhaar] = useState('');
  const [authPan, setAuthPan] = useState('');
  const [authCategory, setAuthCategory] = useState('Kirana & Milk');

  const [currentView, setCurrentView] = useState('customer');
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Checkout & Recipient
  const [showCheckout, setShowCheckout] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Animation State
  const [isLaunching, setIsLaunching] = useState(false);
  const [targetStore, setTargetStore] = useState(null);

  // Billing
  const itemTotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
  const deliveryFee = itemTotal === 0 || itemTotal >= 149 ? 0 : 20;
  const platformFee = itemTotal > 0 ? 3 : 0;
  const grandTotal = itemTotal + deliveryFee + platformFee;

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const { data: s } = await supabase.from('stores').select('*');
        if (s?.length) setStores(s);
        const { data: p } = await supabase.from('products').select('*');
        if (p?.length) setProducts(p);
        const { data: o } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (o?.length) setOrders(o);
      } catch {}
    };
    fetchLive();
  }, []);

  const handleOpenCheckout = () => {
    if (!receiverName && currentUser?.name) setReceiverName(currentUser.name);
    if (!receiverPhone && currentUser?.phone) setReceiverPhone(currentUser.phone);
    setShowCheckout(true);
  };

  const addToCart = (product) => {
    if (cart.length > 0 && cart[0].store_id !== product.store_id) {
      const curStore = stores.find(s => s.id === cart[0].store_id)?.name || 'Previous Store';
      const newStore = stores.find(s => s.id === product.store_id)?.name || 'New Store';
      if (window.confirm(`Cart contains items from ${curStore}. Reset cart to order from ${newStore}?`)) {
        setCart([{ ...product, qty: 1 }]);
      }
      return;
    }
    setCart((prev) => {
      const ex = prev.find(i => i.id === product.id);
      return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('GPS unavailable');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const d = await res.json();
          setDeliveryAddress(d?.display_name || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setDeliveryAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setIsLocating(false);
      },
      () => { setIsLocating(false); alert('Please enable location access.'); }
    );
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!receiverName || !receiverPhone || !deliveryAddress) return alert('Please enter delivery details.');

    const destStore = stores.find(s => s.id === cart[0]?.store_id) || stores[0];
    setTargetStore(destStore);

    const newOrder = {
      id: 'ord_' + Date.now(),
      store_id: destStore.id,
      customer_name: receiverName,
      customer_phone: receiverPhone,
      ordered_by: currentUser?.name || receiverName,
      address: deliveryAddress,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      items: cart,
      item_subtotal: itemTotal,
      delivery_fee: deliveryFee,
      platform_fee: platformFee,
      total_amount: grandTotal,
      status: 'placed',
      payment_method: paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery',
      payment_status: paymentMethod === 'upi' ? 'Paid' : 'Cash to Collect',
      created_at: new Date().toISOString()
    };

    try { await supabase.from('orders').insert([newOrder]); } catch {}

    setShowCheckout(false);
    setIsLaunching(true);
    playCleanLaunchAudio();

    setTimeout(() => {
      setOrders(prev => [newOrder, ...prev]);
      setActiveOrderId(newOrder.id);
      setIsLaunching(false);
      setCart([]);
    }, 2400);
  };

  // Clean Login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4 font-sans antialiased text-zinc-900">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-zinc-100 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-xl shadow-sm">
              N
            </div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 mt-2">NEPHKA</h1>
            <p className="text-xs font-semibold text-zinc-400">15-Minute Local Delivery</p>
          </div>

          <div className="grid grid-cols-2 bg-zinc-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setAuthRole('customer')}
              className={`py-2 rounded-xl transition ${authRole === 'customer' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Customer
            </button>
            <button
              onClick={() => setAuthRole('dukaan')}
              className={`py-2 rounded-xl transition ${authRole === 'dukaan' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Store Partner
            </button>
          </div>

          {authRole === 'customer' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!authName || !authPhone) return alert('Enter name and phone');
              const u = { role: 'customer', name: authName.trim(), phone: authPhone.trim() };
              localStorage.setItem('nephka_user', JSON.stringify(u));
              setCurrentUser(u);
            }} className="space-y-3 text-xs font-medium">
              <div>
                <label className="text-zinc-600 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 outline-none focus:border-emerald-600 transition"
                />
              </div>
              <div>
                <label className="text-zinc-600 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit number"
                  value={authPhone}
                  onChange={e => setAuthPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 outline-none focus:border-emerald-600 transition"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition">
                Continue to Store ➔
              </button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!authName || !authPhone) return alert('Enter full store details');
              const u = { role: 'dukaan', name: authName, phone: authPhone, storeId: 'store-1' };
              localStorage.setItem('nephka_user', JSON.stringify(u));
              setCurrentUser(u);
              setCurrentView('dukaan');
            }} className="space-y-2.5 text-xs font-medium">
              <div>
                <label className="text-zinc-600 block mb-1">Store Name</label>
                <input type="text" required placeholder="e.g. Balaji Sweets" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full p-2.5 rounded-xl border border-zinc-200 outline-none" />
              </div>
              <div>
                <label className="text-zinc-600 block mb-1">Owner Mobile</label>
                <input type="tel" required maxLength={10} placeholder="Phone Number" value={authPhone} onChange={e => setAuthPhone(e.target.value)} className="w-full p-2.5 rounded-xl border border-zinc-200 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-600 block mb-1">Aadhaar (12-Digit)</label>
                  <input type="text" maxLength={12} placeholder="•••• •••• ••••" value={authAadhaar} onChange={e => setAuthAadhaar(e.target.value)} className="w-full p-2 rounded-xl border border-zinc-200 outline-none" />
                </div>
                <div>
                  <label className="text-zinc-600 block mb-1">PAN Card</label>
                  <input type="text" maxLength={10} placeholder="ABCDE1234F" value={authPan} onChange={e => setAuthPan(e.target.value.toUpperCase())} className="w-full p-2 rounded-xl border border-zinc-200 outline-none uppercase" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl shadow-sm transition">
                Register Store Dashboard ➔
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Active View
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-zinc-900 font-sans antialiased pb-24">
      
      {/* 2-SECOND SLEEK ARROW ANIMATION */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
          <style>{`
            @keyframes flyArrow {
              0% { left: 10%; transform: translateY(-50%) scale(0.9); opacity: 1; }
              85% { left: 80%; transform: translateY(-50%) scale(1.1); opacity: 1; filter: drop-shadow(0 0 12px #10b981); }
              90% { left: 85%; transform: translateY(-50%) scale(1); }
              100% { left: 85%; transform: translateY(-50%) scale(1); }
            }
            @keyframes hitTarget {
              0%, 82% { transform: translateY(-50%) scale(1); }
              86% { transform: translateY(-50%) scale(1.3) rotate(-10deg); filter: brightness(1.6); }
              92% { transform: translateY(-50%) scale(0.95) rotate(4deg); }
              100% { transform: translateY(-50%) scale(1); }
            }
            .anim-flight { animation: flyArrow 2s cubic-bezier(0.25, 0.9, 0.3, 1) forwards; }
            .anim-target { animation: hitTarget 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          `}</style>
          
          <p className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 mb-1">Express Launch</p>
          <h2 className="text-2xl font-black tracking-tight">Order Fired to Store</h2>
          <p className="text-xs text-zinc-400 mt-1">Directing to: <span className="text-white font-bold">{targetStore?.name}</span></p>

          <div className="relative w-full max-w-sm h-36 bg-zinc-900/90 rounded-3xl border border-zinc-800 my-6 overflow-hidden">
            {/* Bow */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🏹</div>
            {/* Flying Arrow */}
            <div className="absolute top-1/2 anim-flight -translate-y-1/2 flex items-center pointer-events-none">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-emerald-400 -mr-1" />
              <span className="text-lg">➔</span>
            </div>
            {/* Target */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 anim-target text-3xl">🎯</div>
          </div>
        </div>
      )}

      {/* TOP MINIMALIST HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-sm tracking-tight">NEPHKA</span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">15 MINS</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[170px] mt-0.5">
                {currentUser?.name ? `Hi, ${currentUser.name}` : 'Local Express'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('nephka_user');
              setCurrentUser(null);
            }}
            className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* CUSTOMER MAIN FEED */}
      {currentView === 'customer' && (
        <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
          
          {/* Minimal Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
            {['All', 'Sweets & Snacks', 'Kirana & Milk', 'Pharmacy', 'Vegetables & Fruits'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition ${
                  activeCategory === cat ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200/70 text-zinc-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Clean 2-Column Product Cards */}
          <div className="space-y-4">
            {stores
              .filter(st => activeCategory === 'All' || st.category === activeCategory)
              .map(store => {
                const prods = products.filter(p => p.store_id === store.id);
                if (!prods.length) return null;
                return (
                  <div key={store.id} className="bg-white rounded-2xl p-3.5 border border-zinc-200/60 shadow-sm space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900">{store.name}</h3>
                        <p className="text-[11px] text-zinc-400">{store.category} • ⭐ {store.rating}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {store.delivery_time}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {prods.map(item => {
                        const inCart = cart.find(i => i.id === item.id);
                        return (
                          <div key={item.id} className="bg-[#FAFBFB] rounded-xl p-2.5 border border-zinc-100 flex flex-col justify-between">
                            <div>
                              <div className="w-full h-28 bg-white rounded-lg overflow-hidden mb-2 relative">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                {item.mrp > item.price && (
                                  <span className="absolute top-1 left-1 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 font-medium">{item.unit}</p>
                              <h4 className="text-xs font-semibold text-zinc-800 line-clamp-1 mt-0.5">{item.name}</h4>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-1">
                              <span className="text-xs font-black text-zinc-900">₹{item.price}</span>
                              {inCart ? (
                                <div className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs px-2 py-1 rounded-lg">
                                  <button onClick={() => removeFromCart(item.id)} className="px-1">-</button>
                                  <span>{inCart.qty}</span>
                                  <button onClick={() => addToCart(item)} className="px-1">+</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold px-3 py-1 rounded-lg transition"
                                >
                                  ADD
                                </button>
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

          {/* FLOATING CART BAR */}
          {cart.length > 0 && !showCheckout && (
            <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
              <div
                onClick={handleOpenCheckout}
                className="max-w-md mx-auto bg-emerald-600 text-white p-3 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div>
                  <p className="text-xs font-extrabold leading-none">{totalQty} ITEMS • ₹{grandTotal}</p>
                  <p className="text-[10px] text-emerald-100 mt-1 font-medium">
                    {deliveryFee === 0 ? '✓ Free Delivery Applied' : 'Add more for Free Delivery'}
                  </p>
                </div>
                <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">View Bill ➔</span>
              </div>
            </div>
          )}

          {/* CLEAN CHECKOUT DRAWER */}
          {showCheckout && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center">
              <div className="bg-white rounded-t-3xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                  <h3 className="font-bold text-base text-zinc-900">Order Summary</h3>
                  <button onClick={() => setShowCheckout(false)} className="text-zinc-400 font-bold p-1">✕</button>
                </div>

                {/* Recipient Details */}
                <div className="bg-zinc-50 p-3.5 rounded-2xl space-y-2 border border-zinc-100 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-700">Delivery Recipient</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiverName('');
                        setReceiverPhone('');
                      }}
                      className="text-[10px] font-semibold text-emerald-600 underline"
                    >
                      Change Receiver
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Receiver Name"
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 bg-white font-medium"
                    />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="Calling Number"
                      value={receiverPhone}
                      onChange={e => setReceiverPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-zinc-700">Address</label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"
                    >
                      {isLocating ? 'Locating...' : '📍 Auto GPS'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="House / Flat / Landmark"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 outline-none font-medium"
                  />
                </div>

                {/* Bill Breakdown */}
                <div className="bg-zinc-50 p-3 rounded-xl space-y-1.5 text-xs text-zinc-600 border border-zinc-100">
                  <div className="flex justify-between"><span>Items Total</span><span className="font-bold text-zinc-900">₹{itemTotal}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span className="font-bold text-zinc-900">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
                  <div className="flex justify-between"><span>Platform Fee</span><span className="font-bold text-zinc-900">₹{platformFee}</span></div>
                  <div className="border-t border-zinc-200 pt-1.5 flex justify-between font-black text-sm text-zinc-900">
                    <span>To Pay</span><span className="text-emerald-700">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Payment & Submit */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button type="button" onClick={() => setPaymentMethod('cod')} className={`p-2.5 rounded-xl border ${paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'bg-zinc-50 text-zinc-600'}`}>💵 Cash on Delivery</button>
                  <button type="button" onClick={() => setPaymentMethod('upi')} className={`p-2.5 rounded-xl border ${paymentMethod === 'upi' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'bg-zinc-50 text-zinc-600'}`}>⚡ UPI Online</button>
                </div>

                <button
                  onClick={submitOrder}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm text-sm active:scale-98 transition"
                >
                  Confirm & Shoot Order • ₹{grandTotal}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE ORDER TRACKING BAR */}
          {activeOrderId && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 p-4 max-w-md mx-auto shadow-2xl rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Order Placed</span>
                  <h4 className="text-sm font-black text-zinc-900 mt-1">Arriving in 15 Minutes</h4>
                </div>
                <button onClick={() => setActiveOrderId(null)} className="text-xs text-zinc-400 font-bold p-1">Close</button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* DUKAAN PANEL */}
      {currentView === 'dukaan' && (
        <div className="max-w-md mx-auto p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">🏪 Store Partner Dashboard</h2>
              <p className="text-xs text-zinc-400">{currentUser?.name}</p>
            </div>
            <button onClick={() => setCurrentView('customer')} className="text-xs font-semibold text-emerald-600">
              Customer App ➔
            </button>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-8">No live orders at this moment.</p>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-sm text-xs space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Deliver to: {o.customer_name}</span>
                    <span className="text-emerald-600 uppercase">{o.status}</span>
                  </div>
                  <p className="text-zinc-500">📞 {o.customer_phone}</p>
                  <p className="text-zinc-500">📍 {o.address}</p>
                  <p className="font-bold text-zinc-900 pt-1">Total: ₹{o.total_amount} ({o.payment_method})</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
