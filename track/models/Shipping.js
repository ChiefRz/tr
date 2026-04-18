import mongoose, { Schema } from "mongoose";

const shippingSchema = new Schema(
  {
    noPrk: { type: String, required: true },
    tanggal: { type: Date, required: true },
    alamat: { type: String, required: true },
    isTerkirim: { type: Boolean, default: false },
    
    // UPDATE BAGIAN BERKAS DI SINI
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
        noSp: String,
        noPo: String,
        detailBarang: String,
        jumlahBarang: Number,
      },
    ],
  },
  { timestamps: true }
);

const Shipping = mongoose.models.Shipping || mongoose.model("Shipping", shippingSchema);
export default Shipping;