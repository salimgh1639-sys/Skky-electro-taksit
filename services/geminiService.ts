import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const askProductQuestion = async (product: Product, question: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "عذراً، خدمة الذكاء الاصطناعي غير متوفرة حالياً.";

  const prompt = `
    أنت مساعد مبيعات ذكي في تطبيق "DzInstallments" في الجزائر.
    
    المنتج الحالي:
    الاسم: ${product.name}
    الماركة: ${product.brand}
    الوصف: ${product.description}
    السعر الإجمالي: ${product.totalPrice} دج
    خطة التقسيط: ${product.plan.monthlyPrice} دج لمدة ${product.plan.months} أشهر
    المميزات: ${product.features.join(', ')}

    سؤال العميل: ${question}

    أجب باختصار وباللهجة الجزائرية البيضاء المهذبة أو العربية الفصحى المبسطة. ركز على إقناع الزبون.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "لم أستطع الحصول على إجابة، يرجى المحاولة لاحقاً.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.";
  }
};