"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ==========================================
// KOMPONEN KUSTOM: INPUT PENCARIAN (COMBOBOX)
// ==========================================
const SearchableInput = ({ value, onChange, options, placeholder, isUppercase = false, className = "", inputClassName = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const safeValue = value || "";
  const filtered = options.filter((opt) => 
    opt.toLowerCase().includes(safeValue.toLowerCase())
  );

  const handleTextChange = (e) => {
    const val = isUppercase ? e.target.value.toUpperCase() : e.target.value;
    onChange(val);
    setIsOpen(true);
  };

  // Gunakan styling default jika tidak ada inputClassName khusus yang dikirim
  const defaultInputClass = "w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none bg-slate-50";
  const finalInputClass = inputClassName || defaultInputClass;

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        className={finalInputClass}
        placeholder={placeholder}
        value={safeValue}
        onChange={handleTextChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        required
      />
      
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-2xl max-h-56 overflow-y-auto mt-1">
          {filtered.length !== options.length && (
            <li className="p-2 text-xs font-bold text-slate-400 bg-slate-50 border-b text-right">
              {filtered.length} ditemukan
            </li>
          )}
          {filtered.map((opt, i) => (
            <li 
              key={i} 
              className="p-3 text-sm hover:bg-indigo-100 hover:text-indigo-900 cursor-pointer border-b border-slate-100 last:border-b-0 text-slate-700 font-medium transition-colors"
              onMouseDown={(e) => {
                 e.preventDefault(); 
                 onChange(isUppercase ? opt.toUpperCase() : opt);
                 setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


// ==========================================
// HALAMAN UTAMA: INPUT DATA
// ==========================================
export default function InputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    noPrk: "", namaCustomer: "", tanggal: "", alamat: "",
    items: [{ kodeBarang: "", noSp: "", noPo: "", detailBarang: "", jumlahBarang: 1 }]
  });

  // STATE UNTUK MENYIMPAN DAFTAR REFERENSI
  const [references, setReferences] = useState({
    customers: [], alamats: [], kodes: [], details: [], rawStocks: []
  });

  // AMBIL DATA DARI DATABASE UNTUK REFERENSI
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [resStock, resShip] = await Promise.all([
          fetch("/api/stock"),
          fetch("/api/shipping")
        ]);
        
        const dataStock = resStock.ok ? await resStock.json() : { stocks: [] };
        const dataShip = resShip.ok ? await resShip.json() : { shippings: [] };

        const stocks = dataStock.stocks || [];
        const shippings = dataShip.shippings || [];

        // Kumpulkan data unik
        const customers = [...new Set([...stocks.map(s => s.namaCustomer), ...shippings.map(s => s.namaCustomer)])].filter(Boolean);
        const alamats = [...new Set(shippings.map(s => s.alamat))].filter(Boolean);
        const kodes = [...new Set(stocks.map(s => s.kodeBarang))].filter(Boolean);
        const details = [...new Set(stocks.map(s => s.detailBarang))].filter(Boolean);

        setReferences({ customers, alamats, kodes, details, rawStocks: stocks });
      } catch (error) {
        console.error("Gagal memuat referensi:", error);
      }
    };
    fetchReferences();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Berhasil! Data kiriman telah tersimpan dan stok disesuaikan.");
        setFormData({ 
          noPrk: "", namaCustomer: "", tanggal: "", alamat: "", 
          items: [{ kodeBarang: "", noSp: "", noPo: "", detailBarang: "", jumlahBarang: 1 }] 
        });
        router.push("/tracking");
      } else {
        alert(`❌ Gagal: ${result.message || "Terjadi kesalahan pada server"}`);
      }
    } catch (error) {
      alert("❌ Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { kodeBarang: "", noSp: "", noPo: "", detailBarang: "", jumlahBarang: 1 }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // LOGIKA AUTO-FILL: Otomatis isi detail barang jika kode barang dipilih dari referensi
    if (field === "kodeBarang") {
      const existingStock = references.rawStocks.find(s => s.kodeBarang === value);
      if (existingStock) {
        newItems[index].detailBarang = existingStock.detailBarang;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="flex justify-between items-center mb-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-500 hidden md:block">Sistem Ekspedisi</h1>
          <div className="flex gap-2 md:gap-4 flex-wrap justify-end">
            <Link href="/stock" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium px-4 py-2 rounded-xl transition-colors">📦 Stok Gudang</Link>
            <button className="bg-indigo-50 text-indigo-700 font-semibold px-4 py-2 rounded-xl cursor-default">✏️ Input Data</button>
            <Link href="/tracking" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-medium px-4 py-2 rounded-xl transition-colors">📍 Lihat Tracking</Link>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <h2 className="text-2xl font-bold mb-6 text-slate-700 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg text-sm">📝</span> Input Daftar Kirim Baru
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
              <input className="border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="No PRK" required value={formData.noPrk} onChange={(e) => setFormData({...formData, noPrk: e.target.value})} />
              
              {/* COMBOBOX CUSTOMER & ALAMAT */}
              <SearchableInput value={formData.namaCustomer} onChange={(val) => setFormData({...formData, namaCustomer: val})} options={references.customers} placeholder="Nama Customer" />
              <input className="border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-slate-600" type="date" required value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
              <SearchableInput value={formData.alamat} onChange={(val) => setFormData({...formData, alamat: val})} options={references.alamats} placeholder="Alamat Tujuan" />
            </div>

            {/* Pastikan menggunakan overflow-visible agar dropdown combobox tidak terpotong (clipped) di dalam tabel */}
            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-50 mb-6 overflow-visible">
              <h3 className="font-semibold text-indigo-900 mb-4">Detail Barang</h3>
              <div className="min-w-[700px]">
                {formData.items.map((item, idx) => (
                  // z-index dinamis (50 - idx) agar dropdown baris atas menutupi inputan baris bawahnya
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-3 relative" style={{ zIndex: 50 - idx }}>
                    
                    {/* COMBOBOX KODE BARANG */}
                    <SearchableInput 
                      className="col-span-2" 
                      inputClassName="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      value={item.kodeBarang} 
                      onChange={(val) => handleItemChange(idx, "kodeBarang", val)} 
                      options={references.kodes} 
                      placeholder="Kode Barang" 
                      isUppercase={true} 
                    />
                    
                    <input className="col-span-2 border border-slate-200 bg-white p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" placeholder="No SP (Opsional)" value={item.noSp} onChange={(e) => handleItemChange(idx, "noSp", e.target.value)} />
                    <input className="col-span-2 border border-slate-200 bg-white p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" placeholder="No PO (Opsional)" value={item.noPo} onChange={(e) => handleItemChange(idx, "noPo", e.target.value)} />
                    
                    {/* COMBOBOX DETAIL BARANG */}
                    <SearchableInput 
                      className="col-span-4" 
                      inputClassName="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      value={item.detailBarang} 
                      onChange={(val) => handleItemChange(idx, "detailBarang", val)} 
                      options={references.details} 
                      placeholder="Detail Barang" 
                    />

                    <input className="col-span-2 border border-slate-200 bg-white p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" type="number" placeholder="Jumlah" value={item.jumlahBarang} onChange={(e) => handleItemChange(idx, "jumlahBarang", e.target.value)} required />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItemRow} className="text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-lg mt-2 transition-colors">+ Tambah Baris Barang</button>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className={`bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all ${isSubmitting ? 'opacity-50' : ''}`}>
                {isSubmitting ? "Menyimpan Data..." : "Simpan Data Kiriman"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}