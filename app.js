// =======================================================
// KODE KHUSUS UNTUK TES - GANTI SEMUA ISI app.js DENGAN INI
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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  // GANTI DENGAN API KEY ANDA YANG VALID
  apiKey: "AIzaSyArH0RoIFSblsanJiTKqNdCRqeU31fHjGw", 
  
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
// FUNGSI TES
// =================================
async function testFetchSingleDocument() {
    // INI ADALAH BAGIAN YANG PERLU ANDA EDIT
    // Pastikan ID ini sama dengan yang ada di Firestore Anda
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
 
