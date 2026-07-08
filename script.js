// ================== PI INIT ==================
Pi.init({ version: "2.0" });

let user = null;
let cart = [];

// ================== FIREBASE CONFIG ==================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

// INIT FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// ================== LOGIN ==================
async function login() {
  try {
    const scopes = ['username', 'payments'];
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);

    user = auth.user;
    document.getElementById("user").innerText =
      "Welcome " + user.username;

    loadAds();

  } catch (e) {
    console.error(e);
  }
}

// ================== POST AD ==================
async function postAd() {
  const file = document.getElementById("imageInput").files[0];
  const title = document.getElementById("titleInput").value;
  const price = document.getElementById("priceInput").value;

  if (!file  !title  !price) {
    alert("Fill all fields");
    return;
  }

  // UPLOAD IMAGE
  const storageRef = storage.ref("ads/" + Date.now());
  await storageRef.put(file);
  const imageUrl = await storageRef.getDownloadURL();

  // SAVE TO FIRESTORE
  await db.collection("ads").add({
    title: title,
    price: parseFloat(price),
    image: imageUrl,
    owner: user.username,
    createdAt: Date.now()
  });

  alert("Advert posted!");
  loadAds();
}

// ================== LOAD ADS ==================
async function loadAds() {
  const container = document.getElementById("products");
  container.innerHTML = "Loading...";

  const snapshot = await db.collection("ads")
    .orderBy("createdAt", "desc")
    .get();

  container.innerHTML = "";

  snapshot.forEach(doc => {
    const ad = doc.data();

    container.innerHTML += 
      <div class="card">
        <img src="${ad.image}" style="width:100%">
        <h3>${ad.title}</h3>
        <p>${ad.price} Pi</p>
        <small>Seller: ${ad.owner}</small><br>
        <button onclick="addToCart('${doc.id}', ${ad.price}, '${ad.title}')">
          Add to Cart
        </button>
      </div>
    ;
  });
}

// ================== CART ==================
function addToCart(id, price, title) {
  cart.push({ id, price, title });
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    container.innerHTML += <p>${item.title} - ${item.price} Pi</p>;
    total += item.price;
  });

  document.getElementById("total").innerText =
    "Total: " + total + " Pi";
}

// ================== CHECKOUT ==================
function checkout() {
  if (cart.length === 0) {
    alert("Cart empty");
    return;
  }

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  Pi.createPayment({
    amount: total,
    memo: "AZ ZAMAN Order",
    metadata: cart
  }, {
    onReadyForServerApproval: (paymentId) => {
      console.log(paymentId);
    },

    onReadyForServerCompletion: (paymentId, txid) => {
      alert("Payment successful!");
      cart = [];
      renderCart();
    },

    onCancel: () => alert("Cancelled"),
    onError: (err) => console.error(err)
  });
}

function onIncompletePaymentFound(payment) {
  console.log(payment);
}// === ADMIN DASHBOARD CODE (Replace the previous admin functions) ===

// Admin Users
const ADMIN_USERS = ['shabsonsk', 'admin', 'yourusername']; // ← Add your Pi usernames

let isAdmin = false;

// Enhanced Admin Functions
async function loadAdminData() {
  document.getElementById('adminDashboard').style.display = 'block';
  await Promise.all([loadVendors(), loadAllProductsAdmin()]);
}

