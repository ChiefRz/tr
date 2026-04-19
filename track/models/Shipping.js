import mongoose, { Schema } from "mongoose";

const shippingSchema = new Schema(
  {
    noPrk: { type: String, required: true, index: true },
    namaCustomer: { type: String, required: true },
    tanggal: { type: Date, required: true },
    alamat: { type: String, required: true },
    isTerkirim: { type: Boolean, default: false },
    
    // BERKAS KEMBALI KE SINI (1 Set per 1 PRK)
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

shippingSchema.index({ createdAt: -1 });
shippingSchema.index({ isTerkirim: 1 });

const Shipping = mongoose.models.Shipping || mongoose.model("Shipping", shippingSchema);
export default Shipping;