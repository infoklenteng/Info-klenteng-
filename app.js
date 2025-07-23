// Import fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("app.js: Skrip dimulai."); // LOG 1

const firebaseConfig = {
  apiKey: "AIzaSyDnE-CN7YpFXGUh7qsGjsg8X8HL_dNgRDQ",
  authDomain: "info-klenteng.firebaseapp.com",
  projectId: "info-klenteng",
  storageBucket: "info-klenteng.firebasestorage.app",
  messagingSenderId: "1005532464216",
  appId: "1:1005532464216:web:8b9ce3edca8325e64a762d",
  measurementId: "G-XMNTWC5HQD"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("app.js: Firebase diinisialisasi."); // LOG 2

// === LOGIKA UNTUK HALAMAN UTAMA (index.html) ===
let semuaKlenteng = [];
let map; 
let markers = []; 

const cardContainer = document.querySelector('.card-container');
const searchBar = document.getElementById('search-bar');
const mapContainer = document.getElementById('map');

if (cardContainer && searchBar && mapContainer) {
    console.log("app.js: Berada di Halaman Utama. Memulai peta dan memuat data."); // LOG 3
    initMap();
    loadKlentengList();

    searchBar.addEventListener('input', (e) => {
        const kataKunci = e.target.value.toLowerCase();
        const hasilFilter = semuaKlenteng.filter(klenteng => 
            klenteng.nama.toLowerCase().includes(kataKunci) || klenteng.kota.toLowerCase().includes(kataKunci)
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
    console.log("app.js: Peta berhasil diinisialisasi."); // LOG 4
}

async function loadKlentengList() {
    try {
        console.log("app.js: Mencoba mengambil data dari Firestore..."); // LOG 5
        const querySnapshot = await getDocs(collection(db, "klenteng"));
        semuaKlenteng = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`app.js: Berhasil mengambil ${semuaKlenteng.length} data.`); // LOG 6
        console.log("Data pertama:", semuaKlenteng[0]); // LOG 7: Melihat data pertama
        displayKlenteng(semuaKlenteng);
    } catch (error) {
        console.error("app.js: Gagal mengambil data dari Firestore!", error); // LOG ERROR
        cardContainer.innerHTML = "<p>Gagal memuat data. Cek konsol untuk error.</p>";
    }
}

function displayKlenteng(daftarKlenteng) {
    console.log(`app.js: Menampilkan ${daftarKlenteng.length} klenteng.`); // LOG 8
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

// ... Sisa kode tidak berubah ...
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
// ... (Kode untuk halaman detail tetap sama) ...
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
    // ... (Fungsi ini tetap sama) ...
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

            btnMaps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.alamat)}`;

        } else {
            document.querySelector('main.container').innerHTML = "<h1>Error: Klenteng tidak ditemukan.</h1><p>Data untuk ID ini tidak ada.</p>";
        }
    } catch (error) {
        console.error("Error loading klenteng detail: ", error);
    }
}
