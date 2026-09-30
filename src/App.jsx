import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const DEFAULT_STORES = [
  { id: 'store-1', name: 'Shree Balaji Sweets & Chaat', category: 'Sweets & Snacks', delivery_time: '15-20 min', rating: 4.8 },
  { id: 'store-2', name: 'Kisan Kirana & Daily Dairy', category: 'Kirana & Milk', delivery_time: '15-25 min', rating: 4.9 }
];

const DEFAULT_PRODUCTS = [
  { id: 'p1', store_id: 'store-1', name: 'Desi Ghee Jalebi & Rabri', price: 80, description: 'Garma-garam kurkuri jalebi with malai rabri', in_stock: true },
  { id: 'p2', store_id: 'store-1', name: 'Samosa Chatni (2 Pcs)', price: 30, description: 'Aloo matar special with meethi chatni', in_stock: true },
  { id: 'p3', store_id: 'store-1', name: 'Chole Bhature Special', price: 90, description: 'Amritsari style paneer wale bhature', in_stock: true },
  { id: 'p4', store_id: 'store-2', name: 'Fresh Cow Milk (1 Litre)', price: 65, description: 'Sudh taaza doodh roz subah', in_stock: true },
  { id: 'p5', store_id: 'store-2', name: 'Fortune Chakki Fresh Atta (5kg)', price: 210, description: '100% Shudh Sharbati Gehu', in_stock: true },
  { id: 'p6', store_id: 'store-2', name: 'Amul Butter (100g)', price: 58, description: 'Pasteurized table butter', in_stock: true }
];

// Aapka UPI ID jahan payment aayegi (ise baad mein kabhi bhi badal sakte hain)
const ADMIN_UPI_ID = 'nephka@upi';

