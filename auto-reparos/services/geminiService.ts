import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RepairEstimate, MaterialPrice } from "../types";

// Initialize the client with the API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a visualized repair of the car image.
 * Uses gemini-2.5-flash-image to edit/generate the "after" state.
 */
export const generateRepairVisualization = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: 'Make this car look completely repaired, shiny, and new. Remove all dents, scratches, and rust. Keep the same color and lighting. Photorealistic result.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating repair visualization:", error);
    throw error;
  }
};

/**
 * Analyzes the damage and generates a cost estimate in JSON format.
 * Uses gemini-2.5-flash for text/json generation.
 * Now accepts a list of admin-defined prices to inform the estimate.
 * Also accepts laborRate for precise labor cost calculation.
 */
export const generateDamageEstimate = async (base64Image: string, materialPrices: MaterialPrice[], laborRate: number = 100): Promise<RepairEstimate> => {
  try {
    // Convert price list to a string for the prompt
    const priceListContext = materialPrices.map(m => `- ${m.name} (${m.unit}): R$ ${m.price.toFixed(2)}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Você é um especialista em funilaria e pintura automotiva no Brasil. 
            Analise a imagem do carro danificado.
            Identifique os danos visíveis.
            
            USE A SEGUINTE TABELA DE PREÇOS BASE DA OFICINA PARA CALCULAR MATERIAIS:
            ${priceListContext}
            
            Se precisar de materiais não listados, estime com preço de mercado.
            
            PARA CÁLCULO DE MÃO DE OBRA:
            Utilize o valor base de R$ ${laborRate.toFixed(2)} por hora técnica.
            
            Liste as peças que precisam de reparo ou troca.
            Liste os materiais necessários (quantidade aproximada baseada no dano x preço unitário da tabela).
            Estime as horas de trabalho e calcule o custo (horas * ${laborRate}).
            Estime os custos em Reais (BRL).
            
            Retorne APENAS JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Resumo técnico dos danos encontrados.",
            },
            parts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  estimatedPrice: { type: Type.NUMBER, description: "Preço em BRL" },
                },
              },
            },
            materials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  estimatedPrice: { type: Type.NUMBER, description: "Preço calculado (Qtd x Valor Unitário) em BRL" },
                },
              },
            },
            laborHours: { type: Type.NUMBER },
            laborCost: { type: Type.NUMBER, description: "Custo total de mão de obra em BRL (Horas x Taxa)" },
            totalEstimate: { type: Type.NUMBER, description: "Soma total de peças, materiais e mão de obra" },
          },
          required: ["summary", "parts", "materials", "laborHours", "laborCost", "totalEstimate"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text response from estimate model");
    
    return JSON.parse(text) as RepairEstimate;
  } catch (error) {
    console.error("Error generating estimate:", error);
    throw error;
  }
};