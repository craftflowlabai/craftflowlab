import { z } from "zod";
import { createPublicServerClient } from "@/lib/supabase/public-server";

const bookingSchema = z.object({
  sessionId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(30),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Невалидна заявка." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Проверете името, телефона и съгласието за обработка на данните." }, { status: 400 });

  const supabase = createPublicServerClient();
  const { data, error } = await supabase.rpc("create_guest_booking", {
    p_session_id: parsed.data.sessionId,
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email || null,
  });

  if (error) {
    const full = /full|no longer available/i.test(error.message);
    const duplicate = /already has a booking/i.test(error.message);
    return Response.json({ error: full ? "Този час вече няма свободни места. Изберете друг." : duplicate ? "Вече има записване с този телефон за този час." : "Не успях да запазя часа. Проверете данните и опитайте отново." }, { status: full ? 409 : duplicate ? 409 : 400 });
  }

  return Response.json({ bookingId: data, confirmed: true }, { headers: { "Cache-Control": "no-store" } });
}
