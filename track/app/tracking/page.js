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
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setShippings(data.shippings || []);
    } catch (error) {
      console.error("❌ Gagal memuat data:", error.message);
      setShippings([]); 
    }
  };

  useEffect(() => { fetchShippings(); }, []);

  // FUNGSI TOGGLE FINAL (Sudah tersambung ke Checkbox di bawah)
  const toggleStatus = async (id, currentData, fieldTarget, subField = null) => {
    const newValue = subField ? !currentData[fieldTarget]?.[subField] : !currentData[fieldTarget];
    
    const payload = {};
    if (subField) {
      payload[fieldTarget] = { 
        ...(currentData[fieldTarget] || { 
          suratJalan: false, pengantarTimbangan: false, daftarBerat: false, 
          coa: false, form: false, amplop: false 
        }), 
        [subField]: newValue 
      };
    } else {
      payload[fieldTarget] = newValue;
    }

    // Update UI seketika
    setShippings((prev) => prev.map((ship) => {
      if (ship._id === id) {
        return { ...ship, [fieldTarget]: payload[fieldTarget] };
      }
      return ship;
    }));

    // Update ke Database
    try {
      const res = await fetch(`/api/shipping/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal dari server");
      }
    } catch (error) {
      alert(`❌ Gagal menyimpan perubahan:\n${error.message}`);
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
      
      const result = await res.json();
      
      if (res.ok) { 
        setEditData(null); 
        fetchShippings(); 
        alert("✅ Perubahan tersimpan!");
      } else {
        alert(`❌ Gagal Menyimpan: ${result.message}`); 
      }
    } catch (error) { 
      alert("❌ Terjadi kesalahan jaringan saat menyimpan perubahan."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const checkCoaEligibility = (customerName) => {
    const validCustomers = ["sriboga", "mulya inti pangan", "berill", "panen mas"];
    return validCustomers.includes((customerName || "").toLowerCase());
  };

  const pendingShippings = shippings.filter((ship) => !ship.isTerkirim);
  const completedShippings = shippings.filter((ship) => ship.isTerkirim);

  const ShippingCard = ({ ship, isCompleted }) => {
    const isCoaEligible = checkCoaEligibility(ship.namaCustomer);

    return (
      <div className={`group border border-slate-100 p-5 rounded-2xl shadow-sm transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 ${isCompleted ? 'bg-slate-50/50 opacity-80' : 'bg-gradient-to-r from-white to-slate-50 hover:shadow-md'}`}>
        
        <div className="flex-1 relative">
          <button onClick={() => setEditData(ship)} className="absolute top-0 right-0 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg font-semibold transition-colors">
            ✎ Edit Data
          </button>

          <div className="flex items-baseline gap-2 mb-2 pr-24">
            <h3 className={`font-bold text-2xl ${isCompleted ? 'text-slate-600 line-through' : 'text-indigo-900'}`}>PRK: {ship.noPrk}</h3>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{new Date(ship.tanggal).toLocaleDateString('id-ID')}</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 text-slate-700 mb-4 text-sm">
            <p className="flex items-center gap-1 font-semibold"><span className="text-indigo-500">🧑‍💼</span> {ship.namaCustomer || "Tanpa Nama"}</p>
            <p className="flex items-center gap-1"><span className="text-red-400">📍</span> {ship.alamat}</p>
          </div>
          
          <div className={`p-4 rounded-xl border shadow-sm ${isCompleted ? 'bg-slate-100/50' : 'bg-white'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daftar Barang:</p>
            <ul className="text-sm space-y-2 text-slate-700">
              {ship.items.map((it, i) => (
                <li key={i} className="flex items-center flex-wrap gap-2 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-slate-400' : 'bg-indigo-300'}`}></span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border shadow-sm">[{it.kodeBarang || "N/A"}]</span>
                  <span className="font-medium bg-slate-50 px-2 py-0.5 rounded border">SP: {it.noSp || "-"}</span> 
                  <span className="font-medium bg-slate-50 px-2 py-0.5 rounded border">PO: {it.noPo || "-"}</span> 
                  <span className="ml-1">{it.detailBarang}</span> 
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">({it.jumlahBarang} qty)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[320px] md:border-l md:border-slate-200 md:pl-6 justify-center">
          <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${ship.isTerkirim ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {/* INI SAMBUNGAN TOGGLESTATUS UNTUK STATUS KIRIMAN */}
            <input type="checkbox" className="w-5 h-5 rounded text-green-600 cursor-pointer" checked={ship.isTerkirim} onChange={() => toggleStatus(ship._id, ship, "isTerkirim")} />
            <span className="font-bold">{ship.isTerkirim ? "✅ Sudah Dikirim" : "⏳ Belum Dikirim"}</span>
          </label>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kelengkapan Berkas (1 PRK):</p>
            <div className="grid grid-cols-2 gap-3">
              {/* INI SAMBUNGAN TOGGLESTATUS UNTUK BERKAS */}
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-indigo-600">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 cursor-pointer" checked={ship.berkas?.suratJalan || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "suratJalan")} /> Surat Jalan
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-indigo-600">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 cursor-pointer" checked={ship.berkas?.pengantarTimbangan || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "pengantarTimbangan")} /> Peng. Timb.
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-indigo-600">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 cursor-pointer" checked={ship.berkas?.daftarBerat || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "daftarBerat")} /> Dftr. Berat
              </label>
              
              <label className={`flex items-center gap-2 text-sm font-medium ${isCoaEligible ? 'cursor-pointer text-slate-700 hover:text-indigo-600' : 'cursor-not-allowed text-slate-400 opacity-60'}`}>
                <input type="checkbox" className={`w-4 h-4 rounded text-indigo-600 ${isCoaEligible ? 'cursor-pointer' : 'cursor-not-allowed bg-slate-200'}`} checked={ship.berkas?.coa || false} onChange={() => isCoaEligible && toggleStatus(ship._id, ship, "berkas", "coa")} disabled={!isCoaEligible} /> 
                COA {isCoaEligible ? '' : '🔒'}
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-indigo-600">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 cursor-pointer" checked={ship.berkas?.form || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "form")} /> Form
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-indigo-600">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 cursor-pointer" checked={ship.berkas?.amplop || false} onChange={() => toggleStatus(ship._id, ship, "berkas", "amplop")} /> Amplop
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 font-sans text-slate-800 relative">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="flex justify-between items-center mb-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-500 hidden md:block">Sistem Ekspedisi</h1>
          <div className="flex gap-2 md:gap-4 flex-wrap justify-end w-full md:w-auto">
            <Link href="/stock" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium px-4 py-2 rounded-xl transition-colors">📦 Stok Gudang</Link>
            <Link href="/" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-medium px-4 py-2 rounded-xl transition-colors">📝 Input Data</Link>
            <button className="bg-blue-50 text-blue-700 font-semibold px-4 py-2 rounded-xl cursor-default">📍 Daftar Tracking</button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="mb-10">
            <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">⏳ Sedang Diproses <span className="bg-orange-100 text-orange-700 py-0.5 px-2.5 rounded-full text-sm">{pendingShippings.length}</span></h3>
            <div className="space-y-6">{pendingShippings.map((ship) => <ShippingCard key={ship._id} ship={ship} isCompleted={false} />)}</div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">✅ Selesai Dikirim <span className="bg-green-100 text-green-700 py-0.5 px-2.5 rounded-full text-sm">{completedShippings.length}</span></h3>
            <div className="space-y-6">{completedShippings.map((ship) => <ShippingCard key={ship._id} ship={ship} isCompleted={true} />)}</div>
          </div>
        </div>
      </div>

      {editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Edit Data Kiriman</h2>
              <button onClick={() => setEditData(null)} className="text-slate-400 hover:text-red-500 font-bold text-3xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={saveEdit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">No PRK</label>
                  <input className="border p-3 w-full rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-300" value={editData.noPrk} onChange={(e) => handleEditChange("noPrk", e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nama Customer</label>
                  <input className="border p-3 w-full rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Nama Customer" value={editData.namaCustomer || ""} onChange={(e) => handleEditChange("namaCustomer", e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tanggal</label>
                  <input type="date" className="border p-3 w-full rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-300" value={editData.tanggal ? editData.tanggal.split('T')[0] : ""} onChange={(e) => handleEditChange("tanggal", e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Alamat Tujuan</label>
                  <input className="border p-3 w-full rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-300" value={editData.alamat} onChange={(e) => handleEditChange("alamat", e.target.value)} required />
                </div>
              </div>

              <div className="bg-indigo-50 p-5 rounded-xl mb-6 overflow-x-auto border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-4">Edit Daftar Barang</h3>
                <div className="min-w-[700px]">
                  {editData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 mb-3 items-center">
                      <input className="col-span-2 border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" placeholder="Kode Barang" value={item.kodeBarang || ""} onChange={(e) => handleEditItemChange(idx, "kodeBarang", e.target.value.toUpperCase())} />
                      <input className="col-span-2 border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" placeholder="No SP (Opsional)" value={item.noSp || ""} onChange={(e) => handleEditItemChange(idx, "noSp", e.target.value)} />
                      <input className="col-span-2 border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" placeholder="No PO (Opsional)" value={item.noPo || ""} onChange={(e) => handleEditItemChange(idx, "noPo", e.target.value)} />
                      <input className="col-span-4 border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" placeholder="Detail Barang" value={item.detailBarang} onChange={(e) => handleEditItemChange(idx, "detailBarang", e.target.value)} required/>
                      <input className="col-span-2 border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-400" type="number" placeholder="Jumlah" value={item.jumlahBarang} onChange={(e) => handleEditItemChange(idx, "jumlahBarang", e.target.value)} required/>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addEditItemRow} className="text-sm font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-lg mt-2 transition-colors">+ Tambah Baris Barang</button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setEditData(null)} className="px-6 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Batal</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-md transition-all">
                  {isSaving ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}