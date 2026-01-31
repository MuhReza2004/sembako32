import {
  addDoc,
  collection,
  updateDoc,
  doc,
  increment,
  getDocs,
  orderBy,
  query,
  getDoc,
  where,
} from "firebase/firestore";
import { Pembelian, PembelianDetail } from "../types/pembelian";
import { db } from "../lib/firebase";

export const createPembelian = async (data: {
  supplierId: string;
  tanggal: string;
  noDO?: string;
  noNPB?: string;
  invoice?: string;
  total: number;
  status: "Pending" | "Completed";
  items: PembelianDetail[];
}) => {
  const pembelianRef = await addDoc(collection(db, "pembelian"), {
    supplierId: data.supplierId,
    tanggal: data.tanggal,
    noDO: data.noDO,
    noNPB: data.noNPB,
    invoice: data.invoice,
    total: data.total,
    status: data.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create pembelian_detail documents
  for (const item of data.items) {
    await addDoc(collection(db, "pembelian_detail"), {
      pembelianId: pembelianRef.id,
      supplierProdukId: item.supplierProdukId,
      qty: item.qty,
      harga: item.harga,
      subtotal: item.subtotal,
    });

    // Only update stock if status is not 'Pending'
    if (data.status !== "Pending") {
      const supplierProdukRef = doc(
        db,
        "supplier_produk",
        item.supplierProdukId,
      );
      await updateDoc(supplierProdukRef, {
        stok: increment(item.qty),
      });
    }
  }

  return pembelianRef.id;
};

export const getAllPembelian = async (): Promise<Pembelian[]> => {
  const q = query(collection(db, "pembelian"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const pembelianList: Pembelian[] = [];

  for (const docSnap of snap.docs) {
    const pembelianData = docSnap.data() as Pembelian;
    const pembelianId = docSnap.id;

    // Fetch supplier name
    let supplierData = null;
    if (pembelianData.supplierId) {
        try {
            const supplierDoc = await getDoc(doc(db, "suppliers", pembelianData.supplierId));
            if (supplierDoc.exists()) {
                supplierData = supplierDoc.data();
            }
        } catch(e) {
            console.error(`Could not fetch supplier: ${pembelianData.supplierId}`, e);
        }
    }

    // Fetch details
    const detailQuery = query(
      collection(db, "pembelian_detail"),
      where("pembelianId", "==", pembelianId),
    );
    const detailSnap = await getDocs(detailQuery);
    const details: PembelianDetail[] = [];

    for (const detailDoc of detailSnap.docs) {
      const detailData = detailDoc.data();
      const supplierProdukDoc = await getDoc(
        doc(db, "supplier_produk", detailData.supplierProdukId),
      );
      const supplierProdukData = supplierProdukDoc.data();

      if (supplierProdukData) {
        const produkDoc = await getDoc(
          doc(db, "produk", supplierProdukData.produkId),
        );
        const produkData = produkDoc.data();

        details.push({
          id: detailDoc.id,
          ...detailData,
          namaProduk: produkData?.nama || "Produk Tidak Ditemukan",
          satuan: produkData?.satuan || "",
        } as PembelianDetail);
      } else {
        details.push({
          id: detailDoc.id,
          ...detailData,
          namaProduk: "Produk Tidak Ditemukan",
          satuan: "",
        } as PembelianDetail);
      }
    }

    pembelianList.push({
      id: pembelianId,
      ...pembelianData,
      namaSupplier: supplierData?.nama || "Supplier Tidak Diketahui",
      items: details,
    });
  }

  return pembelianList;
};

export const updatePembelianAndStock = async (
  pembelianId: string,
  data: {
    noDO?: string;
    noNPB?: string;
    invoice?: string;
  },
) => {
  const pembelianRef = doc(db, "pembelian", pembelianId);

  // First, update the purchase document
  await updateDoc(pembelianRef, {
    ...data,
    status: "Completed",
    updatedAt: new Date(),
  });

  // Then, fetch the purchase details to update stock
  const detailQuery = query(
    collection(db, "pembelian_detail"),
    where("pembelianId", "==", pembelianId),
  );
  const detailSnap = await getDocs(detailQuery);

  for (const detailDoc of detailSnap.docs) {
    const detail = detailDoc.data();
    const supplierProdukRef = doc(db, "supplier_produk", detail.supplierProdukId);
    await updateDoc(supplierProdukRef, {
      stok: increment(detail.qty),
    });
  }
};

export const getPembelianDetails = async (
  pembelianId: string,
): Promise<PembelianDetail[]> => {
  const q = query(
    collection(db, "pembelian_detail"),
    where("pembelianId", "==", pembelianId),
  );
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PembelianDetail[];
};

