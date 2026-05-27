import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "matelab";

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global.mongoClientPromise) {
      global.mongoClientPromise = createClient();
    }

    return global.mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = createClient();
  }

  return clientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}

function createClient() {
  const client = new MongoClient(uri as string, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  return client.connect();
}
