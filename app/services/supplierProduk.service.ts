import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { SupplierProduk, SupplierProdukFormData } from "@/app/types/suplyer";

/* ======================
   CREATE
====================== */
export const addSupplierProduk = async (
  data: SupplierProdukFormData,
): Promise<string> => {
  const ref = await addDoc(collection(db, "supplier_produk"), {
    ...data,
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

/* ======================
   READ
====================== */
export const getAllSupplierProduk = async (): Promise<SupplierProduk[]> => {
  const snap = await getDocs(collection(db, "supplier_produk"));

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SupplierProdukFormData),
    createdAt: doc.data().createdAt as Timestamp,
  }));
};

export const getSupplierProdukById = async (
  id: string,
): Promise<SupplierProduk | null> => {
  const snap = await getDoc(doc(db, "supplier_produk", id));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as SupplierProdukFormData),
    createdAt: snap.data().createdAt as Timestamp,
  };
};

/* ======================
   UPDATE
====================== */
export const updateSupplierProduk = async (
  id: string,
  data: Partial<SupplierProdukFormData>,
): Promise<void> => {
  await updateDoc(doc(db, "supplier_produk", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/* ======================
   DELETE
====================== */
export const deleteSupplierProduk = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "supplier_produk", id));
};
