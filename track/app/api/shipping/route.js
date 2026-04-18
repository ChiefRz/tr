import connectMongoDB from "@/lib/mongodb";
import Shipping from "@/models/Shipping";
import { NextResponse } from "next/server";

export async function POST(request) {
  // ... (kode POST tetap sama) ...
}

export async function GET() {
  await connectMongoDB();
  
  // TAMBAHKAN .lean() DI SINI
  // .limit(100) juga opsional ditambahkan agar hanya menarik 100 data terbaru, 
  // mencegah server kehabisan napas saat data sudah ribuan.
  const shippings = await Shipping.find()
    .sort({ createdAt: -1 })
    .limit(100) 
    .lean(); 

  return NextResponse.json({ shippings });
}