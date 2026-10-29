ALTER POLICY sessions_public_published
  ON public.sessions
  TO anon, authenticated
  USING (status = 'published');

INSERT INTO public.session_categories (slug, name, description, sort_order)
SELECT
  'personal-coaching',
  'Personal Coaching',
  'One-to-one and semi-private coaching focused on individual goals and steady progress.',
  COALESCE((SELECT MAX(sort_order) + 10 FROM public.session_categories), 10)
WHERE NOT EXISTS (
  SELECT 1 FROM public.session_categories
  WHERE slug = 'personal-coaching' OR name = 'Personal Coaching'
)
ON CONFLICT DO NOTHING;

UPDATE public.session_types AS st
SET category_id = c.id, category = c.name
FROM public.session_categories AS c
WHERE st.slug = 'one-to-one-coaching'
  AND c.slug = 'personal-coaching'
  AND st.category_id IS NULL;

INSERT INTO public.session_types
  (slug, title, description, duration_minutes, default_capacity, default_price, currency, category, category_id)
SELECT
  'hiit-conditioning',
  'HIIT Conditioning',
  'Coach-led intervals mix cardio and bodyweight strength, with a low-impact option for every block.',
  45, 8, 22, 'EUR', c.name, c.id
FROM public.session_categories AS c
WHERE c.slug = 'hiit-cardio'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.session_types
  (slug, title, description, duration_minutes, default_capacity, default_price, currency, category, category_id)
SELECT
  'semi-private-coaching',
  'Semi-Private Coaching',
  'Small-group personal coaching with individual form guidance and progressions for each participant.',
  45, 4, 35, 'EUR', c.name, c.id
FROM public.session_categories AS c
WHERE c.slug = 'personal-coaching'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.session_types
  (slug, title, description, duration_minutes, default_capacity, default_price, currency, category, category_id)
SELECT
  'first-session-assessment',
  'First Session Assessment',
  'A one-to-one introduction to discuss your goals, review movement basics, and agree on a realistic starting plan.',
  30, 1, 25, 'EUR', c.name, c.id
FROM public.session_categories AS c
WHERE c.slug = 'personal-coaching'
ON CONFLICT (slug) DO NOTHING;

WITH demo_sessions(session_type_slug, title, description, local_start) AS (
  VALUES
    ('hiit-conditioning', 'HIIT Conditioning · Low Impact',
     'Coach-led cardio and bodyweight intervals with low-impact options throughout. Choose your pace and finish with a short cool-down.',
     timestamp '2026-10-30 18:30:00'),
    ('strength-foundations', 'Strength Foundations · Full Body',
     'A coached full-body session built around simple strength patterns, thoughtful technique, and options for different experience levels.',
     timestamp '2026-10-31 08:30:00'),
    ('mobility-reset', 'Mobility Reset · Hips & Back',
     'A guided mobility session for hips and back, combining controlled range-of-motion work with a relaxed recovery finish.',
     timestamp '2026-11-01 10:00:00'),
    ('semi-private-coaching', 'Semi-Private Coaching · Strength Circuit',
     'Small-group coaching with individual technique cues through a balanced circuit of strength movements.',
     timestamp '2026-11-02 07:30:00'),
    ('strength-foundations', 'Strength Foundations · Progressive Lift',
     'Build confidence with foundational lifts and clear progressions. The coach will adapt loading and variations to your level.',
     timestamp '2026-11-02 18:30:00'),
    ('hiit-conditioning', 'HIIT Conditioning · Express Intervals',
     'A time-efficient interval session that alternates cardio and strength, with scalable work and recovery periods.',
     timestamp '2026-11-03 07:30:00'),
    ('one-to-one-coaching', 'Personal Training · Goal Session',
     'Focused one-to-one coaching shaped around your priorities, with time for technique feedback and a practical next step.',
     timestamp '2026-11-04 18:30:00'),
    ('mobility-reset', 'Mobility Reset · Morning Flow',
     'Start the day with guided mobility, balance, and breathing work to support comfortable movement and recovery.',
     timestamp '2026-11-05 07:30:00'),
    ('hiit-conditioning', 'HIIT Conditioning · Full Body',
     'A coached full-body interval workout combining cardio and strength blocks, with low-impact alternatives available.',
     timestamp '2026-11-06 18:30:00'),
    ('first-session-assessment', 'First Session · Goals & Movement',
     'An introductory one-to-one session to talk through your goals, explore movement basics, and choose a comfortable starting point.',
     timestamp '2026-11-07 10:00:00')
)
INSERT INTO public.sessions
  (session_type_id, title, description, starts_at, ends_at, timezone, max_slots, booked_slots, price, currency, location, status)
SELECT
  st.id,
  d.title,
  d.description,
  d.local_start AT TIME ZONE 'Europe/Sofia',
  (d.local_start + (st.duration_minutes * interval '1 minute')) AT TIME ZONE 'Europe/Sofia',
  'Europe/Sofia',
  st.default_capacity,
  0,
  st.default_price,
  st.currency,
  'Studio North',
  'published'
FROM demo_sessions AS d
JOIN public.session_types AS st ON st.slug = d.session_type_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.sessions AS s
  WHERE s.title = d.title
    AND s.starts_at = d.local_start AT TIME ZONE 'Europe/Sofia'
);

