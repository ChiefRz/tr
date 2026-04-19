import mongoose, { Schema } from "mongoose";

const stockSchema = new Schema(
  {
    namaCustomer: { type: String, required: true },
    kodeBarang: { type: String, required: true },
    detailBarang: { type: String, required: true },
    noSp: { type: String, required: true },
    noPo: { type: String, required: true },
    stok: { type: Number, required: true, min: 0 },
    coa: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Mencegah duplikasi: Kombinasi Kode + SP + PO harus unik
stockSchema.index({  noSp: 1, noPo: 1 }, { unique: true });

const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
export default Stock;