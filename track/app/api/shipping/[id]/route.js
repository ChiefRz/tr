import connectMongoDB from "@/lib/mongodb";
import Shipping from "@/models/Shipping";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const { id } = params;
  const data = await request.json();
  await connectMongoDB();
  await Shipping.findByIdAndUpdate(id, data);
  return NextResponse.json({ message: "Status diperbarui" }, { status: 200 });
}