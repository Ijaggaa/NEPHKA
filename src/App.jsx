import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const DEFAULT_STORES = [
  { id: 'store-1', name: 'Shree Balaji Sweets & Chaat', category: 'Sweets & Snacks', delivery_time: '12-15 min', rating: 4.8 },
  { id: 'store-2', name: 'Kisan Kirana & Daily Dairy', category: 'Kirana & Milk', delivery_time: '15-20 min', rating: 4.9 },
  { id: 'store-3', name: 'Haryana Medicos & Health', category: 'Pharmacy', delivery_time: '10-15 min', rating: 4.9 },
  { id: 'store-4', name: 'Kisan Taaza Sabzi & Fal Mandi', category: 'Fruits & Vegetables', delivery_time: '12-18 min', rating: 4.7 }
];

const DEFAULT_PRODUCTS = [
  { id: 'p1', store_id: 'store-1', name: 'Desi Ghee Kurkuri Jalebi', price: 80, mrp: 110, unit: '250 gm', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p2', store_id: 'store-1', name: 'Special Aloo Matar Samosa (2 Pcs)', price: 30, mrp: 40, unit: '2 Pcs with Chutney', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p3', store_id: 'store-1', name: 'Shahi Mawa Gulab Jamun Box', price: 70, mrp: 90, unit: '4 Pcs Box', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p4', store_id: 'store-1', name: 'Kaju Katli Special Vark', price: 230, mrp: 270, unit: '250 gm Pack', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p5', store_id: 'store-2', name: 'Fresh Cow Milk Pouch', price: 65, mrp: 68, unit: '1 Litre Pouch', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p6', store_id: 'store-2', name: 'Chakki Fresh Sharbati Gehu Atta', price: 210, mrp: 245, unit: '5 kg Bag', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p7', store_id: 'store-2', name: 'Amul Salted Table Butter', price: 58, mrp: 60, unit: '100 gm Pack', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p8', store_id: 'store-2', name: 'Fortune Kachi Ghani Mustard Oil', price: 145, mrp: 165, unit: '1 Litre Bottle', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p9', store_id: 'store-3', name: 'Dolo 650mg Tablets', price: 32, mrp: 35, unit: '15 Tablets Strip', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p10', store_id: 'store-3', name: 'Band-Aid Washproof Strips', price: 50, mrp: 60, unit: 'Pack of 20 Strips', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p11', store_id: 'store-4', name: 'Desi Pahadi Aloo (Potatoes)', price: 35, mrp: 45, unit: '1 kg Taaza Sabzi', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80', in_stock: true },
  { id: 'p12', store_id: 'store-4', name: 'Fresh Robusta Bananas (Kela)', price: 50, mrp: 60, unit: '1 Dozen (12 Pcs)', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80', in_stock: true }
];

const PHOTO_PRESETS = [
  { label: '🍨 Mithai', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500' },
  { label: '🥟 Samosa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500' },
  { label: '🥛 Doodh', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500' },
  { label: '🌾 Atta', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500' },
  { label: '💊 Dawa', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500' },
  { label: '🥔 Sabzi', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500' }
];

const playArrowImpactSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(320, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.5);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(140, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain2.gain.setValueAtTime(0.8, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.35);
    }, 700);
  } catch (e) {}
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nephka_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authRole, setAuthRole] = useState('customer');
  const [dukaanAuthMode, setDukaanAuthMode] = useState('login');

  const [custNameInput, setCustNameInput] = useState('');
  const [custPhoneInput, setCustPhoneInput] = useState('');

  const [dukaanLoginPhone, setDukaanLoginPhone] = useState('');
  const [dukaanLoginPin, setDukaanLoginPin] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCategory, setRegCategory] = useState('Kirana & Milk');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regPan, setRegPan] = useState('');

  const [currentView, setCurrentView] = useState('customer');
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);

  // Dhanush-Teer Animation
  const [showArrowAnimation, setShowArrowAnimation] = useState(false);
  const [targetStoreInfo, setTargetStoreInfo] = useState(null);

  const [upiId, setUpiId] = useState(() => localStorage.getItem('nephka_upi') || 'nephka@upi');
  const [supportPhone, setSupportPhone] = useState(() => localStorage.getItem('nephka_phone') || '919876543210');
  const [savedNotice, setSavedNotice] = useState(false);

  const sirenAudioRef = useRef(null);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Cart & Recipient Details
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  
  // Receiver Specific Inputs (Allows ordering for someone else)
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isOrderingForOther, setIsOrderingForOther] = useState(false);

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dukaanTab, setDukaanTab] = useState('orders');
  const [selectedDukaanStore, setSelectedDukaanStore] = useState('store-1');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemMrp, setNewItemMrp] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Standard Pack');
  const [newItemImage, setNewItemImage] = useState(PHOTO_PRESETS[0].url);

  const itemTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const deliveryFee = itemTotal === 0 || itemTotal >= 149 ? 0 : 20;
  const platformFee = itemTotal > 0 ? 3 : 0;
  const grandTotalAmount = itemTotal + deliveryFee + platformFee;

  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=NEPHKA&am=${grandTotalAmount}&cu=INR&tn=QuickOrder`;
  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiIntentUrl)}`;
  const counterStandeeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('https://nephka.com')}`;

  // When checkout opens, sync receiver defaults to logged-in user if empty
  const handleOpenCheckout = () => {
    if (!receiverName && currentUser?.name) setReceiverName(currentUser.name);
    if (!receiverPhone && currentUser?.phone) setReceiverPhone(currentUser.phone);
    setShowCheckout(true);
  };

  const sendWhatsAppReceipt = (order) => {
    const mapLink = order.lat && order.lng 
      ? `https://maps.google.com/?q=${order.lat},${order.lng}` 
      : `https://maps.google.com/?q=${encodeURIComponent(order.address)}`;

    const msg = 