async function loadVendors() {
  const container = document.getElementById('vendorsList');
  container.innerHTML = '<h4>Loading vendors...</h4>';

  try {
    const snapshot = await db.collection('products').get();
    const vendorMap = {};

    snapshot.forEach(doc => {
      const product = doc.data();
      const seller = product.seller;
      if (!seller) return;

      if (!vendorMap[seller]) {
        vendorMap[seller] = {
          name: seller,
          productCount: 0,
          totalValue: 0,
          products: []
        };
      }
      vendorMap[seller].productCount++;
      vendorMap[seller].totalValue += product.price || 0;
      vendorMap[seller].products.push({id: doc.id, ...product});
    });

    container.innerHTML = '<h3>Registered Vendors</h3>';

    Object.values(vendorMap).forEach(vendor => {
      const div = document.createElement('div');
      div.className = 'vendor-card';
      div.innerHTML = `
        <strong>👤 ${vendor.name}</strong><br>
        Products: <b>${vendor.productCount}</b> | 
        Total Value: <b>${vendor.totalValue} Pi</b><br>
        <button onclick="showVendorDetails('${vendor.name}')">View Products</button>
        <button onclick="deleteVendor('${vendor.name}')" style="background:#f44336;">Remove Vendor</button>
      `;
      container.appendChild(div);
    });

    if (Object.keys(vendorMap).length === 0) {
      container.innerHTML += '<p>No vendors registered yet.</p>';
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Error loading vendors.</p>';
  }
}

async function loadAllProductsAdmin() {
  const container = document.getElementById('adminProducts');
  container.innerHTML = '';

  try {
    const snapshot = await db.collection('products').orderBy('timestamp', 'desc').get();
    
    snapshot.forEach(doc => {
      const product = doc.data();
      const prodDiv = document.createElement('div');
      prodDiv.className = 'product admin-product';
      prodDiv.innerHTML = `
        <img src="\( {product.imageUrl}" alt=" \){product.title}">
        <h4>${product.title}</h4>
        <p><strong>${product.price} Pi</strong> • ${product.seller}</p>
        <button onclick="deleteProduct('${doc.id}')" class="delete-btn">Delete Product</button>
      `;
      container.appendChild(prodDiv);
    });
  } catch (e) {
    console.error(e);
  }
}

function showVendorDetails(sellerName) {
  alert(`📋 Vendor: ${sellerName}\n\nThis can be expanded into a full modal with all their products.`);
  // You can later turn this into a nice modal
}

// Delete entire vendor (all their products)
async function deleteVendor(sellerName) {
  if (!confirm(`Delete ALL products from vendor "${sellerName}"?`)) return;

  try {
    const snapshot = await db.collection('products')
      .where('seller', '==', sellerName)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    alert(`Vendor ${sellerName} has been removed.`);
    loadAdminData();
    loadProducts();
  } catch (error) {
    alert("Failed to delete vendor");
    console.error(error);
  }
}

// Keep the existing deleteProduct function too
async function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return;
  try {
    await db.collection('products').doc(productId).delete();
    loadAdminData();
    loadProducts();
  } catch (e) {
    alert('Failed to delete product');
  }
}// Sample Products - Solar, Inverter, Fertilizer, Fish Farming
const sampleProducts = [
  {
    id: "solar1",
    title: "500W Solar Panel",
    price: 850,
    category: "solar",
    imageUrl: "https://picsum.photos/id/1015/300/200",
    seller: "shabsonsk"
  },
  {
    id: "inverter1",
    title: "2.5KVA Solar Inverter",
    price: 1250,
    category: "solar",
    imageUrl: "https://picsum.photos/id/106/300/200",
    seller: "shabsonsk"
  },
  {
    id: "fertilizer1",
    title: "NPK 15-15-15 Fertilizer (50kg)",
    price: 180,
    category: "fertilizer",
    imageUrl: "https://picsum.photos/id/201/300/200",
    seller: "agrohub"
  },
  {
    id: "fertilizer2",
    title: "Organic Manure Compost",
    price: 95,
    category: "fertilizer",
    imageUrl: "https://picsum.photos/id/133/300/200",
    seller: "agrohub"
  },
  {
    id: "fish1",
    title: "Fish Pond Net (10m)",
    price: 220,
    category: "fish",
    imageUrl: "https://picsum.photos/id/251/300/200",
    seller: "fishfarmng"
  },
  {
    id: "fish2",
    title: "Aerator Pump for Fish Pond",
    price: 650,
    category: "fish",
    imageUrl: "https://picsum.photos/id/180/300/200",
    seller: "fishfarmng"
  },
  {
    id: "solar2",
    title: "Solar Charge Controller 60A",
    price: 320,
    category: "solar",
    imageUrl: "https://picsum.photos/id/107/300/200",
    seller: "shabsonsk"
  }
];

// Load Sample Products
function loadSampleProducts() {
  const solarContainer = document.getElementById('solar-products');
  const fertContainer = document.getElementById('fertilizer-products');
  const fishContainer = document.getElementById('fish-products');

  solarContainer.innerHTML = '';
  fertContainer.innerHTML = '';
  fishContainer.innerHTML = '';

  sampleProducts.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="\( {product.imageUrl}" alt=" \){product.title}">
      <h3>${product.title}</h3>
      <p><strong>${product.price} Pi</strong></p>
      <p>Seller: ${product.seller}</p>
      <button onclick="addToCart('\( {product.id}', ' \){product.title}', \( {product.price}, ' \){product.imageUrl}')">Add to Cart</button>
    `;

    if (product.category === 'solar') {
      solarContainer.appendChild(div);
    } else if (product.category === 'fertilizer') {
      fertContainer.appendChild(div);
    } else if (product.category === 'fish') {
      fishContainer.appendChild(div);
    }
  });
}