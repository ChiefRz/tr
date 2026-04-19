"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    noPrk: "", tanggal: "", alamat: "",
    // UPDATE: Tambahkan kodeBarang di sini
    items: [{ kodeBarang: "", noSp: "", noPo: "", detailBarang: "", jumlahBarang: 1 }]
  });

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
        alert("✅ Berhasil! Data kiriman telah tersimpan dan stok telah dikurangi.");
        setFormData({ 
          noPrk: "", tanggal: "", alamat: "", 
          items: [{ kodeBarang: "", noSp: "", noPo: "", detailBarang: "", jumlahBarang: 1 }] 
        });
        router.push("/tracking");
      } else {
        // Akan menampilkan pesan jika stok kurang
        alert(`❌ Gagal: ${result.message || "Terjadi kesalahan pada server"}`);
      }
    } catch (error) {
      alert("❌ Terjadi kesalahan koneksi. Pastikan internet stabil.");
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
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* NAVIGASI */}
        <div className="flex justify-between items-center mb-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex gap-2 md:gap-4 flex-wrap justify-end">
            <Link href="/stock" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium px-4 py-2 rounded-xl transition-colors">
              Stok Gudang
            </Link>
            <button className="bg-indigo-50 text-indigo-700 font-semibold px-4 py-2 rounded-xl cursor-default">
              Input Data
            </button>
            <Link href="/tracking" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-medium px-4 py-2 rounded-xl transition-colors">
              Lihat Tracking
            </Link>
          </div>
        </div>

        {/* FORM INPUT */}
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <h2 className="text-2xl font-bold mb-6 text-slate-700 flex items-center gap-2"> 
            Input Daftar Kirim Baru
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <input className="border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="No PRK" required
                value={formData.noPrk} onChange={(e) => setFormData({...formData, noPrk: e.target.value})} />
              <input className="border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-slate-600" type="date" required
                value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
              <input className="border border-slate-200 bg-slate-50 p-3 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Alamat Tujuan" required
                value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} />
            </div>

            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-50 mb-6 overflow-x-auto">
              <h3 className="font-semibold text-indigo-900 mb-4">Detail Barang (Multi SP/PO)</h3>
              
              <div className="min-w-[600px]">
                {formData.items.map((item, idx) => (
                  // UPDATE: Ubah menjadi grid-cols-5
                  <div key={idx} className="grid grid-cols-5 gap-3 mb-3">
                    <input className="border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Kode Barang" 
                      value={item.kodeBarang} onChange={(e) => handleItemChange(idx, "kodeBarang", e.target.value.toUpperCase())} required />
                    <input className="border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="No SP" 
                      value={item.noSp} onChange={(e) => handleItemChange(idx, "noSp", e.target.value)}  />
                    <input className="border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="No PO" 
                      value={item.noPo} onChange={(e) => handleItemChange(idx, "noPo", e.target.value)}  />
                    <input className="border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="Detail Barang" 
                      value={item.detailBarang} onChange={(e) => handleItemChange(idx, "detailBarang", e.target.value)} required />
                    <input className="border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" type="number" placeholder="Jumlah" 
                      value={item.jumlahBarang} onChange={(e) => handleItemChange(idx, "jumlahBarang", e.target.value)} required />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 inline-block">
                <button type="button" onClick={addItemRow} className="text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-lg transition-colors">
                  + Tambah Baris Barang
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? "Sedang Memeriksa Stok..." : "Simpan Data Kiriman"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}