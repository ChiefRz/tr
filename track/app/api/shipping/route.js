import connectMongoDB from "@/lib/mongodb";
import Shipping from "@/models/Shipping";
import Stock from "@/models/Stock";
import { NextResponse } from "next/server";

// FUNGSI POST (Input Data & Pemotongan/Split Stok)
export async function POST(request) {
  try {
    const data = await request.json();
    await connectMongoDB();

    let finalItems = [];

    for (const item of data.items) {
      if (item.kodeBarang && item.noSp && item.noPo) {
        const stockData = await Stock.findOne({
          kodeBarang: item.kodeBarang,
          noSp: item.noSp,
          noPo: item.noPo,
        });

        if (stockData && item.jumlahBarang > stockData.stok) {
          const sisaKurang = item.jumlahBarang - stockData.stok;

          // Jika stok > 0, masukkan yang bisa dipenuhi
          if (stockData.stok > 0) {
            finalItems.push({
              ...item,
              jumlahBarang: stockData.stok,
              isStockDeducted: true
            });
          }

          // Masukkan sisa kekurangannya dengan SP/PO kosong
          finalItems.push({
            ...item,
            noSp: "",
            noPo: "",
            jumlahBarang: sisaKurang,
            isStockDeducted: false
          });

          // Habiskan stok di gudang
          await Stock.updateOne(
            { _id: stockData._id },
            { $set: { stok: 0 } }
          );
        } else if (stockData) {
          // Stok cukup, kurangi seperti biasa
          await Stock.updateOne(
            { _id: stockData._id },
            { $inc: { stok: -Math.abs(item.jumlahBarang) } }
          );
          finalItems.push({ ...item, isStockDeducted: true });
        } else {
          finalItems.push({ ...item, isStockDeducted: false });
        }
      } else {
        finalItems.push({ ...item, isStockDeducted: false });
      }
    }

    const newShipping = await Shipping.create({ ...data, items: finalItems });
    return NextResponse.json({ message: "Data disimpan & stok disesuaikan", id: newShipping._id }, { status: 201 });

  } catch (error) {
    console.error("❌ ERROR POST:", error.message);
    return NextResponse.json({ message: "Gagal simpan", error: error.message }, { status: 500 });
  }
}

// FUNGSI GET (WAJIB ADA UNTUK MENAMPILKAN DATA DI HALAMAN TRACKING)
export async function GET() {
  try {
    await connectMongoDB();
    const shippings = await Shipping.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ shippings }, { status: 200 });
  } catch (error) {
    console.error("❌ ERROR GET:", error.message);
    // Kembalikan JSON kosong agar frontend tidak crash saat JSON.parse
    return NextResponse.json({ shippings: [] }, { status: 500 });
  }
}