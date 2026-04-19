import connectMongoDB from "@/lib/mongodb";
import Stock from "@/models/Stock";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();
    await connectMongoDB();

    // Cari stok berdasarkan kombinasi Customer, Kode, SP, dan PO
    const existingStock = await Stock.findOne({
      namaCustomer: data.namaCustomer, // Tambahkan dalam pencarian
      kodeBarang: data.kodeBarang,
      noSp: data.noSp,
      noPo: data.noPo,
    });

    if (existingStock) {
      existingStock.stok += Number(data.stok);
      existingStock.coa = data.coa; // Update status COA jika ada perubahan
      await existingStock.save();
    } else {
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