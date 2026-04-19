"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function TrackingPage() {
  const [shippings, setShippings] = useState([]);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchShippings = async () => {
    try {
      const res = await fetch("/api/shipping");
      
      // Cek apakah balasan dari server valid (status 200-299)
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setShippings(data.shippings || []);
    } catch (error) {
      console.error("❌ Gagal memuat data:", error.message);
      setShippings([]); // Berikan array kosong agar UI tidak rusak
    }
  };

  useEffect(() => { fetchShippings(); }, []);

  const toggleStatus = async (id, currentData, fieldTarget, subField = null) => {
    const newValue = subField ? !currentData[fieldTarget]?.[subField] : !currentData[fieldTarget];
    setShippings((prev) => prev.map((ship) => {
      if (ship._id === id) {
        if (subField) return { ...ship, [fieldTarget]: { ...(ship[fieldTarget] || {}), [subField]: newValue } };
        return { ...ship, [fieldTarget]: newValue };
      }
      return ship;
    }));

    const payload = {};
    if (subField) payload[`${fieldTarget}.${subField}`] = newValue;
    else payload[fieldTarget] = newValue;

    try {
      await fetch(`/api/shipping/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (error) {
      alert("Gagal menyimpan perubahan ke database");
      fetchShippings();
    }
  };

  const handleEditChange = (field, value) => setEditData({ ...editData, [field]: value });
  
  const handleEditItemChange = (index, field, value) => {
    const newItems = [...editData.items];
    newItems[index][field] = value;
    setEditData({ ...editData, items: newItems });
  };

  const addEditItemRow = () => {
    setEditData({ ...editData, items: [...editData.items, { kodeBarang: "", noSp: "", noPo: "", detailBarang: "", jumlahBarang: 1 }] });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = { ...editData };
    delete payload._id; 
    delete payload.createdAt; 
    delete payload.updatedAt;

    try {
      const res = await fetch(`/api/shipping/${editData._id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const result = await res.json(); // Ambil respon dari server
      
      if (res.ok) { 
        setEditData(null); 
        fetchShippings(); 
        alert("✅ Perubahan tersimpan dan stok berhasil diperbarui!");
      } else {
        // MUNCULKAN ERROR JIKA STOK KURANG SAAT EDIT
        alert(`❌ Gagal Menyimpan: ${result.message}`); 
      }
    } catch (error) { 
      alert("❌ Terjadi kesalahan jaringan saat menyimpan perubahan."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const checkCoaEligibility = (items) => {
    if (!items || items.length === 0) return false;
    const keywords = ["sriboga", "berill", "gula putih mataram"];
    return items.some(item => {
      const detail = (item.detailBarang || "").toLowerCase();
      return keywords.some(keyword => detail.includes(keyword));
    });
  };

  const pendingShippings = shippings.filter((ship) => !ship.isTerkirim);
  const completedShippings = shippings.filter((ship) => ship.isTerkirim);

  const ShippingCard = ({ ship, isCompleted }) => {
    const isCoaEligible = checkCoaEligibility(ship.items);
    return (
      <div className={`group border border-slate-100 p-5 rounded-2xl shadow-sm transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 ${isCompleted ? 'bg-slate-50/50 opacity-80' : 'bg-gradient-to-r from-white to-slate-50 hover:shadow-md'}`}>
        <div className="flex-1 relative">
          <button onClick={() => setEditData(ship)} className="absolute top-0 right-0 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg font-semibold transition-colors">
            Edit Data
          </button>

          <div className="flex items-baseline gap-2 mb-1 pr-24">
            <h3 className={`font-bold text-xl ${isCompleted ? 'text-slate-600 line-through' : 'text-indigo-900'}`}>PRK: {ship.noPrk}</h3>
            <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{new Date(ship.tanggal).toLocaleDateString('id-ID')}</span>
          </div>
          <p className="text-slate-600 mb-4 flex items-center gap-1"><span className="text-red-400">📍</span> {ship.alamat}</p>
          
          <div className={`p-3 rounded-xl border shadow-sm ${isCompleted ? 'bg-slate-100/50' : 'bg-white'}`}>
            <ul className="text-sm space-y-1 text-slate-700">
              {ship.items.map((it, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-slate-400' : 'bg-indigo-300'}`}></span>
                  {/* UPDATE: Menampilkan Kode Barang */}
                  <span className="font-bold text-slate-800">[{it.kodeBarang || "N/A"}]</span> <span className="text-slate-300">|</span>
                  <span className="font-medium">SP: {it.noSp}</span> <span className="text-slate-300">|</span> 
                  <span>PO: {it.noPo}</span> <span className="text-slate-300">|</span> 
                  {it.detailBarang} <span className="font-semibold text-indigo-600">({it.jumlahBarang} qty)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[320px] md:border-l md:border-slate-200 md:pl-6 justify-center">
          <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${ship.isTerkirim ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <input type="checkbox" className="w-5 h-5 rounded text-green-600 cursor-pointer" checked={ship.isTerkirim} onChange={() => toggleStatus(ship._id, ship, "isTerkirim")} />
            <span className="font-bold">{ship.isTerkirim ? "Sudah Dikirim" : "Belum Dikirim"}</span>
          </label>
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kelengkapan Berkas:</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={ship.berkas?.suratJalan || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "suratJalan")} /> Surat Jalan
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={ship.berkas?.pengantarTimbangan || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "pengantarTimbangan")} /> Peng. Timbangan
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={ship.berkas?.daftarBerat || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "daftarBerat")} /> Daftar Berat
              </label>
              <label className={`flex items-center gap-2 text-sm font-medium ${isCoaEligible ? 'cursor-pointer text-slate-700' : 'cursor-not-allowed text-slate-400 opacity-60'}`}>
                <input type="checkbox" className={`w-4 h-4 rounded text-indigo-600 ${isCoaEligible ? 'cursor-pointer' : 'cursor-not-allowed bg-slate-200'}`} checked={ship.berkas?.coa || false} onChange={() => isCoaEligible && toggleStatus(ship._id, ship, "berkas", "coa")} disabled={!isCoaEligible} /> 
                COA {isCoaEligible ? '' : '🔒'}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={ship.berkas?.form || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "form")} /> Form
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={ship.berkas?.amplop || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "amplop")} /> Amplop
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 font-sans text-slate-800 relative">
      <div className="max-w-5xl mx-auto px-6">
        
        <div className="flex justify-between items-center mb-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex gap-2 md:gap-4 flex-wrap justify-end">
            <Link href="/stock" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium px-4 py-2 rounded-xl transition-colors">Stok Gudang</Link>
            <Link href="/" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-medium px-4 py-2 rounded-xl transition-colors">Input Data</Link>
            <button className="bg-blue-50 text-blue-700 font-semibold px-4 py-2 rounded-xl cursor-default">Daftar Tracking</button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="mb-10">
            <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">⏳ Sedang Diproses <span className="bg-orange-100 text-orange-700 py-0.5 px-2.5 rounded-full text-sm">{pendingShippings.length}</span></h3>
            <div className="space-y-5">{pendingShippings.map((ship) => <ShippingCard key={ship._id} ship={ship} isCompleted={false} />)}</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">✅ Selesai Dikirim <span className="bg-green-100 text-green-700 py-0.5 px-2.5 rounded-full text-sm">{completedShippings.length}</span></h3>
            <div className="space-y-5">{completedShippings.map((ship) => <ShippingCard key={ship._id} ship={ship} isCompleted={true} />)}</div>
          </div>
        </div>
      </div>

      {editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Edit Data Kiriman</h2>
              <button onClick={() => setEditData(null)} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={saveEdit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input className="border p-3 rounded-xl bg-slate-50 outline-none" value={editData.noPrk} onChange={(e) => handleEditChange("noPrk", e.target.value)} required />
                <input type="date" className="border p-3 rounded-xl bg-slate-50 outline-none" value={editData.tanggal.split('T')[0]} onChange={(e) => handleEditChange("tanggal", e.target.value)} required />
                <input className="border p-3 rounded-xl bg-slate-50 outline-none" value={editData.alamat} onChange={(e) => handleEditChange("alamat", e.target.value)} required />
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl mb-6 overflow-x-auto">
                <h3 className="font-semibold text-indigo-900 mb-3">Edit Barang</h3>
                <div className="min-w-[600px]">
                  {editData.items.map((item, idx) => (
                    // UPDATE: Form Edit menjadi 5 kolom
                    <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
                      <input className="border p-2 rounded-lg text-sm outline-none" placeholder="Kode Barang" value={item.kodeBarang || ""} onChange={(e) => handleEditItemChange(idx, "kodeBarang", e.target.value.toUpperCase())} />
                      <input className="border p-2 rounded-lg text-sm outline-none" placeholder="No SP" value={item.noSp} onChange={(e) => handleEditItemChange(idx, "noSp", e.target.value)} />
                      <input className="border p-2 rounded-lg text-sm outline-none" placeholder="No PO" value={item.noPo} onChange={(e) => handleEditItemChange(idx, "noPo", e.target.value)} />
                      <input className="border p-2 rounded-lg text-sm outline-none" placeholder="Detail Barang" value={item.detailBarang} onChange={(e) => handleEditItemChange(idx, "detailBarang", e.target.value)} />
                      <input className="border p-2 rounded-lg text-sm outline-none" type="number" placeholder="Jumlah" value={item.jumlahBarang} onChange={(e) => handleEditItemChange(idx, "jumlahBarang", e.target.value)} />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addEditItemRow} className="text-sm text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg mt-2">+ Tambah Item</button>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditData(null)} className="px-5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium shadow-md">
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}