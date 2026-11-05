import { z } from "zod";
import { createPublicServerClient } from "@/lib/supabase/public-server";

const handoffSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(30),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  message: z.string().trim().max(1200).optional().default(""),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Невалидна заявка." }, { status: 400 });
  }

  const parsed = handoffSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Проверете името, телефона и съгласието за предаване към екипа." }, { status: 400 });

  const supabase = createPublicServerClient();
  const { data, error } = await supabase.rpc("submit_receptionist_handoff", {
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email || null,
    p_message: parsed.data.message,
  });

  if (error) {
    const limited = /wait before sending another/i.test(error.message);
    return Response.json({ error: limited ? "Изпратихте няколко заявки. Моля, опитайте отново след малко." : "Не успях да предам заявката. Опитайте отново." }, { status: limited ? 429 : 400 });
  }

  return Response.json({ handoffId: data, submitted: true }, { headers: { "Cache-Control": "no-store" } });
}
