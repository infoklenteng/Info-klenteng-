// app.js (Versi Lengkap dengan Filter Tayang & Paginasi)

// Import semua fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, enableNetwork, query, limit, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Ganti dengan firebaseConfig dari PROYEK BARU Anda
const firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_AUTH_DOMAIN_ANDA",
    projectId: "GANTI_DENGAN_PROJECT_ID_ANDA",
    storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_ANDA",
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_ANDA",
    appId: "GANTI_DENGAN_APP_ID_ANDA"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
enableNetwork(db); // Paksa koneksi online

// === LOGIKA UNTUK HALAMAN UTAMA (index.html) ===
let semuaKlenteng = []; // Akan menyimpan data yang ditampilkan
let map; 
let markers = []; 

const cardContainer = document.querySelector('.card-container');
const searchBar = document.getElementById('search-bar');
const mapContainer = document.getElementById('map');
const hamburgerBtn = document.getElementById('hamburger-btn');
const navWrapper = document.getElementById('nav-wrapper');

if (cardContainer && searchBar && mapContainer) {
    initMap();
    loadKlentengList();

    searchBar.addEventListener('input', (e) => {
        const kataKunci = e.target.value.toLowerCase();
        // Pencarian akan memfilter dari data yang sudah dimuat (50 data)
        const hasilFilter = semuaKlenteng.filter(klenteng => 
            klenteng.nama.toLowerCase().includes(kataKunci) || 
            (klenteng.kota && klenteng.kota.toLowerCase().includes(kataKunci))
        );
        displayKlenteng(hasilFilter);
    });
}

function initMap() {
    map = L.map('map').setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

// FUNGSI INI SUDAH DIMODIFIKASI DENGAN FILTER STATUS "TAYANG"
async function loadKlentengList() {
    try {
        const klentengCollection = collection(db, "klenteng");
        // Kueri baru: filter berdasarkan status "tayang" DAN batasi 50 data
        const q = query(klentengCollection, where("status", "==", "tayang"), limit(50));
        
        const querySnapshot = await getDocs(q);
        
        semuaKlenteng = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayKlenteng(semuaKlenteng);
    } catch (error) {
        console.error("Error loading klenteng list: ", error);
        cardContainer.innerHTML = "<p>Gagal memuat data. Mungkin perlu membuat index di Firestore. Cek konsol (F12) untuk link pembuatan index.</p>";
    }
}

function displayKlenteng(daftarKlenteng) {
    cardContainer.innerHTML = '';
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    if (daftarKlenteng.length === 0) {
        cardContainer.innerHTML = "<p>Tidak ada hasil yang ditemukan.</p>";
        return;
    }

    daftarKlenteng.forEach(klenteng => {
        const card = createKlentengCard(klenteng, klenteng.id);
        cardContainer.innerHTML += card;

        if (klenteng.lat && klenteng.lon) {
            const marker = L.marker([klenteng.lat, klenteng.lon]).addTo(map);
            marker.bindPopup(`<b>${klenteng.nama}</b><br><a href="detail.html?id=${klenteng.id}">Lihat Detail</a>`);
            markers.push(marker);
        }
    });
}

function createKlentengCard(data, id) {
    return `
        <a href="detail.html?id=${id}" style="text-decoration: none; color: inherit;">
            <div class="info-card">
                <img src="${data.imageUrl || 'https://via.placeholder.com/300x180.png?text=Info+Klenteng'}" alt="${data.nama}">
                <div class="info-card-content">
                    <h3>${data.nama}</h3>
                    <p>${data.kota || ''}, ${data.provinsi || ''}</p>
                </div>
            </div>
        </a>
    `;
}

// === LOGIKA UNTUK MENU HAMBURGER ===
if (hamburgerBtn && navWrapper) {
    hamburgerBtn.addEventListener('click', () => {
        navWrapper.classList.toggle('is-active');
    });
}

// === LOGIKA UNTUK HALAMAN DETAIL (detail.html) ===
const detailHeader = document.querySelector('.detail-header');
if (detailHeader) {
    const params = new URLSearchParams(window.location.search);
    const klentengId = params.get('id');
    if (klentengId) {
        loadKlentengDetail(klentengId);
    } else {
        document.querySelector('main.container').innerHTML = "<h1>Error: Klenteng tidak ditemukan.</h1>";
    }
}

async function loadKlentengDetail(id) {
    try {
        const docRef = doc(db, "klenteng", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            document.title = `${data.nama} - Info Klenteng`;
            document.querySelector('.detail-header h1').textContent = data.nama;
            document.querySelector('.detail-header p').textContent = data.alamat;
            
            const detailContent = document.querySelector('.detail-content');
            if (detailContent) {
                // Tampilkan deskripsi sebagai HTML, bukan teks biasa
                detailContent.innerHTML = `<h2>Detail</h2>${data.deskripsi || '<p>Tidak ada deskripsi.</p>'}`;
            }

            const detailImage = document.querySelector('.detail-image');
            if(detailImage) detailImage.src = data.imageUrl || 'https://via.placeholder.com/800x400.png?text=Info+Klenteng';
            
            const btnSalin = document.querySelector('.btn-primary');
            const btnMaps = document.querySelector('.btn-secondary');

            if (btnSalin) {
                btnSalin.addEventListener('click', () => {
                    navigator.clipboard.writeText(data.alamat).then(() => {
                        btnSalin.textContent = 'Berhasil Disalin!';
                        setTimeout(() => { btnSalin.textContent = 'Salin Alamat'; }, 2000);
                    });
                });
            }

            if (btnMaps) {
                btnMaps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.alamat)}`;
            }

        } else {
            document.querySelector('main.container').innerHTML = "<h1>Error: Klenteng tidak ditemukan.</h1>";
        }
    } catch (error) {
        console.error("Error loading klenteng detail: ", error);
    }
}
