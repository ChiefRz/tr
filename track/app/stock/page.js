"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [formData, setFormData] = useState({ kodeBarang: "", detailBarang: "", noSp: "", noPo: "", stok: "" });

  const fetchStocks = async () => {
    const res = await fetch("/api/stock");
    const data = await res.json();
    setStocks(data.stocks || []);
  };

  useEffect(() => { fetchStocks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    
    if(res.ok) {
      alert("Stok berhasil ditambahkan!");
      setFormData({ kodeBarang: "", detailBarang: "", noSp: "", noPo: "", stok: "" });
      fetchStocks();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6 text-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6">
          <Link href="/" className="bg-slate-200 px-4 py-2 rounded-lg">🔙 Kembali ke Input Kiriman</Link>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-8">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700">📦 Input Stok Gudang (Tersedia)</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Kode Barang" required value={formData.kodeBarang} onChange={(e) => setFormData({...formData, kodeBarang: e.target.value.toUpperCase()})} />
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Nama/Detail Barang" required value={formData.detailBarang} onChange={(e) => setFormData({...formData, detailBarang: e.target.value})} />
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" placeholder="No SP" required value={formData.noSp} onChange={(e) => setFormData({...formData, noSp: e.target.value})} />
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" placeholder="No PO" required value={formData.noPo} onChange={(e) => setFormData({...formData, noPo: e.target.value})} />
            <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" type="number" placeholder="Jumlah Stok" required value={formData.stok} onChange={(e) => setFormData({...formData, stok: e.target.value})} />
            <button type="submit" className="md:col-span-5 bg-indigo-600 text-white font-bold py-3 rounded-lg mt-2 hover:bg-indigo-700">Simpan Stok Masuk</button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">Daftar Stok Tersedia</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 border-b">Kode Barang</th>
                <th className="p-3 border-b">Detail</th>
                <th className="p-3 border-b">SP / PO</th>
                <th className="p-3 border-b text-center">Sisa Stok</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s._id} className="hover:bg-slate-50">
                  <td className="p-3 border-b font-bold text-indigo-600">{s.kodeBarang}</td>
                  <td className="p-3 border-b">{s.detailBarang}</td>
                  <td className="p-3 border-b text-sm">SP: {s.noSp} <br/> PO: {s.noPo}</td>
                  <td className={`p-3 border-b text-center font-bold ${s.stok < 10 ? 'text-red-500' : 'text-green-600'}`}>{s.stok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}