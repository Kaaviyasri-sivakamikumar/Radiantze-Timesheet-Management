import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getServerFirebaseApp } from "@/lib/firebase";

const db = getFirestore(getServerFirebaseApp());

export const firestoreService = {
  async saveEmployee(employeeData: {
    name: string;
    id: string;
    email: string;
    designation: string;
    client: string;
    vendor: string;
    startDate: string;
    endDate: string;
  }) {
    try {
      const docRef = await addDoc(collection(db, "employees"), {
        ...employeeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error saving employee:", error);
      throw error;
    }
  },
};
