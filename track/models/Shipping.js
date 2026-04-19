import mongoose, { Schema } from "mongoose";

const shippingSchema = new Schema(
  {
    // Tambahkan index: true karena noPrk sangat sering dicari
    noPrk: { type: String, required: true, index: true }, 
    tanggal: { type: Date, required: true },
    alamat: { type: String, required: true },
    isTerkirim: { type: Boolean, default: false },
    berkas: {
      suratJalan: { type: Boolean, default: false },
      pengantarTimbangan: { type: Boolean, default: false },
      daftarBerat: { type: Boolean, default: false },
      coa: { type: Boolean, default: false },
      form: { type: Boolean, default: false },
      amplop: { type: Boolean, default: false },
    },
    items: [
      {
        kodeBarang: String,
        noSp: String,
        noPo: String,
        detailBarang: String,
        jumlahBarang: Number,
        isStockDeducted: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Indeks tambahan untuk mempercepat pengurutan data terbaru
shippingSchema.index({ createdAt: -1 }); 
shippingSchema.index({ isTerkirim: 1 }); // Mempercepat pemisahan selesai/belum

const Shipping = mongoose.models.Shipping || mongoose.model("Shipping", shippingSchema);
export default Shipping;