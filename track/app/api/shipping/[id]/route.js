import connectMongoDB from "@/lib/mongodb";
import Shipping from "@/models/Shipping";
import Stock from "@/models/Stock";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    if (data._id) delete data._id;
    if (data.__v !== undefined) delete data.__v;

    await connectMongoDB();

    // LOGIKA PENGURANGAN STOK SAAT EDIT (DELAYED DEDUCTION)
    // Cek apakah data yang dikirim mengandung array 'items' (berarti user mengedit dari Modal Edit)
    // Di dalam fungsi PATCH app/api/shipping/[id]/route.js
    if (data.items && Array.isArray(data.items)) {
      let updatedItems = [];
      
      for (let item of data.items) {
        if (item.kodeBarang && item.noSp && item.noPo && !item.isStockDeducted) {
          const stockData = await Stock.findOne({ kodeBarang: item.kodeBarang, noSp: item.noSp, noPo: item.noPo });
          
          if (stockData && item.jumlahBarang > stockData.stok) {
            const sisaKurang = item.jumlahBarang - stockData.stok;
            
            // Split Entry saat Edit
            updatedItems.push({ ...item, jumlahBarang: stockData.stok, isStockDeducted: true });
            updatedItems.push({ ...item, noSp: "", noPo: "", jumlahBarang: sisaKurang, isStockDeducted: false });
            
            await Stock.updateOne({ _id: stockData._id }, { $set: { stok: 0 } });
          } else if (stockData) {
            await Stock.updateOne({ _id: stockData._id }, { $inc: { stok: -Math.abs(item.jumlahBarang) } });
            updatedItems.push({ ...item, isStockDeducted: true });
          } else {
            updatedItems.push(item);
          }
        } else {
          updatedItems.push(item);
        }
      }
      data.items = updatedItems;
    }

    // Simpan semua perubahan ke dalam Shipping
    const updatedShipping = await Shipping.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    if (!updatedShipping) return NextResponse.json({ message: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ message: "Perubahan tersimpan" }, { status: 200 });
    
  } catch (error) {
    console.log("❌ ERROR MONGODB UPDATE:", error.message);
    return NextResponse.json({ message: "Gagal update database", error: error.message }, { status: 500 });
  }
}