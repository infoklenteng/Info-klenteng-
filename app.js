// app.js (Versi Bersih)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, enableNetwork } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD20pmKLS-camDW4Fupu23qwzPK6R1AplY",
  authDomain: "info-klenteng-df46f.firebaseapp.com",
  projectId: "info-klenteng-df46f",
  storageBucket: "info-klenteng-df46f.firebasestorage.app",
  messagingSenderId: "416766280539",
  appId: "1:416766280539:web:c40c1f7903d87b0558507e",
  measurementId: "G-M21P3MZN96"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
enableNetwork(db); // Paksa koneksi online

// === LOGIKA UNTUK HALAMAN UTAMA (index.html) ===
let semuaKlenteng = [];
let map; 
let markers = []; 

const cardContainer = document.querySelector('.card-container');
const searchBar = document.getElementById('search-bar');
const mapContainer = document.getElementById('map');

if (cardContainer && searchBar && mapContainer) {
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
}

async function loadKlentengList() {
    try {
        const querySnapshot = await getDocs(collection(db, "klenteng"));
        semuaKlenteng = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayKlenteng(semuaKlenteng);
    } catch (error) {
        console.error("Error loading klenteng list: ", error);
        cardContainer.innerHTML = "<p>Gagal memuat data. Cek konsol untuk error.</p>";
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
