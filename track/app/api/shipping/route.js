import connectMongoDB from "@/lib/mongodb";
import Shipping from "../../../models/Shipping";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  await connectMongoDB();
  await Shipping.create(data);
  return NextResponse.json({ message: "Data berhasil disimpan" }, { status: 201 });
}

export async function GET() {
  await connectMongoDB();
  const shippings = await Shipping.find().sort({ createdAt: -1 });
  return NextResponse.json({ shippings });
}