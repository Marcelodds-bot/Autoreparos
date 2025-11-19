import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MaterialPrice, ServiceOrder, ClientData, RepairEstimate, ServiceCard } from "../types";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC1zBKSAQUQTSFXx53Jmrw1x7BAEfHyfes",
  authDomain: "auto-reparos.firebaseapp.com",
  projectId: "auto-reparos",
  storageBucket: "auto-reparos.firebasestorage.app",
  messagingSenderId: "978575129906",
  appId: "1:978575129906:web:18c0da36a5a48dac992b2b",
  measurementId: "G-Z45PDW40J4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- DADOS PADRÃO ---
const DEFAULT_MATERIALS: MaterialPrice[] = [
  { id: '1', name: 'Massa Poliéster (K800)', unit: 'Lata 1Kg', price: 35.00, category: 'preparation' },
  { id: '2', name: 'Massa Rápida', unit: 'Bisnaga', price: 25.00, category: 'preparation' },
  { id: '3', name: 'Lixa d\'água (Grs 80-2000)', unit: 'Folha', price: 3.50, category: 'preparation' },
  { id: '4', name: 'Disco de Lixa Roto Orbital', unit: 'Unidade', price: 4.50, category: 'preparation' },
  { id: '5', name: 'Fita Crepe Automotiva', unit: 'Rolo', price: 12.00, category: 'preparation' },
  { id: '6', name: 'Papel de Mascaramento', unit: 'Rolo', price: 45.00, category: 'preparation' },
  { id: '7', name: 'Primer PU 5.1', unit: 'Kit 900ml', price: 65.00, category: 'paint' },
  { id: '8', name: 'Tinta Base Poliéster (Nacional)', unit: 'Litro', price: 120.00, category: 'paint' },
  { id: '9', name: 'Tinta Base Poliéster (Perolizada)', unit: 'Litro', price: 160.00, category: 'paint' },
  { id: '10', name: 'Verniz Alto Sólidos', unit: 'Kit', price: 85.00, category: 'paint' },
  { id: '11', name: 'Massa de Polir', unit: 'Lata 1kg', price: 55.00, category: 'paint' },
  { id: '12', name: 'Thinner de Limpeza', unit: 'Litro', price: 22.00, category: 'consumables' },
  { id: '13', name: 'Desengraxante', unit: 'Litro', price: 28.00, category: 'consumables' },
  { id: '14', name: 'Estopa/Pano Microfibra', unit: 'Pacote', price: 15.00, category: 'consumables' }
];

export const DEFAULT_CARDS: ServiceCard[] = [
  { id: 'funilaria', title: 'FUNILARIA', imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=800&auto=format&fit=crop' },
  { id: 'pintura', title: 'PINTURA', imageUrl: 'https://plus.unsplash.com/premium_photo-1661963013277-2388b6190809?q=80&w=800&auto=format&fit=crop' },
  { id: 'polimento', title: 'POLIMENTO', imageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=800&auto=format&fit=crop' }
];

class DBService {

  // --- ORDERS (FIRESTORE) ---

  async createOrder(client: ClientData, estimate: RepairEstimate, originalImage: string, repairedImage: string | null): Promise<ServiceOrder> {
    const ordersRef = collection(db, "orders");
    const newOrderData = {
      date: new Date().toISOString(),
      status: 'pending',
      client,
      estimate,
      originalImage, // Nota: Imagens em Base64 são grandes para o Firestore. Ideal seria subir pro Storage, mas mantendo simples por enquanto.
      repairedImage
    };
    
    const docRef = await addDoc(ordersRef, newOrderData);
    return { id: docRef.id, ...newOrderData } as ServiceOrder;
  }

  async getOrders(): Promise<ServiceOrder[]> {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceOrder[];
  }

  async updateOrder(updatedOrder: ServiceOrder): Promise<void> {
    const orderRef = doc(db, "orders", updatedOrder.id);
    // Remove o ID do objeto antes de salvar
    const { id, ...data } = updatedOrder;
    await updateDoc(orderRef, data);
  }

  async deleteOrder(id: string): Promise<void> {
    await deleteDoc(doc(db, "orders", id));
  }

  // --- SETTINGS (FIRESTORE - Collection 'settings') ---

  private async getSetting(docId: string, defaultValue: any): Promise<any> {
    try {
      const docRef = doc(db, "settings", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().value;
      } else {
        // Se não existe, cria com o padrão
        await setDoc(docRef, { value: defaultValue });
        return defaultValue;
      }
    } catch (e) {
      console.error(`Error fetching setting ${docId}:`, e);
      return defaultValue;
    }
  }

  private async saveSetting(docId: string, value: any): Promise<void> {
    await setDoc(doc(db, "settings", docId), { value });
  }

  // --- MATERIALS ---

  async getMaterials(): Promise<MaterialPrice[]> {
    return this.getSetting("materials", DEFAULT_MATERIALS);
  }

  async saveMaterials(materials: MaterialPrice[]): Promise<void> {
    return this.saveSetting("materials", materials);
  }

  // --- LABOR RATE ---

  async getLaborRate(): Promise<number> {
    return this.getSetting("laborRate", 100.00);
  }

  async saveLaborRate(rate: number): Promise<void> {
    return this.saveSetting("laborRate", rate);
  }

  // --- SERVICE CARDS ---

  async getServiceCards(): Promise<ServiceCard[]> {
    return this.getSetting("serviceCards", DEFAULT_CARDS);
  }

  async saveServiceCards(cards: ServiceCard[]): Promise<void> {
    return this.saveSetting("serviceCards", cards);
  }

  // --- VIDEO URL & STORAGE ---

  async getVideoUrl(): Promise<string> {
    const defaultVideo = "https://cdn.pixabay.com/video/2022/12/13/142826-781033569_large.mp4";
    return this.getSetting("videoUrl", defaultVideo);
  }

  async saveVideoFile(file: File): Promise<string> {
    // Upload para o Firebase Storage
    const storageRef = ref(storage, `videos/presentation_${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Salva a URL no Firestore
    await this.saveSetting("videoUrl", downloadURL);
    return downloadURL;
  }

  async saveVideoUrl(url: string): Promise<void> {
    return this.saveSetting("videoUrl", url);
  }
}

export const dbService = new DBService();