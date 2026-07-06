<?php

namespace App\Http\Controllers;

use App\Models\Product; // Pastikan nama Model sesuai (Single/Tunggal)
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Menyediakan data produk dalam bentuk JSON untuk JavaScript (Fetch API).
     * Menangani pencarian, filter kategori, dan pagination sekaligus.
     */
    public function getProdukData(Request $request)
    {
        // 1. Tangkap parameter dari URL query string JavaScript
        $search = $request->input('search');
        $category = $request->input('category');

        // 2. Inisialisasi query Builder dari Model Product
        $query = Product::query();

        // 3. LOGIKA FILTER KATEGORI
        // Jika kategori yang dipilih bukan "ALL", lakukan filter berdasarkan kolom 'kategori'
        if ($category && $category !== 'ALL') {
            $query->where('kategori', $category);
        }

        // 4. LOGIKA PENCARIAN (SEARCH)
        // Jika ada keyword pencarian, cari yang mirip di kolom nama, ukm, atau merek
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama', 'LIKE', '%' . $search . '%')
                  ->orWhere('ukm', 'LIKE', '%' . $search . '%')
                  ->orWhere('merek', 'LIKE', '%' . $search . '%');
            });
        }

        // 5. PAGINATION OTOMATIS LARAVEL
        // Ambil data dari database sebanyak 6 baris per halaman.
        // Laravel otomatis membaca parameter '?page=' dari URL untuk menentukan OFFSET data.
        $products = $query->paginate(6);

        // 6. KEMBALIKAN RESPONS JSON
        // Data ini langsung membawa informasi 'data', 'total', 'from', 'to', dan 'last_page'
        return response()->json($products);
    }
}