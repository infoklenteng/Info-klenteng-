function setupHead() {
    // --- SEO Meta Tags ---
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'Direktori Vihara dan Klenteng terlengkap di seluruh Indonesia. Temukan informasi, lokasi, dan sejarah tempat ibadah di sekitar Anda.';
    document.head.appendChild(metaDescription);

    // --- Google Analytics (Ganti dengan ID Anda) ---
    const gtagScript1 = document.createElement('script');
    gtagScript1.async = true;
    gtagScript1.src = 'https://www.googletagmanager.com/gtag/js?id=G-XMNTWC5HQD'; // ID dari config Anda
    document.head.appendChild(gtagScript1);

    const gtagScript2 = document.createElement('script');
    gtagScript2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XMNTWC5HQD');
    `;
    document.head.appendChild(gtagScript2);

    // --- Anda bisa tambahkan kode lain di sini (Google AdSense, Tag Manager, dll) ---
}

// Panggil fungsi ini saat dokumen dimuat
document.addEventListener('DOMContentLoaded', setupHead);


