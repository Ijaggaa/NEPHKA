import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [view, setView] = useState('customer'); // 'customer', 'dukaan', 'rider'
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Audio Notification sound function for Dukaan
  const playAlert = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchInitialData();

    // 2. Realtime Subscription for Orders
    const channel = supabase
      .channel('realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playAlert();
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((ord) => (ord.id === payload.new.id ? payload.new : ord))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    const { data: stData } = await supabase.from('stores').select('*');
    if (stData) setStores(stData);

    const { data: prData } = await supabase.from('products').select('*');
    if (prData) setProducts(prData);

    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (ordData) setOrders(ordData);
  };

  // Cart operations
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const totalCartAmount = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

  // Submit Live Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Kripya cart mein item jodein!');
    if (!customerName || !customerPhone || !address) return alert('Poori details bharein!');

    setIsSubmitting(true);
    const { error } = await supabase.from('orders').insert([
      {
        customer_name: customerName,
        customer_phone: customerPhone,
        address: address,
        items: cart,
        total_amount: totalCartAmount,
        status: 'placed'
      }
    ]);

    setIsSubmitting(false);
    if (!error) {
      alert('Order successfully placed ho gaya! Dukaan & Rider panel par sync ho chuka hai.');
      setCart([]);
    } else {
      alert('Order place karne mein dikkat aayi: ' + error.message);
    }
  };

  // Status updates
  const updateOrderStatus = async (orderId, newStatus, extra = {}) => {
    await supabase.from('orders').update({ status: newStatus, ...extra }).eq('id', orderId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-orange-600">NEPHKA</h1>
            <p className="text-xs text-slate-500 font-medium">⚡ 20 Min Hyperlocal Superfast</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setView('customer')}
              className={`px-3 py-1.5 rounded-lg transition ${view === 'customer' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}
            >
              App
            </button>
            <button
              onClick={() => setView('dukaan')}
              className={`px-3 py-1.5 rounded-lg transition ${view === 'dukaan' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}
            >
              Dukaan
            </button>
            <button
              onClick={() => setView('rider')}
              className={`px-3 py-1.5 rounded-lg transition ${view === 'rider' ? 'bg-orange-600 text-white shadow' : 'text-slate-600'}`}
            >
              Rider
            </button>
          </div>
        </div>
      </header>

      {/* VIEW 1: CUSTOMER VIEW */}
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
                className={`px-3 py-1.5 rounded-full border whitespace-nowrap ${activeTab === cat ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700'}`}
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
                        return (
                          <div key={product.id} className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-100 last:border-0">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                              <p className="text-xs font-bold text-orange-600">₹{product.price}</p>
                            </div>
                            {inCart ? (
                              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
                                <button onClick={() => removeFromCart(product.id)} className="font-bold text-orange-600 px-1">-</button>
                                <span className="text-xs font-bold">{inCart.qty}</span>
                                <button onClick={() => addToCart(product)} className="font-bold text-orange-600 px-1">+</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                              >
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

          {/* Checkout Drawer / Order Form */}
          {cart.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-xl border border-orange-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Delivery Details & Bill (₹{totalCartAmount})</h3>
              <form onSubmit={handlePlaceOrder} className="space-y-2 text-xs">
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Placing Order...' : `Order Place Karein • ₹${totalCartAmount} (COD / UPI)`}
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* VIEW 2: DUKAAN PANEL */}
      {view === 'dukaan' && (
        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl">
            <h2 className="font-bold text-lg">🏪 Dukaan Live Order Panel</h2>
            <p className="text-xs text-slate-400">Naye order aane par yahan chime sound bajegi</p>
          </div>

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
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-800 uppercase">
                      {ord.status}
                    </span>
                  </div>

                  <div className="border-t border-dashed pt-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700">
                        <span>{it.name} x {it.qty}</span>
                        <span>₹{it.price * it.qty}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t mt-1">
                      <span>Total</span>
                      <span>₹{ord.total_amount}</span>
                    </div>
                  </div>

                  {ord.status === 'placed' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'accepted')}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
                    >
                      Order Sweekar Karein (Accept)
                    </button>
                  )}
                  {ord.status === 'accepted' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                    >
                      Packing Poori & Rider Ko Saunpein
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
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
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                        {ord.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg text-xs">
                      <p className="font-semibold text-slate-700">Drop Address:</p>
                      <p className="text-slate-600">{ord.address}</p>
                      <p className="font-bold text-emerald-700 mt-1">Cash Collect: ₹{ord.total_amount}</p>
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
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'delivered')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                      >
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
