import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embedding.js";
import dotenv from "dotenv"
dotenv.config()
export const vectorStore = async (docs, collectionName) => {
  const options = {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    collectionName
  };

  if (process.env.QDRANT_API_KEY) {
    options.apiKey = process.env.QDRANT_API_KEY;
  }

  return await QdrantVectorStore.fromDocuments(docs, embeddings, options);
};