export default function App() {
  const [view, setView] = useState('customer'); // 'customer', 'dukaan', 'rider'
  const [dukaanTab, setDukaanTab] = useState('orders'); // 'orders', 'inventory'
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Checkout Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'upi'
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Inventory States
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStoreId, setNewItemStoreId] = useState('store-1');

  const playAlert = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: prData } = await supabase.from('products').select('*');
        if (prData && prData.length > 0) setProducts(prData);

        const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (ordData) setOrders(ordData);
      } catch (err) {
        console.warn('DB connect notice:', err);
      }
    };

    loadData();

    const channel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playAlert();
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

  const addToCart = (product) => {
    if (product.in_stock === false) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item)).filter((item) => item.qty > 0)
    );
  };

  const totalCartAmount = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

  // Dynamic UPI Link & QR Code
  const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=NEPHKA%20Delivery&am=${totalCartAmount}&cu=INR&tn=Order%20Payment`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Pehle cart mein item jodein!');
    if (!customerName || !customerPhone || !address) return alert('Poori details bharein!');

    setIsSubmitting(true);
    const newOrder = {
      customer_name: customerName,
      customer_phone: customerPhone,
      address: address,
      items: cart,
      total_amount: totalCartAmount,
      status: 'placed',
      payment_method: paymentMethod === 'upi' ? 'UPI Online' : 'Cash on Delivery',
      payment_status: paymentMethod === 'upi' ? 'Paid (UPI)' : 'Cash to Collect',
      utr: utrNumber || null
    };

    try {
      await supabase.from('orders').insert([newOrder]);
    } catch (e) {
      console.warn('Order sync:', e);
    }

    setOrders((prev) => [{ id: Date.now().toString(), ...newOrder, created_at: new Date().toISOString() }, ...prev]);
    setIsSubmitting(false);
    alert('🎉 Order successfully place ho gaya! Dukaan & Rider panel par sync ho chuka hai.');
    setCart([]);
    setUtrNumber('');
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    } catch (e) {}
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const toggleStock = async (prodId, currentStatus) => {
    const updatedStatus = !currentStatus;
    try {
      await supabase.from('products').update({ in_stock: updatedStatus }).eq('id', prodId);
    } catch (e) {}
    setProducts((prev) => prev.map((p) => (p.id === prodId ? { ...p, in_stock: updatedStatus } : p)));
  };

  const updatePrice = async (prodId) => {
    const newPrice = prompt('Naya Price (₹) enter karein:');
    if (!newPrice || isNaN(newPrice)) return;
    const priceNum = Number(newPrice);
    try {
      await supabase.from('products').update({ price: priceNum }).eq('id', prodId);
    } catch (e) {}
    setProducts((prev) => prev.map((p) => (p.id === prodId ? { ...p, price: priceNum } : p)));
  };

  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return alert('Item ka naam aur price daalein!');

    const newProd = {
      id: 'prod_' + Date.now(),
      store_id: newItemStoreId,
      name: newItemName,
      price: Number(newItemPrice),
      description: 'Taaza aur badhiya quality',
      in_stock: true
    };

    try {
      await supabase.from('products').insert([newProd]);
    } catch (e) {}

    setProducts((prev) => [newProd, ...prev]);
    setNewItemName('');
    setNewItemPrice('');
    alert('✅ Naya item menu mein jud gaya!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-orange-600">NEPHKA</h1>
            <p className="text-xs text-slate-500 font-medium">⚡ 20 Min Hyperlocal Superfast</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button onClick={() => setView('customer')} className={`px-3 py-1.5 rounded-lg transition ${view === 'customer' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}>App</button>
            <button onClick={() => setView('dukaan')} className={`px-3 py-1.5 rounded-lg transition ${view === 'dukaan' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}>Dukaan</button>
            <button onClick={() => setView('rider')} className={`px-3 py-1.5 rounded-lg transition ${view === 'rider' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}>Rider</button>
          </div>
        </div>
      </header>

      {/* VIEW 1: CUSTOMER APP */}
      {view === 'customer' && (
        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-2xl text-white shadow-lg">
            <span className="text-xs uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded-md">Live Platform</span>
            <h2 className="text-xl font-bold mt-1">Apna Shehar • Aapki Dukaan</h2>
            <p className="text-xs opacity-90">Mithai, Samosa, Kirana ya Dawa — 20 min mein ghar pe.</p>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {['All', 'Sweets & Snacks', 'Kirana & Milk'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3.5 py-1.5 rounded-full border transition ${activeTab === cat ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-white text-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stores & Products */}
          <div className="space-y-4">
            {stores
              .filter((st) => activeTab === 'All' || st.category === activeTab)
              .map((store) => (
                <div key={store.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{store.name}</h3>
                      <p className="text-xs text-slate-500">{store.category} • ⭐ {store.rating}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md">
                      {store.delivery_time}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {products
                      .filter((p) => p.store_id === store.id)
                      .map((product) => {
                        const inCart = cart.find((i) => i.id === product.id);
                        const isOutOfStock = product.in_stock === false;

                        return (
                          <div key={product.id} className={`flex justify-between items-center py-2 border-b border-dashed border-slate-100 last:border-0 ${isOutOfStock ? 'opacity-50' : ''}`}>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                              <p className="text-xs font-bold text-orange-600">₹{product.price}</p>
                            </div>

                            {isOutOfStock ? (
                              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                                Out of Stock
                              </span>
                            ) : inCart ? (
                              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
                                <button onClick={() => removeFromCart(product.id)} className="font-bold text-orange-600 px-1">-</button>
                                <span className="text-xs font-bold">{inCart.qty}</span>
                                <button onClick={() => addToCart(product)} className="font-bold text-orange-600 px-1">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(product)} className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                ADD +
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>

          {/* Cart & Checkout with UPI */}
          {cart.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-xl border border-orange-100 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Delivery Details & Bill (₹{totalCartAmount})</h3>
              
              <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
                <input
                  type="text"
                  placeholder="Aapka Naam"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (WhatsApp)"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <textarea
                  placeholder="Ghar / Dukaan ka Poora Address"
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none"
                />

                {/* PAYMENT MODE SELECTOR */}
                <div className="pt-2">
                  <p className="font-bold text-slate-700 mb-2">Payment Mode Chunein:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        paymentMethod === 'cod'
                          ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      💵 Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        paymentMethod === 'upi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      ⚡ Pay via UPI / QR
                    </button>
                  </div>
                </div>

                {/* UPI DETAILS & DYNAMIC QR */}
                {paymentMethod === 'upi' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-2">
                    <p className="text-xs font-bold text-emerald-800">Scan & Pay ₹{totalCartAmount}</p>
                    <div className="flex justify-center py-1">
                      <img
                        src={qrCodeUrl}
                        alt="UPI Payment QR"
                        className="w-36 h-36 border-2 border-white rounded-lg shadow-sm"
                      />
                    </div>
                    <a
                      href={upiUrl}
                      className="inline-block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                    >
                      📱 Open GPay / PhonePe / Paytm
                    </a>
                    <input
                      type="text"
                      placeholder="Transaction / UTR Number (Optional)"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-white text-xs outline-none text-center"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Placing Order...' : `Order Confirm Karein • ₹${totalCartAmount}`}
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* VIEW 2: DUKAAN PANEL */}
      {view === 'dukaan' && (
        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">🏪 Dukaan Dashboard</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-md">Live Store</span>
            </div>
            
            <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1">
              <button
                onClick={() => setDukaanTab('orders')}
                className={`py-2 rounded-lg transition ${dukaanTab === 'orders' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}
              >
                Live Orders ({orders.filter((o) => o.status !== 'delivered').length})
              </button>
              <button
                onClick={() => setDukaanTab('inventory')}
                className={`py-2 rounded-lg transition ${dukaanTab === 'inventory' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}
              >
                Manage Stock / Menu
              </button>
            </div>
          </div>

          {dukaanTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Koi order nahi aaya abhi tak.</p>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{ord.customer_name}</h4>
                        <p className="text-xs text-slate-500">📞 {ord.customer_phone}</p>
                        <p className="text-xs text-slate-600 mt-1">📍 {ord.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-800 uppercase block mb-1">
                          {ord.status}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ord.payment_method?.includes('UPI') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {ord.payment_method || 'COD'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed pt-2">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700">
                          <span>{it.name} x {it.qty}</span>
                          <span>₹{it.price * it.qty}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-xs pt-1 border-t mt-1">
                        <span>Total ({ord.payment_status || 'Cash to Collect'})</span>
                        <span className="text-orange-600">₹{ord.total_amount}</span>
                      </div>
                    </div>

                    {ord.status === 'placed' && (
                      <button onClick={() => updateOrderStatus(ord.id, 'accepted')} className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold">
                        Order Sweekar Karein (Accept)
                      </button>
                    )}
                    {ord.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold">
                        Packing Poori & Rider Ko Saunpein
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {dukaanTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">➕ Naya Item Menu Mein Jodein</h3>
                <form onSubmit={handleAddNewProduct} className="space-y-2 text-xs">
                  <select
                    value={newItemStoreId}
                    onChange={(e) => setNewItemStoreId(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-slate-50 font-medium"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Item ka Naam"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
                  >
                    Menu Mein Save Karein
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 px-1">Live Stock & Rates</h3>
                {products.map((item) => {
                  const isAvailable = item.in_stock !== false;
                  return (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-orange-600">₹{item.price}</span>
                          <button
                            onClick={() => updatePrice(item.id)}
                            className="text-[10px] text-blue-600 underline font-semibold"
                          >
                            Price Badlein
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleStock(item.id, isAvailable)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {isAvailable ? '✅ In Stock' : '❌ Out of Stock'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* VIEW 3: RIDER PARTNER PANEL */}
      {view === 'rider' && (
        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="bg-emerald-900 text-white p-4 rounded-2xl">
            <h2 className="font-bold text-lg">🛵 Rider Delivery Panel</h2>
            <p className="text-xs text-emerald-200">Live Delivery Tasks & Google Maps Direct</p>
          </div>

          <div className="space-y-3">
            {orders.filter((o) => o.status !== 'delivered').length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Sabhi delivery complete hain!</p>
            ) : (
              orders
                .filter((o) => o.status !== 'delivered')
                .map((ord) => (
                  <div key={ord.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{ord.customer_name}</h4>
                        <p className="text-xs text-slate-500">📞 {ord.customer_phone}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{ord.status}</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-slate-700">Drop Address:</p>
                      <p className="text-slate-600">{ord.address}</p>
                      
                      {/* PAYMENT STATUS BADGE FOR RIDER */}
                      <div className="mt-2 pt-2 border-t flex justify-between items-center">
                        <span className="font-bold text-slate-600">Payment Status:</span>
                        {ord.payment_method?.includes('UPI') ? (
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                            ✅ ONLINE PAID (₹0 Collect)
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-extrabold text-xs">
                            💵 CASH COLLECT: ₹{ord.total_amount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(ord.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        📍 Map Navigation
                      </a>
                      <button onClick={() => updateOrderStatus(ord.id, 'delivered')} className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs">
                        ✅ Mark Delivered
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </main>
      )}
    </div>
  );
}
