import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Cấu hình Edge Runtime để tối ưu tốc độ streaming chữ đổ về
export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { body } = await req.json();

        if (!body) {
            return new Response(JSON.stringify({ error: 'Message body is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 🚀 Khởi tạo luồng text stream từ Gemini 1.5 Flash miễn phí
        const result = streamText({
            model: google('gemini-1.5-flash'),
            system: `Bạn là Meta Calva AI, một trợ lý ảo thông minh, thân thiện và chuyên nghiệp. 
               Nhiệm vụ của bạn là hỗ trợ người dùng thử nghiệm tính năng và prompt. 
               Hãy trả lời một cách tự nhiên, ngắn gọn, súc tích bằng tiếng Việt.`,
            prompt: body,
        });

        // 🔥 CÁCH VIẾT MỚI: Dùng trực tiếp hàm tích hợp sẵn của object result
        return result.toDataStreamResponse();

    } catch (error) {
        console.error('Gemini API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}