import React, { useState, useEffect } from 'react';
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

const ADMIN_UPI_ID = 'nephka@upi';

export default function App() {
  // Navigation Routing without third-party crashes
  const [currentView, setCurrentView] = useState('customer'); // 'customer', 'dukaan', 'admin', 'rider'
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);

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

  // Initial URL check (nephka.com/dukaan, nephka.com/admin, nephka.com/rider)
  useEffect(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    if (p.includes('dukaan') || h.includes('dukaan')) setCurrentView('dukaan');
    else if (p.includes('admin') || h.includes('admin')) setCurrentView('admin');
    else if (p.includes('rider') || h.includes('rider')) setCurrentView('rider');
    else setCurrentView('customer');

    const loadData = async () => {
      try {
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
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Location Detector
  const detectLiveLocation = () => {
    if (!navigator.geolocation) return alert('GPS browser mein support nahi karta.');
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
        alert('Location access enable karein.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cart logic
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

  const totalCartCount = cart.reduce((acc, i) => acc + i.qty, 0);
  const totalCartAmount = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalSavings = cart.reduce((acc, i) => acc + ((i.mrp || i.price) - i.price) * i.qty, 0);

  const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=NEPHKA&am=${totalCartAmount}&cu=INR&tn=QuickOrder`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`;

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
      total_amount: totalCartAmount,
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

  const currentOrder = orders.find((o) => o.id === activeOrderId);
  const step = currentOrder?.status === 'delivered' ? 4 : currentOrder?.status === 'out_for_delivery' ? 3 : currentOrder?.status === 'accepted' ? 2 : 1;

  // Total Business analytics for Admin
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-sans select-none">
      
      {/* ======================================================== */}
      {/* 1. VIEW: PURE BLINKIT CUSTOMER APP                       */}
      {/* ======================================================== */}
      {currentView === 'customer' && (
        <div>
          {/* Top Quick Bar */}
          <header className="sticky top-0 z-40 bg-white shadow-sm border-b px-4 py-3">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  N
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black uppercase text-slate-900">Delivery in</span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">⚡ 12 MINS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                    {address ? address : 'Tap GPS for 1-Click Address'}
                  </p>
                </div>
              </div>
              <button
                onClick={detectLiveLocation}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                {isLocating ? '...' : '📍 GPS'}
              </button>
            </div>
          </header>

          <main className="max-w-md mx-auto px-3 pt-3 space-y-3">
            {/* Promo Card */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-4 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded-full tracking-wider">Superfast Local</span>
                <h2 className="text-xl font-black mt-1">NEPHKA 15-Min Store</h2>
                <p className="text-xs text-orange-100 font-medium">Shuddh Mithai, Dairy & Dukaani Saman</p>
              </div>
              <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 font-black">⚡</div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
              {['All', 'Sweets & Snacks', 'Kirana & Milk'].map((cat) => (
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

            {/* Product Cards with Images & MRP */}
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
                            <div
                              key={item.id}
                              className={`bg-slate-50/60 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between ${
                                isOutOfStock ? 'opacity-40' : ''
                              }`}
                            >
                              <div>
                                <div className="w-full h-28 bg-white rounded-lg overflow-hidden border border-slate-100 mb-2 relative">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  {item.mrp && item.mrp > item.price && (
                                    <span className="absolute top-1 left-1 bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                                      {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                    </span>
                                  )}
                                </div>

                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</p>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mt-0.5">
                                  {item.name}
                                </h4>
                              </div>

                              <div className="flex justify-between items-center mt-3 pt-1">
                                <div>
                                  <span className="text-xs font-black text-slate-900">₹{item.price}</span>
                                  {item.mrp && (
                                    <span className="text-[10px] text-slate-400 line-through ml-1 font-semibold">
                                      ₹{item.mrp}
                                    </span>
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
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="bg-white border-2 border-emerald-600 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-black px-3 py-1 rounded-lg shadow-sm transition uppercase"
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
                ))}
            </div>

            {/* Subtle Footer for Staff / Dukaan / Admin / Rider navigation */}
            <footer className="text-center pt-8 pb-4 space-y-2">
              <p className="text-[11px] text-slate-400 font-semibold">NEPHKA Hyperlocal Superfast Platform</p>
              <div className="flex justify-center gap-3 text-[11px] text-slate-400 font-medium">
                <button onClick={() => navigateTo('dukaan')} className="hover:underline">🏪 Dukaan Partner</button>
                <span>•</span>
                <button onClick={() => navigateTo('rider')} className="hover:underline">🛵 Rider Panel</button>
                <span>•</span>
                <button onClick={() => navigateTo('admin')} className="hover:underline">👑 Master Admin</button>
              </div>
            </footer>
          </main>

          {/* Floating Cart Bar (Blinkit Style) */}
          {cart.length > 0 && !showCheckout && (
            <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
              <div
                onClick={() => setShowCheckout(true)}
                className="max-w-md mx-auto bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-emerald-500 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-800 text-white font-black text-xs px-2.5 py-1.5 rounded-xl">
                    🛒 {totalCartCount} ITEMS
                  </div>
                  <div>
                    <p className="text-sm font-black leading-tight">₹{totalCartAmount}</p>
                    {totalSavings > 0 && (
                      <p className="text-[10px] text-emerald-200 font-bold">Saved ₹{totalSavings}!</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 font-black text-xs bg-emerald-800/80 px-3 py-1.5 rounded-xl">
                  <span>View Cart</span>
                  <span>➔</span>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Slide-Up */}
          {showCheckout && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-black text-base text-slate-800">Checkout Bill</h3>
                    <p className="text-xs text-slate-500 font-semibold">{totalCartCount} Items • ₹{totalCartAmount}</p>
                  </div>
                  <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center">
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border space-y-1.5 text-xs">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-700 font-medium">
                      <span>{item.name} x {item.qty}</span>
                      <span className="font-bold">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-black text-sm text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-emerald-700">₹{totalCartAmount}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
                  <input type="text" placeholder="Aapka Naam" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-medium" />
                  <input type="tel" placeholder="Mobile Number" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-2.5 rounded-xl border outline-none font-medium" />
                  
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
                      <p className="text-xs font-black text-emerald-800">Scan & Pay ₹{totalCartAmount}</p>
                      <img src={qrCodeUrl} alt="QR" className="w-32 h-32 mx-auto border rounded-xl" />
                      <a href={upiUrl} className="block w-full py-2 bg-emerald-600 text-white font-black rounded-xl text-xs">📱 GPay / PhonePe App</a>
                      <input type="text" placeholder="UTR Number (Optional)" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full p-2 rounded-lg border bg-white text-center text-xs" />
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm shadow-lg transition">
                    {isSubmitting ? 'Placing...' : `Confirm Order • ₹${totalCartAmount}`}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Live Order Tracking Bar (Blinkit Style) */}
          {currentOrder && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl p-4 max-w-md mx-auto rounded-t-3xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ⚡ Live Status
                  </span>
                  <h3 className="font-black text-base text-slate-900 mt-0.5">
                    {step === 4 ? '🎉 Delivered!' : 'Arriving in 14 Mins'}
                  </h3>
                </div>
                <button onClick={() => setActiveOrderId(null)} className="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-lg">
                  Close
                </button>
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
                <a href="tel:9999999999" className="py-2.5 bg-slate-100 text-slate-800 rounded-xl text-center">📞 Store</a>
                <a href="tel:9999999999" className="py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-center">🛵 Rider</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VIEW: DUKAAN DASHBOARD                                */}
      {/* ======================================================== */}
      {currentView === 'dukaan' && (
        <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h1 className="text-xl font-black text-orange-500">🏪 DUKAAN PARTNER</h1>
              <p className="text-xs text-slate-400">Live Orders & Stock Control</p>
            </div>
            <button onClick={() => navigateTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700">
              Customer App ➔
            </button>
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
                    <div className="font-bold text-white pt-1">Total: ₹{ord.total_amount} ({ord.payment_status})</div>
                  </div>
                  {ord.status === 'placed' && (
                    <button onClick={() => updateOrderStatus(ord.id, 'accepted')} className="w-full py-2 bg-orange-600 font-bold rounded-lg">
                      Accept Order
                    </button>
                  )}
                  {ord.status === 'accepted' && (
                    <button onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')} className="w-full py-2 bg-blue-600 font-bold rounded-lg">
                      Packing Ready ➔ Send Rider
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {dukaanTab === 'menu' && (
            <div className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newItemName || !newItemPrice) return;
                const item = { id: 'p_' + Date.now(), store_id: 'store-1', name: newItemName, price: Number(newItemPrice), unit: 'Standard Pack', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', in_stock: true };
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
      {/* 3. VIEW: MASTER ADMIN APP                                */}
      {/* ======================================================== */}
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-xl font-black text-amber-500">👑 MASTER ADMIN</h1>
              <p className="text-xs text-slate-400">Total Business Control</p>
            </div>
            <button onClick={() => navigateTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700">
              Customer App ➔
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <p className="text-[11px] text-slate-400">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">₹{totalRevenue}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <p className="text-[11px] text-slate-400">Total Orders</p>
              <p className="text-2xl font-black text-orange-400 mt-1">{orders.length}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">Quick Links</h3>
            <p className="text-slate-300">Dukaan: <span className="text-orange-400">nephka.com/dukaan</span></p>
            <p className="text-slate-300">Rider: <span className="text-orange-400">nephka.com/rider</span></p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VIEW: RIDER APP                                       */}
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
                      <h4 className="font-bold text-sm text-white">{ord.customer_name} ({ord.customer_phone})</h4>
                      <span className="text-xs font-bold text-blue-400 uppercase">{ord.status}</span>
                    </div>
                    <p className="text-slate-300">📍 {ord.address}</p>
                    <div className="p-2 rounded bg-slate-900 font-bold text-amber-300">
                      {ord.payment_method?.includes('UPI') ? '✅ ONLINE PAID (₹0 Collect)' : `💵 CASH TO COLLECT: ₹${ord.total_amount}`}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a href={mapLink} target="_blank" rel="noreferrer" className="py-2 bg-blue-600 font-bold text-center rounded text-white">📍 GPS Route</a>
                      <button onClick={() => updateOrderStatus(ord.id, 'delivered')} className="py-2 bg-emerald-600 font-bold rounded text-white">✅ Mark Delivered</button>
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
