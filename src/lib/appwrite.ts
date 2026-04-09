import { Client, Account, Databases, Storage, ID, Query } from "appwrite";

// Configuración de Appwrite usando las credenciales proporcionadas
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69109370001b43bddc48");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Función para verificar la conexión
export const verifyConnection = async () => {
  try {
    console.log("Verificando conexión con Appwrite...");
    // Intentamos obtener el estado de la cuenta (fallará con 401 si no hay sesión, 
    // pero confirma que el servidor responde y el proyecto existe)
    await account.get();
    console.log("✅ Conexión con Appwrite exitosa (Sesión activa).");
    return true;
  } catch (error: any) {
    if (error.code === 401) {
      console.log("✅ Conexión con Appwrite exitosa (Sin sesión activa).");
      return true;
    }
    console.error("❌ Error al conectar con Appwrite:", error.message);
    return false;
  }
};

export { client, account, databases, storage, ID, Query };
