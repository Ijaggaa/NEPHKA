import React, { useState } from 'react';
import { 
  ShoppingBag, Bike, Store, MapPin, Plus, Minus, 
  CheckCircle, Send, ArrowRight, X
} from 'lucide-react';

const STORES = [
  {
    id: 's1',
    name: 'Shree Balaji Sweets & Chaat',
    category: 'Sweets & Snacks',
    deliveryTime: '15-20 min',
    location: 'Main Market Chowk',
    items: [
      { id: 'i1', name: 'Desi Ghee Jalebi & Rabri', price: 80, veg: true, desc: 'Garma-garam kurkuri jalebi' },
      { id: 'i2', name: 'Samosa Chatni (2 Pcs)', price: 30, veg: true, desc: 'Aloo matar special with meethi chatni' },
      { id: 'i3', name: 'Chole Bhature Special', price: 90, veg: true, desc: 'Amritsari style paneer wale bhature' }
    ]
  },
  {
    id: 's2',
    name: 'Kisan Kirana & Dairy',
    category: 'Kirana & Milk',
    deliveryTime: '15-25 min',
    location: 'Near Old Bus Stand',
    items: [
      { id: 'i4', name: 'Amul Taaza Milk (500ml)', price: 28, veg: true, desc: 'Fresh morning pack' },
      { id: 'i5', name: 'Fresh Paneer (250gm)', price: 110, veg: true, desc: 'Soft daily fresh dairy paneer' },
      { id: 'i6', name: 'Aashirvaad Sharbati Atta (5kg)', price: 240, veg: true, desc: 'Chakki fresh whole wheat' }
    ]
  },
  {
    id: 's3',
    name: 'Sharma 24x7 Medical Store',
    category: 'Medicines & Care',
    deliveryTime: '10-15 min',
    location: 'Civil Hospital Road',
    items: [
      { id: 'i7', name: 'Crocin Pain Relief Tablet', price: 45, veg: true, desc: 'Sir dard aur bukhar ke liye' },
      { id: 'i8', name: 'ORS Orange Drink (200ml)', price: 35, veg: true, desc: 'Instant energy and rehydration' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'merchant' | 'rider'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  
  // Checkout details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('COD');
  const [orderSent, setOrderSent] = useState(null);

  const addToCart = (item, storeName) => {
    setCart(prev => {
      const current = prev[item.id] || { ...item, storeName, qty: 0 };
      return { ...prev, [item.id]: { ...current, qty: current.qty + 1 } };
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      if (!prev[id]) return prev;
      const updated = { ...prev };
      if (updated[id].qty <= 1) delete updated[id];
      else updated[id].qty -= 1;
      return updated;
    });
  };

  const cartList = Object.values(cart);
  const subtotal = cartList.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryCharge = subtotal > 0 ? 25 : 0;
  const total = subtotal + deliveryCharge;

  const sendWhatsAppOrder = () => {
    if (!name || !phone || !address) {
      alert('Kripya apna Naam, Mobile Number aur Pura Pata daalein!');
      return;
    }

    const orderId = 'NPK-' + Math.floor(1000 + Math.random() * 9000);
    const itemList = cartList.map(it => `• ${it.name} (${it.qty}x) = ₹${it.price * it.qty}`).join('%0A');

    const msg = `*📦 NAYA ORDER: ${orderId}*%0A` +
      `*NEPHKA Local Fast Delivery*%0A---------------------------%0A` +
      `*Customer:* ${name}%0A` +
      `*Phone:* ${phone}%0A` +
      `*Address:* ${address}%0A` +
      `*Payment:* ${paymentMode}%0A---------------------------%0A` +
      `*Samaan:*%0A${itemList}%0A---------------------------%0A` +
      `*Total Samaan:* ₹${subtotal}%0A` +
      `*Delivery Fee:* ₹${deliveryCharge}%0A` +
      `*Kul Rashi:* ₹${total}%0A%0A` +
      `_Order Jaldi Deliver Karein!_`;

    // Dispatch number (Yahan apna number replace karein)
    const adminWhatsApp = "919813070099"; 
    window.open(`https://wa.me/${adminWhatsApp}?text=${msg}`, '_blank');

    setOrderSent(orderId);
    setCart({});
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-600 text-white font-black px-2.5 py-1 rounded-lg text-lg tracking-wider">
              NEPHKA
            </div>
            <div>
              <div className="flex items-center text-[11px] font-semibold text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-orange-600 mr-1" />
                <span>Apna Shehar / Local Area</span>
              </div>
              <p className="text-xs font-bold text-slate-800">20 Min Superfast Delivery</p>
            </div>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-orange-50 text-orange-600 border border-orange-200 p-2.5 rounded-full hover:bg-orange-100"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartList.reduce((acc, it) => acc + it.qty, 0)}
              </span>
            )}
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-1.5 flex justify-center space-x-2 text-xs font-medium">
          <button 
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1 rounded-md transition ${activeTab === 'customer' ? 'bg-orange-600 text-white font-bold' : 'text-slate-600'}`}
          >
            Customer App
          </button>
          <button 
            onClick={() => setActiveTab('merchant')}
            className={`px-3 py-1 rounded-md transition ${activeTab === 'merchant' ? 'bg-orange-600 text-white font-bold' : 'text-slate-600'}`}
          >
            Dukaan Panel
          </button>
          <button 
            onClick={() => setActiveTab('rider')}
            className={`px-3 py-1 rounded-md transition ${activeTab === 'rider' ? 'bg-orange-600 text-white font-bold' : 'text-slate-600'}`}
          >
            Rider Partner
          </button>
        </div>
      </header>

      {/* Main View */}
      <main className="max-w-2xl mx-auto px-4 pt-4">
        {activeTab === 'customer' && (
          <div>
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-4 text-white shadow mb-4">
              <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                Aapka Shehar • Aapki Dukaan
              </span>
              <h1 className="text-xl font-black mt-1">NEPHKA Local Fast Delivery</h1>
              <p className="text-orange-100 text-xs mt-0.5">Mithai, Samosa, Kirana ya Dawa — sab 20 min mein ghar pe.</p>
            </div>

            {/* Category Filter */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
              <div className="flex gap-2">
                {['All', 'Sweets & Snacks', 'Kirana & Milk', 'Medicines & Care'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      selectedCategory === cat 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                  vegOnly ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-green-600' : 'bg-slate-300'}`} />
                <span>Veg</span>
              </button>
            </div>

            {orderSent && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between text-green-800 text-xs">
                <span>✅ Order #{orderSent} WhatsApp par dispatch ho chuka hai!</span>
                <button onClick={() => setOrderSent(null)} className="font-bold underline">OK</button>
              </div>
            )}

            {/* Stores List */}
            <div className="space-y-4">
              {STORES
                .filter(s => selectedCategory === 'All' || s.category === selectedCategory)
                .map(store => (
                  <div key={store.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{store.name}</h3>
                        <p className="text-[11px] text-slate-500">{store.category} • {store.location}</p>
                      </div>
                      <span className="text-[11px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded">
                        ⚡ {store.deliveryTime}
                      </span>
                    </div>

                    <div className="p-3 divide-y divide-slate-100">
                      {store.items
                        .filter(item => !vegOnly || item.veg)
                        .map(item => {
                          const qty = cart[item.id]?.qty || 0;
                          return (
                            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                              <div className="pr-4">
                                <h4 className="font-semibold text-xs text-slate-800">{item.name}</h4>
                                <p className="text-[11px] text-slate-400">{item.desc}</p>
                                <p className="text-xs font-bold text-slate-900 mt-0.5">₹{item.price}</p>
                              </div>

                              <div>
                                {qty === 0 ? (
                                  <button
                                    onClick={() => addToCart(item, store.name)}
                                    className="px-3 py-1 bg-orange-50 border border-orange-300 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-600 hover:text-white"
                                  >
                                    ADD +
                                  </button>
                                ) : (
                                  <div className="flex items-center bg-orange-600 text-white rounded-lg px-2 py-1 space-x-2 text-xs font-bold">
                                    <button onClick={() => removeFromCart(item.id)}><Minus className="w-3 h-3" /></button>
                                    <span>{qty}</span>
                                    <button onClick={() => addToCart(item, store.name)}><Plus className="w-3 h-3" /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* DUKAAN PANEL */}
        {activeTab === 'merchant' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <Store className="w-10 h-10 text-orange-600 mx-auto mb-2" />
            <h2 className="text-sm font-bold text-slate-800">Dukandar Live Panel</h2>
            <p className="text-xs text-slate-500 mb-3">Shree Balaji Sweets • Online</p>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-xs text-orange-800">
              Customer ke orders aate hi yahan live notification aayega.
            </div>
          </div>
        )}

        {/* RIDER PANEL */}
        {activeTab === 'rider' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-800">NEPHKA Rider Duty</h2>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                ● On Duty
              </span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <span className="text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">Order #NPK-4102</span>
              <p className="font-bold text-xs text-slate-900 mt-1">Pickup: Shree Balaji Sweets</p>
              <p className="text-xs text-slate-600">Drop: Civil Lines</p>
              <p className="text-xs font-black text-orange-600 mt-1">Delivery Earning: ₹30</p>
            </div>
          </div>
        )}
      </main>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <ShoppingBag className="w-4 h-4 text-orange-600 mr-1.5" />
                Aapka Cart ({cartList.length})
              </h3>
              <button onClick={() => setIsCartOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {cartList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <p className="text-xs font-bold">Cart khali hai</p>
              </div>
            ) : (
              <div className="flex-1 py-3 flex flex-col justify-between">
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {cartList.map(it => (
                    <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{it.name}</p>
                        <p className="text-[11px] text-slate-400">₹{it.price} each</p>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button onClick={() => removeFromCart(it.id)} className="p-1 rounded bg-slate-100"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-xs">{it.qty}</span>
                        <button onClick={() => addToCart(it, it.storeName)} className="p-1 rounded bg-slate-100"><Plus className="w-3 h-3" /></button>
                        <span className="font-bold text-xs ml-1">₹{it.price * it.qty}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Delivery Address</p>
                  <input 
                    type="text" 
                    placeholder="Aapka Naam" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                  <input 
                    type="tel" 
                    placeholder="WhatsApp Mobile Number" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                  <textarea 
                    rows={2}
                    placeholder="Ghar / Dukaan ka pata & Landmark" 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg resize-none"
                  />

                  <div className="pt-2 border-t text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Items Total</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery Fee</span>
                      <span>₹{deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t">
                      <span>Kul Rashi</span>
                      <span>₹{total}</span>
                    </div>

                    <button
                      onClick={sendWhatsAppOrder}
                      className="w-full mt-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Par Order Bhejo (₹{total})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart */}
      {cartList.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-30">
          <div 
            onClick={() => setIsCartOpen(true)}
            className="bg-orange-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                {cartList.reduce((s, it) => s + it.qty, 0)} Items
              </span>
              <span className="font-bold text-sm">₹{total}</span>
            </div>
            <div className="flex items-center text-xs font-bold space-x-1">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}