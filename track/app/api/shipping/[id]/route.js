import connectMongoDB from "@/lib/mongodb";
import Shipping from "@/models/Shipping";
import Stock from "@/models/Stock";
import { NextResponse } from "next/server";

export async function PATCH(request, context) {
  try {
    // Penanganan aman untuk params (Mendukung Next.js 14 & 15)
    const params = await context.params;
    const id = params.id;

    const data = await request.json();

    // HAPUS field bawaan MongoDB agar tidak terjadi bentrok "Immutable Field"
    if (data._id) delete data._id;
    if (data.createdAt) delete data.createdAt;
    if (data.updatedAt) delete data.updatedAt;
    if (data.__v !== undefined) delete data.__v;

    await connectMongoDB();

    // LOGIKA STOK SAAT EDIT (Hanya jalan jika data.items dikirim dari Modal Edit)
    if (data.items && Array.isArray(data.items)) {
      let updatedItems = [];
      for (let item of data.items) {
        if (item.kodeBarang && item.noSp && item.noPo && !item.isStockDeducted) {
          const stockData = await Stock.findOne({ kodeBarang: item.kodeBarang, noSp: item.noSp, noPo: item.noPo });

          if (stockData && item.jumlahBarang > stockData.stok) {
            const sisaKurang = item.jumlahBarang - stockData.stok;
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

    // UPDATE KE DATABASE
    const updatedShipping = await Shipping.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true } // Catatan: Kita matikan runValidators agar data lama bisa ditembus
    );

    if (!updatedShipping) {
      return NextResponse.json({ message: "ID Resi tidak ditemukan di database." }, { status: 404 });
    }

    return NextResponse.json({ message: "Perubahan berhasil disimpan!" }, { status: 200 });

  } catch (error) {
    console.error("❌ ERROR MONGODB:", error);
    // Kembalikan pesan error ASLI dari database ke frontend
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}