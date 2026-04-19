"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ==========================================
// KOMPONEN KUSTOM: INPUT PENCARIAN (COMBOBOX)
// DIPERBAIKI: Tanpa useEffect, filtering instan, kebal re-render
// ==========================================
const SearchableInput = ({ value, onChange, options, placeholder, isUppercase = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // LOGIKA FILTER INSTAN: 
  // Ambil nilai yang diketik, pastikan tidak undefined, lalu saring opsi
  const safeValue = value || "";
  const filtered = options.filter((opt) => 
    opt.toLowerCase().includes(safeValue.toLowerCase())
  );

  const handleTextChange = (e) => {
    const val = isUppercase ? e.target.value.toUpperCase() : e.target.value;
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="text"
        className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        placeholder={placeholder}
        value={safeValue}
        onChange={handleTextChange}
        onFocus={() => setIsOpen(true)}
        // Timeout mencegah list tertutup sebelum klik list terdeteksi
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        required
      />
      
      {/* TAMPILKAN LIST HANYA JIKA DIBUKA DAN ADA HASIL FILTER */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-2xl max-h-56 overflow-y-auto mt-1">
          {/* Tampilkan keterangan jika data filter lebih sedikit dari total data (opsional) */}
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
                 // Gunakan onMouseDown sebagai pengganti onClick agar tidak kalah cepat dengan onBlur
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
      
      {/* Tampilkan info jika tidak ada yang cocok */}
      {isOpen && safeValue !== "" && filtered.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 p-3 text-sm text-slate-400 italic text-center">
          "{safeValue}" belum ada di referensi, akan disimpan sebagai baru.
        </div>
      )}
    </div>
  );
};

// ==========================================
// HALAMAN UTAMA STOK GUDANG
// ==========================================
export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ 
    namaCustomer: "", kodeBarang: "", detailBarang: "", noSp: "", noPo: "", stok: "", coa: false 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStocks = async () => {
    try {
      const res = await fetch("/api/stock");
      if(!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setStocks(data.stocks || []);
    } catch (error) { setStocks([]); }
  };

  useEffect(() => { fetchStocks(); }, []);

  // 1. EKSTRAK DAFTAR REFERENSI DARI DATABASE
  const customerList = [...new Set(stocks.map(s => s.namaCustomer))].filter(Boolean);
  const kodeList = [...new Set(stocks.map(s => s.kodeBarang))].filter(Boolean);
  const detailList = [...new Set(stocks.map(s => s.detailBarang))].filter(Boolean);

  // 2. LOGIKA AUTO-FILL SAAT INPUT
  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === "kodeBarang") {
        const existingStock = stocks.find(s => s.kodeBarang === value);
        if (existingStock) newData.detailBarang = existingStock.detailBarang;
      }
      return newData;
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if(res.ok) {
      alert("✅ Stok berhasil ditambahkan!");
      setFormData({ namaCustomer: "", kodeBarang: "", detailBarang: "", noSp: "", noPo: "", stok: "", coa: false });
      fetchStocks();
    }
    setIsSubmitting(false);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...editData };
    delete payload._id; delete payload.createdAt; delete payload.updatedAt;

    const res = await fetch(`/api/stock/${editData._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if(res.ok) {
      alert("✅ Perubahan stok berhasil disimpan!");
      setEditData(null);
      fetchStocks();
    }
    setIsSubmitting(false);
  };

  const toggleCoa = async (id, currentCoa) => {
    const newValue = !currentCoa;
    setStocks(prev => prev.map(s => s._id === id ? { ...s, coa: newValue } : s));
    await fetch(`/api/stock/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coa: newValue })
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6 text-slate-800 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 mb-6">
          <Link href="/" className="bg-white border shadow-sm px-4 py-2 rounded-lg font-medium hover:bg-slate-100">🔙 Kembali</Link>
        </div>

        {/* FORM INPUT STOK */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-8 overflow-visible">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700 font-sans">📦 Input Stok Gudang</h2>
          <form onSubmit={handleSubmitNew} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* IMPLEMENTASI SEARCHABLE INPUT */}
            <SearchableInput value={formData.namaCustomer} onChange={(val) => handleFormChange("namaCustomer", val)} options={customerList} placeholder="Nama Customer" />
            <SearchableInput value={formData.kodeBarang} onChange={(val) => handleFormChange("kodeBarang", val)} options={kodeList} placeholder="Kode Barang" isUppercase={true} />
            <SearchableInput value={formData.detailBarang} onChange={(val) => handleFormChange("detailBarang", val)} options={detailList} placeholder="Detail Barang" className="md:col-span-2" />
            
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" placeholder="No SP" required value={formData.noSp} onChange={(e) => handleFormChange("noSp", e.target.value)} />
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" placeholder="No PO" required value={formData.noPo} onChange={(e) => handleFormChange("noPo", e.target.value)} />
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" type="number" placeholder="Jumlah" required value={formData.stok} onChange={(e) => handleFormChange("stok", e.target.value)} />
            
            <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={formData.coa} onChange={(e) => handleFormChange("coa", e.target.checked)} />
              <span className="text-sm font-bold text-slate-700">COA Tersedia</span>
            </label>

            <button type="submit" disabled={isSubmitting} className="md:col-span-4 bg-indigo-600 text-white font-bold py-3.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md mt-2">
              {isSubmitting ? "Menyimpan..." : "Simpan Stok Baru"}
            </button>
          </form>
        </div>

        {/* TABEL STOK */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">Daftar Stok & Dokumen</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 border-b">Customer</th>
                  <th className="p-3 border-b">Kode Barang</th>
                  <th className="p-3 border-b">Detail</th>
                  <th className="p-3 border-b">SP / PO</th>
                  <th className="p-3 border-b text-center">COA</th>
                  <th className="p-3 border-b text-center">Stok</th>
                  <th className="p-3 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-b font-semibold text-slate-700">{s.namaCustomer}</td>
                    <td className="p-3 border-b font-bold text-indigo-600">{s.kodeBarang}</td>
                    <td className="p-3 border-b text-sm">{s.detailBarang}</td>
                    <td className="p-3 border-b text-xs">
                      <span className="bg-slate-100 px-2 py-1 rounded border">SP: {s.noSp}</span><br/>
                      <span className="bg-slate-100 px-2 py-1 rounded border mt-1 inline-block">PO: {s.noPo}</span>
                    </td>
                    <td className="p-3 border-b text-center">
                      <input type="checkbox" className="w-5 h-5 cursor-pointer text-indigo-600" checked={s.coa || false} onChange={() => toggleCoa(s._id, s.coa)} />
                    </td>
                    <td className={`p-3 border-b text-center font-bold text-lg ${s.stok <= 0 ? 'text-red-500' : 'text-green-600'}`}>{s.stok}</td>
                    <td className="p-3 border-b text-center">
                      <button onClick={() => setEditData(s)} className="text-sm bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-100 font-semibold transition-all">Edit</button>
                    </td>
                  </tr>
                ))}
                {stocks.length === 0 && (
                  <tr><td colSpan="7" className="p-6 text-center text-slate-400">Belum ada data stok di gudang.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL EDIT STOK */}
      {editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full overflow-visible">
            <h2 className="text-2xl font-bold mb-6">Edit Data Stok</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 mb-1 block">CUSTOMER</label>
                <SearchableInput value={editData.namaCustomer} onChange={(val) => handleEditChange("namaCustomer", val)} options={customerList} placeholder="Nama Customer" />
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 mb-1 block">KODE BARANG</label>
                <SearchableInput value={editData.kodeBarang} onChange={(val) => handleEditChange("kodeBarang", val)} options={kodeList} placeholder="Kode Barang" isUppercase={true} />
              </div>
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 mb-1 block">DETAIL BARANG</label>
                <SearchableInput value={editData.detailBarang} onChange={(val) => handleEditChange("detailBarang", val)} options={detailList} placeholder="Detail Barang" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">NO SP</label>
                  <input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50" value={editData.noSp} onChange={(e) => handleEditChange("noSp", e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">NO PO</label>
                  <input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50" value={editData.noPo} onChange={(e) => handleEditChange("noPo", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">SISA STOK</label>
                <input type="number" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50" value={editData.stok} onChange={(e) => handleEditChange("stok", e.target.value)} required />
              </div>
              
              <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditData(null)} className="flex-1 px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all">
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}