`⚡ *NEPHKA 15-MIN EXPRESS RECEIPT* ⚡
━━━━━━━━━━━━━━━━━━━━
📦 *DELIVER TO:* ${order.customer_name}
📞 *CALLING PHONE:* ${order.customer_phone}
${order.ordered_by && order.ordered_by !== order.customer_name ? `👤 *BOOKED BY:* ${order.ordered_by}\n` : ''}📍 *ADDRESS:* ${order.address}
${order.delivery_note ? `📝 *NOTE:* ${order.delivery_note}\n` : ''}
🛒 *ORDERED ITEMS:*
${order.items.map((it, idx) => `${idx + 1}. ${it.name} x ${it.qty} = ₹${it.price * it.qty}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
💵 *Items Total:* ₹${order.item_subtotal || order.total_amount}
🛵 *Delivery Fee:* ${order.delivery_fee === 0 ? 'FREE' : '₹' + order.delivery_fee}
⚙️️ *Platform Fee:* ₹${order.platform_fee || 0}
💰 *GRAND TOTAL:* ₹${order.total_amount}
💳 *PAYMENT:* ${order.payment_status} (${order.payment_method})
🗺️ *MAP NAVIGATION:* ${mapLink}
━━━━━━━━━━━━━━━━━━━━
*NEPHKA - Apna Shehar, Aapki Dukaan*`;

    const sanitizedPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
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
    setReceiverName(userObj.name);
    setReceiverPhone(userObj.phone);
    routeTo('customer');
  };

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

  const handleDukaanKycRegister = async (e) => {
    e.preventDefault();
    if (!regStoreName || !regOwnerName || !regPhone || !regAadhaar || !regPan) {
      return alert('Kripya Aadhaar, PAN aur Dukaan ki poori jaankari bharein!');
    }
    if (regAadhaar.length !== 12) return alert('Aadhaar Card 12 digits ka hona chahiye!');
    if (regPan.length !== 10) return alert('PAN Card 10 characters ka hona chahiye!');

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

    try { await supabase.from('stores').insert([freshStore]); } catch {}

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
    alert(`🎉 "${freshStore.name}" Aadhaar & PAN KYC ke sath verify ho gayi!`);
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

  // --- ORDER SUBMISSION WITH RECEIVER SPECIFICS ---
  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();

    const finalReceiverName = receiverName.trim() || currentUser?.name || 'Customer';
    const finalReceiverPhone = receiverPhone.trim() || currentUser?.phone || '';

    if (cart.length === 0 || !finalReceiverName || !finalReceiverPhone || !address) {
      return alert('Kripya Delivery lene wale ka Naam, Mobile number aur Address poora bharein!');
    }

    setIsSubmitting(true);
    const destinationStore = stores.find((s) => s.id === cart[0]?.store_id) || stores[0];
    setTargetStoreInfo(destinationStore);

    const orderRecord = {
      id: 'ord_' + Date.now(),
      store_id: destinationStore.id,
      customer_name: finalReceiverName,
      customer_phone: finalReceiverPhone,
      ordered_by: currentUser?.name || finalReceiverName,
      delivery_note: deliveryNote.trim() || null,
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

    setShowCheckout(false);
    setShowArrowAnimation(true);
    playArrowImpactSound();

    setTimeout(() => {
      setOrders((prev) => [orderRecord, ...prev]);
      setActiveOrderId(orderRecord.id);
      setShowArrowAnimation(false);
      setIsSubmitting(false);
      setCart([]);
    }, 2400);
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

  const trackedOrder = orders.find((o) => o.id === activeOrderId);
  const trackStep = trackedOrder?.status === 'delivered' ? 4 : trackedOrder?.status === 'out_for_delivery' ? 3 : trackedOrder?.status === 'accepted' ? 2 : 1;
  const grossSalesVolume = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  // LOGIN SCREEN
  if (!currentUser && currentView !== 'poster') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-md">
              N
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">NEPHKA</h1>
            <p className="text-xs text-slate-500 font-semibold">⚡ 15-Minute Hyperlocal Superfast Delivery</p>
          </div>

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

          {authRole === 'customer' && (
            <form onSubmit={handleCustomerLogin} className="space-y-3.5 text-xs">
              <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-100 text-orange-900">
                <p className="font-bold">🛒 Quick Customer Access</p>
                <p className="text-[11px] text-orange-700">Apne shehar ki dukaano se 15 min mein samaan ghar mangwayein.</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Aapka Asli Naam:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pardeep Kumar"
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

                  <div>
                    <label className="font-bold text-slate-800 block mb-0.5">Aadhaar Card Number (12 Digits):</label>
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

                  <div>
                    <label className="font-bold text-slate-800 block mb-0.5">PAN Card Number (10 Characters):</label>
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 font-sans select-none relative overflow-x-hidden">
      
      {/* DHANUSH TEER OVERLAY */}
      {showArrowAnimation && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-hidden">
          <style>{`
            @keyframes bowPull {
              0% { transform: scale(0.8) rotate(-15deg); opacity: 0; }
              25% { transform: scale(1.1) rotate(0deg); opacity: 1; }
              40% { transform: scale(1.15) rotate(5deg); }
              50% { transform: scale(0.9) rotate(-10deg); }
              100% { transform: scale(0.9) rotate(-10deg); opacity: 0.2; }
            }
            @keyframes arrowFlyAcross {
              0% { transform: translate(-140px, 0) scale(0.8); opacity: 0; }
              45% { transform: translate(-100px, 0) scale(1); opacity: 1; }
              75% { transform: translate(110px, 0) scale(1.3); opacity: 1; }
              85% { transform: translate(140px, 0) scale(1); opacity: 1; filter: drop-shadow(0 0 15px #f97316); }
              100% { transform: translate(150px, 0) scale(0.95); opacity: 0; }
            }
            @keyframes storeTargetHit {
              0%, 65% { transform: scale(1); filter: brightness(1); }
              75% { transform: scale(1.35) rotate(-6deg); filter: brightness(1.6) drop-shadow(0 0 25px #22c55e); }
              85% { transform: scale(0.95) rotate(4deg); }
              100% { transform: scale(1.1); filter: drop-shadow(0 0 20px #eab308); }
            }
            @keyframes speedTrail {
              0% { width: 0; opacity: 0; }
              50% { width: 140px; opacity: 0.9; }
              100% { width: 0; opacity: 0; }
            }
            .animate-bow { animation: bowPull 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
            .animate-arrow { animation: arrowFlyAcross 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
            .animate-target { animation: storeTargetHit 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .animate-trail { animation: speedTrail 1.8s ease-in-out forwards; }
          `}</style>

          <div className="text-center mb-6">
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
              ⚡ EXPRESS TELEPORT STRIKE
            </span>
            <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
              Order Fired to Store!
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Target: <span className="text-emerald-400 font-bold">{targetStoreInfo?.name || 'Local Store'}</span>
            </p>
          </div>

          <div className="relative w-full max-w-sm h-52 flex items-center justify-between px-4">
            <div className="relative z-10 animate-bow flex flex-col items-center">
              <svg width="74" height="110" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M75 10 C20 40, 20 100, 75 130" stroke="#f97316" strokeWidth="9" strokeLinecap="round"/>
                <path d="M72 15 C26 42, 26 98, 72 125" stroke="#facc15" strokeWidth="3" strokeLinecap="round"/>
                <line x1="75" y1="10" x2="35" y2="70" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 2" />
                <line x1="35" y1="70" x2="75" y2="130" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 2" />
              </svg>
              <span className="text-[10px] font-black text-orange-300 mt-1 uppercase">Aapka Order</span>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 z-20 animate-arrow flex items-center">
              <div className="h-1.5 bg-gradient-to-r from-transparent via-orange-500 to-amber-300 rounded-full animate-trail -mr-2" />
              <svg width="88" height="32" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="10" y1="20" x2="98" y2="20" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" />
                <line x1="12" y1="20" x2="90" y2="20" stroke="#ea580c" strokeWidth="2.5" />
                <polygon points="95,10 118,20 95,30 102,20" fill="#facc15" stroke="#f97316" strokeWidth="2" />
                <polygon points="5,20 18,10 24,20 18,30" fill="#38bdf8" />
              </svg>
            </div>

            <div className="relative z-10 animate-target flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-900 border-4 border-emerald-500 rounded-2xl flex flex-col items-center justify-center p-2 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/15 animate-ping rounded-2xl" />
                <span className="text-3xl relative z-10">🎯</span>
                <span className="text-[9px] font-black text-emerald-300 relative z-10 uppercase mt-0.5 truncate w-full text-center">
                  {targetStoreInfo?.category?.split(' ')[0] || 'DUKAAN'}
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 mt-1">Dukaan Hit!</span>
            </div>
          </div>

          <div className="w-full max-w-xs bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center mt-3">
            <p className="text-xs font-bold text-slate-200">🏹 Teer dukaan par impact kar chuka hai!</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Live siren dukaandar ke phone par ring ho rahi hai...</p>
          </div>
        </div>
      )}

      {/* Top Navbar */}
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

          {/* Floating Cart Strip */}
          {cart.length > 0 && !showCheckout && (
            <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
              <div onClick={handleOpenCheckout} className="max-w-md mx-auto bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-emerald-500">
                <div>
                  <p className="text-sm font-black leading-tight">₹{grandTotalAmount} • {totalCartCount} ITEMS</p>
                  <p className="text-[10px] text-emerald-200 font-bold">{deliveryFee === 0 ? '✓ Free Delivery Applied' : 'Add more for Free Delivery'}</p>
                </div>
                <span className="font-black text-xs bg-emerald-800/80 px-3 py-1.5 rounded-xl">View Bill ➔</span>
              </div>
            </div>
          )}

          {/* Checkout Slide-Up Sheet with Full Recipient Editing */}
          {showCheckout && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl max-w-md w-full p-4 max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-black text-base text-slate-800">Review & Place Order</h3>
                    <p className="text-xs text-slate-500 font-semibold">{totalCartCount} Items • Bill ₹{grandTotalAmount}</p>
                  </div>
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
                  
                  {/* RECIPIENT PERSON SELECTION (Aapka ya kisi aur ke liye) */}
                  <div className="bg-orange-50/70 border border-orange-200/80 p-3 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-orange-950 flex items-center gap-1.5">
                        <span>📦</span> Kisko Delivery Deni Hai?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOrderingForOther(!isOrderingForOther);
                          if (!isOrderingForOther) {
                            setReceiverName('');
                            setReceiverPhone('');
                          } else {
                            setReceiverName(currentUser?.name || '');
                            setReceiverPhone(currentUser?.phone || '');
                          }
                        }}
                        className="text-[11px] font-bold text-orange-700 underline"
                      >
                        {isOrderingForOther ? 'Khud Ke Liye Mangwayein' : 'Kisi Aur Ke Liye?'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Delivery Receiver Name:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Receiver Name"
                          value={receiverName}
                          onChange={(e) => setReceiverName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white outline-none font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Calling Number (Rider Call):
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          required
                          placeholder="10-digit Phone"
                          value={receiverPhone}
                          onChange={(e) => setReceiverPhone(e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white outline-none font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {currentUser && currentUser.name !== receiverName && (
                      <p className="text-[10px] text-orange-800 font-semibold">
                        ✓ Booking by: <span className="font-bold">{currentUser.name}</span> | Delivery to: <span className="font-bold">{receiverName || '...'}</span>
                      </p>
                    )}
                  </div>

                  {/* ADDRESS FIELD */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">Delivery Address:</label>
                      <button
                        type="button"
                        onClick={detectGpsLocation}
                        className="text-[11px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md"
                      >
                        {isLocating ? 'GPS...' : '📍 Use Current Location'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Ghar / Flat / Gali No."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl border outline-none font-medium"
                    />
                  </div>

                  {/* SPECIAL INSTRUCTIONS / NOTE */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Rider Instruction / Landmark (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Shiv Mandir / Gate par de dein"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      className="w-full p-2.5 rounded-xl border outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`py-2 rounded-xl border font-bold ${paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-slate-50'}`}
                    >
                      💵 Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-2 rounded-xl border font-bold ${paymentMethod === 'upi' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-slate-50'}`}
                    >
                      ⚡ UPI / GPay
                    </button>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-2">
                      <img src={upiQrCodeUrl} alt="UPI QR" className="w-32 h-32 mx-auto border rounded-xl" />
                      <a href={upiIntentUrl} className="block w-full py-2 bg-emerald-600 text-white font-black rounded-xl">
                        📱 Open GPay / PhonePe
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <span>🏹</span>
                    <span>{isSubmitting ? 'Firing Order...' : `Confirm & Shoot Order • ₹${grandTotalAmount}`}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tracking Bar */}
          {trackedOrder && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-4 max-w-md mx-auto rounded-t-3xl shadow-2xl space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {trackStep === 4 ? '🎉 Delivered!' : 'Arriving in 14 Mins'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Delivery for: <span className="font-bold text-slate-800">{trackedOrder.customer_name}</span> (📞 {trackedOrder.customer_phone})
                  </p>
                </div>
                <button
                  onClick={() => sendWhatsAppReceipt(trackedOrder)}
                  className="text-xs bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  💬 WhatsApp
                </button>
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
              {orders.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-10">Koi order pending nahi hai.</p>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        {/* Clear Receiver & Booked by distinction */}
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white">📦 Deliver to: {ord.customer_name}</h4>
                        </div>
                        <a href={`tel:${ord.customer_phone}`} className="text-xs text-emerald-400 font-bold block mt-0.5">
                          📞 Call Receiver: {ord.customer_phone}
                        </a>
                        {ord.ordered_by && ord.ordered_by !== ord.customer_name && (
                          <p className="text-[10px] text-slate-400 mt-0.5">👤 Ordered By: {ord.ordered_by}</p>
                        )}
                        {ord.delivery_note && (
                          <p className="text-[10px] text-amber-300 bg-slate-900 px-2 py-0.5 rounded mt-1">📝 Note: {ord.delivery_note}</p>
                        )}
                      </div>
                      <span className="font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">{ord.status}</span>
                    </div>
                    
                    <p className="text-slate-300">📍 {ord.address}</p>
                    
                    <div className="border-t border-slate-700 pt-2 text-slate-300">
                      {ord.items?.map((it, idx) => <div key={idx}>{it.name} x {it.qty} (₹{it.price * it.qty})</div>)}
                      <div className="font-bold text-white pt-1">Total: ₹{ord.total_amount} ({ord.payment_status})</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button onClick={() => sendWhatsAppReceipt(ord)} className="py-2 bg-emerald-600 font-bold rounded-lg text-white">
                        💬 WhatsApp Slip
                      </button>
                      {ord.status === 'placed' && (
                        <button onClick={() => updateOrderStatus(ord.id, 'accepted')} className="py-2 bg-orange-600 font-bold rounded-lg text-white">
                          ✓ Accept
                        </button>
                      )}
                      {ord.status === 'accepted' && (
                        <button onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')} className="py-2 bg-blue-600 font-bold rounded-lg text-white">
                          📦 Send Rider
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
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

      {/* VIEW 4: RIDER PANEL */}
      {currentView === 'rider' && (
        <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h1 className="text-lg font-black text-emerald-400">🛵 RIDER PARTNER</h1>
            <button onClick={() => routeTo('customer')} className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700">Exit</button>
          </div>

          <div className="space-y-3">
            {orders.filter((o) => o.status !== 'delivered').length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">Sabhi deliveries complete hain!</p>
            ) : (
              orders.filter((o) => o.status !== 'delivered').map((ord) => {
                const mapLink = ord.lat && ord.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${ord.lat},${ord.lng}`
                  : `https://maps.google.com/?q=${encodeURIComponent(ord.address)}`;

                return (
                  <div key={ord.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">📦 Deliver to: {ord.customer_name}</h4>
                        <a href={`tel:${ord.customer_phone}`} className="text-xs text-emerald-400 font-bold block mt-0.5">
                          📞 Call Receiver: {ord.customer_phone}
                        </a>
                        {ord.ordered_by && ord.ordered_by !== ord.customer_name && (
                          <p className="text-[10px] text-slate-400">👤 Ordered by: {ord.ordered_by}</p>
                        )}
                        {ord.delivery_note && (
                          <p className="text-[10px] text-amber-300 bg-slate-900 px-2 py-0.5 rounded mt-1">📝 Note: {ord.delivery_note}</p>
                        )}
                      </div>
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">{ord.status}</span>
                    </div>

                    <p className="text-slate-300">📍 {ord.address}</p>

                    <div className="p-2 rounded bg-slate-900 font-bold text-amber-300">
                      {ord.payment_method?.includes('UPI') ? '✅ ONLINE PAID (₹0 Collect)' : `💵 CASH TO COLLECT: ₹${ord.total_amount}`}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <a href={mapLink} target="_blank" rel="noreferrer" className="py-2 bg-blue-600 font-bold text-center rounded text-white flex items-center justify-center">
                        📍 Map
                      </a>
                      <a href={`tel:${ord.customer_phone}`} className="py-2 bg-emerald-600 font-bold text-center rounded text-white flex items-center justify-center">
                        📞 Call
                      </a>
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

      {/* VIEW 5: ADMIN VIEW */}
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
