import connectMongoDB from "@/lib/mongodb";
import Shipping from "@/models/Shipping";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    // 1. Next.js versi terbaru mewajibkan 'params' di-await
    const { id } = await params; 
    const data = await request.json();
    
    // 2. Cegah error "Immutable field '_id'" dari MongoDB
    // MongoDB akan menolak update jika kita ikut mengirimkan _id atau __v
    if (data._id) delete data._id;
    if (data.__v !== undefined) delete data.__v;

    await connectMongoDB();

    // 3. Simpan perubahan spesifik menggunakan $set
    const updatedShipping = await Shipping.findByIdAndUpdate(
      id,
      { $set: data }, 
      { new: true }
    );

    if (!updatedShipping) {
      return NextResponse.json({ message: "Data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Perubahan tersimpan" }, { status: 200 });
    
  } catch (error) {
    // 4. MUNCULKAN ERROR DI TERMINAL AGAR KITA TAHU PENYEBABNYA
    console.log("❌ ERROR MONGODB UPDATE:", error.message);
    return NextResponse.json({ message: "Gagal update database", error: error.message }, { status: 500 });
  }
}