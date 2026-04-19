import connectMongoDB from "@/lib/mongodb";
import Stock from "@/models/Stock";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();
    await connectMongoDB();

    // Cek apakah kombinasi Kode, SP, PO sudah ada
    const existingStock = await Stock.findOne({
      kodeBarang: data.kodeBarang,
      noSp: data.noSp,
      noPo: data.noPo,
    });

    if (existingStock) {
      // Jika ada, tambahkan stoknya
      existingStock.stok += Number(data.stok);
      await existingStock.save();
    } else {
      // Jika belum ada, buat baru
      await Stock.create(data);
    }

    return NextResponse.json({ message: "Stok berhasil diupdate" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menyimpan stok", error: error.message }, { status: 500 });
  }
}

export async function GET() {
  await connectMongoDB();
  const stocks = await Stock.find().sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ stocks });
}