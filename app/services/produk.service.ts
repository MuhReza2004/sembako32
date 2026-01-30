import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Produk, ProdukFormData } from "../types/produk";

/* =============================
   AUTO GENERATE ID PRODUK
   ============================= */
export const generateProdukId = async (): Promise<string> => {
  const counterRef = doc(db, "counters", "produk");

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    if (!snap.exists()) {
      tx.set(counterRef, { lastNumber: 1 });
      return 1;
    }

    const nextNumber = snap.data().lastNumber + 1;
    tx.update(counterRef, { lastNumber: nextNumber });
    return nextNumber;
  });

  return `PRD-${String(next).padStart(5, "0")}`;
};

/* =============================
   AUTO GENERATE KODE PRODUK
   ============================= */
export const generateKodeProduk = async (): Promise<string> => {
  const counterRef = doc(db, "counters", "kodeProduk");

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    if (!snap.exists()) {
      tx.set(counterRef, { lastNumber: 1 });
      return 1;
    }

    const nextNumber = snap.data().lastNumber + 1;
    tx.update(counterRef, { lastNumber: nextNumber });
    return nextNumber;
  });

  return `SKU-${String(next).padStart(5, "0")}`;
};

export const getNewKodeProduk = async (): Promise<string> => {
  return await generateKodeProduk();
};

/* =============================
   CREATE
   ============================= */
export const addProduk = async (data: ProdukFormData): Promise<string> => {
  const ref = await addDoc(collection(db, "produk"), {
    ...data,
    stok: 0, // Initialize stock to 0
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

/* =============================
   READ
   ============================= */
export const getAllProduk = async (): Promise<Produk[]> => {
  const q = query(collection(db, "produk"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    kode: d.data().kode,
    nama: d.data().nama,
    kategori: d.data().kategori,
    satuan: d.data().satuan,
    stok: d.data().stok || 0,
    status: d.data().status,
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  })) as Produk[];
};

export const getProdukById = async (id: string): Promise<Produk | null> => {
  const snap = await getDoc(doc(db, "produk", id));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    kode: snap.data().kode,
    nama: snap.data().nama,
    kategori: snap.data().kategori,
    satuan: snap.data().satuan,
    stok: snap.data().stok || 0,
    status: snap.data().status,
    createdAt: snap.data().createdAt?.toDate(),
    updatedAt: snap.data().updatedAt?.toDate(),
  } as Produk;
};

/* =============================
   UPDATE & DELETE
   ============================= */
export const updateProduk = async (
  id: string,
  data: Partial<ProdukFormData>,
): Promise<void> => {
  await updateDoc(doc(db, "produk", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const updateProdukStok = async (
  id: string,
  newStok: number,
): Promise<void> => {
  await updateDoc(doc(db, "produk", id), {
    stok: newStok,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduk = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "produk", id));
};
