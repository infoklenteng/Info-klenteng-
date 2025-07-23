// =======================================================
// KODE FINAL DENGAN PERBAIKAN
// =======================================================

function mobileLog(message, isError = false) {
    const consoleDiv = document.getElementById('mobile-console');
    if (consoleDiv) {
        const p = document.createElement('p');
        p.textContent = `> ${message}`;
        if (isError) { p.className = 'error'; }
        consoleDiv.appendChild(p);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
    if (isError) { console.error(message); } else { console.log(message); }
}

mobileLog("app.js: Memulai mode tes...");

// BARU: Tambahkan 'enableNetwork' di sini
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, enableNetwork } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArH0RoIFSblsanJiTKqNdCRqeU31fHjGw", // API Key Anda yang valid
  authDomain: "info-klenteng.firebaseapp.com",
  projectId: "info-klenteng",
  storageBucket: "info-klenteng.firebasestorage.app",
  messagingSenderId: "1005532464216",
  appId: "1:1005532464216:web:8b9ce3edca8325e64a762d",
  measurementId: "G-XMNTWC5HQD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
mobileLog("app.js: Firebase diinisialisasi.");

// =================================
// BARU: Tambahkan baris ini untuk memaksa koneksi online
enableNetwork(db);
mobileLog("app.js: Koneksi jaringan dipaksa aktif.");
// =================================


// FUNGSI TES
async function testFetchSingleDocument() {
    const docId = "C72W92wvi6DILYyyQNZz"; 

    mobileLog(`Mencoba mengambil dokumen dengan ID: ${docId}`);

    try {
        const docRef = doc(db, "klenteng", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            mobileLog("BERHASIL! Dokumen ditemukan.", false);
            console.log("Data dokumen:", docSnap.data());
        } else {
            mobileLog("GAGAL! Dokumen dengan ID tersebut tidak ada.", true);
        }
    } catch (error) {
        mobileLog(`ERROR: ${error.message}`, true);
    }
}

// Panggil fungsi tes saat halaman dimuat
testFetchSingleDocument();
