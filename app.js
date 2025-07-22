// Import fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Ganti dengan konfigurasi proyek Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSy...YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "1:your-sender-id:web:your-app-id"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === LOGIKA UNTUK HALAMAN UTAMA (index.html) ===

let semuaKlenteng = [];
let map; // BARU: Variabel untuk menyimpan objek peta
let markers = []; // BARU: Array untuk menyimpan semua marker

const cardContainer = document.querySelector('.card-container');
const searchBar = document.getElementById('search-bar');
const mapContainer = document.getElementById('map');

// Cek jika elemen-elemen untuk halaman utama ada
if (cardContainer && searchBar && mapContainer) {
    // BARU: Inisialisasi Peta
    initMap();
    
    loadKlentengList();

    searchBar.addEventListener('input', (e) => {
        const kataKunci = e.target.value.toLowerCase();
        const hasilFilter = semuaKlenteng.filter(klenteng => {
            return klenteng.nama.toLowerCase().includes(kataKunci) || klenteng.kota.toLowerCase().includes(kataKunci);
        });
        displayKlenteng(hasilFilter);
    });
}

// BARU: Fungsi untuk inisialisasi peta
function initMap() {
    map = L.map('map').setView([-2.5489, 118.0149], 5); // Set view ke tengah Indonesia
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

async function loadKlentengList() {
    try {
        const querySnapshot = await getDocs(collection(db, "klenteng"));
        semuaKlenteng = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayKlenteng(semuaKlenteng);
    } catch (error) {
        console.error("Error loading klenteng list: ", error);
        cardContainer.innerHTML = "<p>Gagal memuat data. Silakan coba lagi nanti.</p>";
    }
}

function displayKlenteng(daftarKlenteng) {
    cardContainer.innerHTML = '';
    
    // BARU: Hapus marker lama dari peta
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    if (daftarKlenteng.length === 0) {
        cardContainer.innerHTML = "<p>Tidak ada hasil yang ditemukan.</p>";
        return;
    }

    daftarKlenteng.forEach(klenteng => {
        // Tampilkan kartu
        const card = createKlentengCard(klenteng, klenteng.id);
        cardContainer.innerHTML += card;

        // BARU: Tambahkan marker ke peta jika ada koordinat
        if (klenteng.lat && klenteng.lon) {
            const marker = L.marker([klenteng.lat, klenteng.lon]).addTo(map);
            // Tambahkan popup dengan link ke halaman detail
            marker.bindPopup(`<b>${klenteng.nama}</b><br><a href="detail.html?id=${klenteng.id}">Lihat Detail</a>`);
            markers.push(marker); // Simpan marker ke array
        }
    });
}

// ... Sisa kode (createKlentengCard, logika halaman detail) tetap sama ...
function createKlentengCard(data, id) {
    return `
        <a href="detail.html?id=${id}" style="text-decoration: none; color: inherit;">
            <div class="info-card">
                <img src="${data.imageUrl || 'https://via.placeholder.com/300x180.png?text=Info+Klenteng'}" alt="${data.nama}">
                <div class="info-card-content">
                    <h3>${data.nama}</h3>
                    <p>${data.kota}, ${data.provinsi}</p>
                </div>
            </div>
        </a>
    `;
}

// === LOGIKA UNTUK HALAMAN DETAIL (detail.html) ===
const detailHeader = document.querySelector('.detail-header');
if (detailHeader) {
    const params = new URLSearchParams(window.location.search);
    const klentengId = params.get('id');
    if (klentengId) {
        loadKlentengDetail(klentengId);
    } else {
        document.querySelector('main.container').innerHTML = "<h1>Error: Klenteng tidak ditemukan.</h1><p>ID tidak valid.</p>";
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
            document.querySelector('.detail-content p').textContent = data.deskripsi;
            const detailImage = document.querySelector('.detail-image');
            if(detailImage) detailImage.src = data.imageUrl || 'https://via.placeholder.com/800x400.png?text=Info+Klenteng';
            
            const btnSalin = document.querySelector('.btn-primary');
            const btnMaps = document.querySelector('.btn-secondary');

            btnSalin.addEventListener('click', () => {
                navigator.clipboard.writeText(data.alamat).then(() => {
                    btnSalin.textContent = 'Berhasil Disalin!';
                    setTimeout(() => { btnSalin.textContent = 'Salin Alamat'; }, 2000);
                });
            });

            btnMaps.href = `https://maps.google.com/?q=${encodeURIComponent(data.alamat)}`;

        } else {
            document.querySelector('main.container').innerHTML = "<h1>Error: Klenteng tidak ditemukan.</h1><p>Data untuk ID ini tidak ada.</p>";
        }
    } catch (error) {
        console.error("Error loading klenteng detail: ", error);
    }
}
