
    // 1. VARIABEL GLOBAL (Disesuaikan)
    // Kita tidak perlu lagi menyimpan 'productsData' raksasa di browser.
    let filteredProducts = []; 
    let currentCategory = "ALL";
    let currentPage = 1;
    // Jumlah item per halaman dikontrol langsung dari Controller Laravel (6 data).

    function getNavbarCollapseInstance() {
        const navbarCollapse = document.getElementById('navbarNav');
        return bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false });
    }

    // 2. FUNGSI LOAD DATA (Diubah)
    // Menggantikan fungsi 'loadProductsData' lama. Sekarang langsung memanggil fungsi filter.
    async function loadProductsData() {
        const hash = window.location.hash;
        if (hash === '#produk') {
            executeFilterAndSearch();
        }
        checkUrlHash();
    }

    function navigateToPage(pageId) {
        document.getElementById('page-home').classList.add('d-none');
        document.getElementById('page-produk').classList.add('d-none');
        document.getElementById('page-kunjungi').classList.add('d-none');
        document.getElementById('nav-home').classList.remove('active');
        document.getElementById('nav-produk').classList.remove('active');
        document.getElementById('nav-kunjungi').classList.remove('active');
        
        const pageNode = document.getElementById('page-' + pageId);
        const navNode = document.getElementById('nav-' + pageId);
        if(pageNode) pageNode.classList.remove('d-none');
        if(navNode) navNode.classList.add('active');
        
        window.location.hash = pageId;
        
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) getNavbarCollapseInstance().hide();
        
        if(pageId === 'produk') { 
            currentPage = 1; 
            executeFilterAndSearch(); 
        }
    }

    // 3. FUNGSI UTAMA FETCH & FILTER DATABASE (BARU & DIGABUNGKAN)
    // Menghilangkan logika `.filter()` dan `.slice()` manual di JS.
    async function executeFilterAndSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchValue = searchInput ? searchInput.value : "";
        
        try {
            // Mengirim request dinamis ke Laravel dengan query string
            const response = await fetch(`/get-produk?page=${currentPage}&category=${encodeURIComponent(currentCategory)}&search=${encodeURIComponent(searchValue)}`);
            
            if (!response.ok) throw new Error(`Gagal memuat data (Status: ${response.status})`);
            
            const result = await response.json();
            
            // Menyimpan 6 data dari Laravel ke dalam array terfilter
            filteredProducts = result.data; 
            
            // Render kartu produk dengan data dari server
            renderProducts(filteredProducts, result.total, result.from, result.to);
            
            // Render pagination berdasarkan total halaman dari Laravel
            renderPagination(result.last_page);
            
        } catch (error) {
            console.error("Waduh, terjadi masalah saat memuat data database:", error);
            const grid = document.getElementById('productGrid');
            if(grid) grid.innerHTML = `<div class="col-12 text-center text-danger py-5"><h5>Gagal memuat data produk dari server.</h5></div>`;
        }
    }

    // 4. RENDER PRODUK (Disesuaikan Parameter Rentang Rentang Halaman)
    // Logika matematika pembagian indeks di JS DIHAPUS karena sudah dihitung oleh Laravel.
    function renderProducts(data, totalItems, fromItem, toItem) {
        const rangeSpan = document.getElementById('productRangeCount');
        const rangeSpanBottom = document.getElementById('productRangeCountBottom');
        
        if (rangeSpan || rangeSpanBottom) {
            if (data.length === 0) {
                rangeSpan.innerHTML = `Menampilkan <span class="fw-bold">0</span> produk`;
                rangeSpanBottom.innerHTML = `Menampilkan <span class="fw-bold">0</span> produk`;
            } else {
                // Langsung mengambil variabel dari pagination Laravel
                rangeSpan.innerHTML = `Menampilkan <strong>${fromItem} - ${toItem}</strong> dari <strong>${totalItems}</strong> produk`;
                rangeSpanBottom.innerHTML = `Menampilkan <strong>${fromItem} - ${toItem}</strong> dari <strong>${totalItems}</strong> produk`;
            }
        }
        
        const grid = document.getElementById('productGrid');
        if(!grid) return;
        grid.innerHTML = "";
        
        if(data.length === 0) {
            grid.innerHTML = `<div class="col-12 text-center text-muted py-5"><h5>Produk tidak ditemukan.</h5></div>`;
            return;
        }

        // Looping langsung berjalan tanpa .slice()
        data.forEach(prod => {
            let medsosButtonsHTML = "";
            if (prod.medsos && prod.medsos.length > 0) {
                prod.medsos.forEach(item => {
                    let iconClass = "bi-globe";
                    let btnClass = "btn-outline-secondary";
                    let platformName = item.platform.charAt(0).toUpperCase() + item.platform.slice(1);
                    switch (item.platform.toLowerCase()) {
                        case 'instagram': case 'ig': iconClass = "bi-instagram"; btnClass = "btn-outline-danger"; break;
                        case 'facebook':  case 'fb': iconClass = "bi-facebook";  btnClass = "btn-outline-primary"; break;
                        case 'website':   case 'web': iconClass = "bi-globe";    btnClass = "btn-outline-success"; break;
                        case 'whatsapp':  case 'wa': iconClass = "bi-whatsapp";  btnClass = "btn-outline-success"; break;
                    }
                    if(item.url) medsosButtonsHTML += `<a href="${item.url}" target="_blank" class="btn btn-sm ${btnClass} d-inline-flex align-items-center"><i class="bi ${iconClass} me-1"></i> ${platformName}</a>`;
                });
            }
            
            const namaAman = prod.nama.replace(/'/g, "\\'");
            const merekAman = prod.merek ? prod.merek.replace(/'/g, "\\'") : '';
            
            grid.innerHTML += `
            <div class="col-12 col-sm-6 col-lg-4 mb-4">
                <div class="card h-100 custom-card product-card position-relative bg-white d-flex flex-column">
                    <span class="prod-kat-label">
                        <i class="bi bi-layers-fill" style="font-size:0.65rem;"></i> ${prod.kategori}
                    </span>
                    <img src="${prod.image}" class="card-img-top" alt="${prod.nama}" style="cursor:pointer;" onclick="zoomImage('${prod.image}', '${namaAman}${merekAman ? ' (' + merekAman + ')' : ''}')" title="Klik untuk memperbesar">
                    <div class="card-body d-flex flex-column p-4">
                        <p class="ukm-label mb-2"><i class="bi bi-building me-1"></i>${prod.ukm}</p>
                        <h4 class="prod-name">${prod.nama}</h4>
                        ${prod.merek ? `<div class="mb-3 mt-1"><span class="badge-merek"><i class="bi bi-tag-fill" style="font-style:normal;"></i> ${prod.merek}</span></div>` : ''}
                        <div class="prod-detail-box flex-grow-1">
                            <p class="mb-2"><strong><i class="bi bi-patch-check-fill text-warning me-1"></i> Menerapkan:</strong><br><span class="text-muted">${prod.judulSni || "-"}</span></p>
                            <p class="mb-0"><strong><i class="bi bi-geo-alt-fill text-danger me-1"></i> Alamat:</strong><br><span class="text-muted">${prod.alamat || "-"}</span></p>
                        </div>
                        ${medsosButtonsHTML ? `<div class="border-top pt-3 mt-auto"><span class="small text-muted d-block mb-2">Hubungi Mitra:</span><div class="d-flex flex-wrap gap-2">${medsosButtonsHTML}</div></div>` : ''}
                    </div>
                </div>
            </div>`;
        });
    }

    // 5. RENDER PAGINATION (Disesuaikan Parameter)
    // Sekarang menerima variabel 'totalPages' langsung dari total halaman maksimum milik Laravel
    function renderPagination(totalPages) {
        let paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) {
            const grid = document.getElementById('productGrid');
            if(!grid) return;
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'paginationContainer';
            paginationContainer.className = 'd-flex justify-content-center mt-4';
            grid.parentNode.insertBefore(paginationContainer, grid.nextSibling);
        }
        
        if (totalPages <= 1) { paginationContainer.innerHTML = ""; return; }
        
        let paginationHTML = `<nav aria-label="Navigasi Halaman"><ul class="pagination mb-0 gap-1">`;
        paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><button class="page-link rounded-3" onclick="changePage(${currentPage - 1})" aria-label="Sebelumnya"><i class="bi bi-chevron-left"></i></button></li>`;
        
        const range = 1;
        let renderEllipsis = true;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
                paginationHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}"><button class="page-link rounded-3 fw-semibold" onclick="changePage(${i})">${i}</button></li>`;
                renderEllipsis = true;
            } else if (renderEllipsis) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link border-0 bg-transparent text-muted">...</span></li>`;
                renderEllipsis = false;
            }
        }
        paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><button class="page-link rounded-3" onclick="changePage(${currentPage + 1})" aria-label="Selanjutnya"><i class="bi bi-chevron-right"></i></button></li>`;
        paginationHTML += `</ul></nav>`;
        paginationContainer.innerHTML = paginationHTML;
    }

    function changePage(pageNumber) {
        currentPage = pageNumber;
        executeFilterAndSearch(); // Panggil data halaman baru dari server Laravel
        const productPage = document.getElementById('page-produk');
        if(productPage) productPage.scrollIntoView({ behavior: 'smooth' });
    }

    function filterCategory(category, element) {
        currentCategory = category;
        const buttons = document.querySelectorAll('#categoryTabs .nav-link');
        buttons.forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
        currentPage = 1; // Reset ke halaman 1 setiap ganti kategori
        executeFilterAndSearch();
    }

    function searchProduct() {
        currentPage = 1; // Reset ke halaman 1 setiap mengetik pencarian baru
        executeFilterAndSearch();
    }

    function checkUrlHash() {
        const hash = window.location.hash;
        if (hash === '#produk') navigateToPage('produk');
        else if (hash === '#kunjungi') navigateToPage('kunjungi');
        else navigateToPage('home');
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById('currentYear').innerText = new Date().getFullYear();
        loadProductsData();
        window.addEventListener('hashchange', checkUrlHash);
        document.addEventListener('click', function (event) {
            const navbarCollapse = document.getElementById('navbarNav');
            const toggleButton = document.querySelector('.navbar-toggler');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                if (!navbarCollapse.contains(event.target) && !toggleButton.contains(event.target)) getNavbarCollapseInstance().hide();
            }
        });
    });

    function zoomImage(imageSrc, productName) {
        document.getElementById('modalZoomImage').src = imageSrc;
        document.getElementById('modalZoomCaption').innerText = productName;
        const zoomModal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
        zoomModal.show();
    }
