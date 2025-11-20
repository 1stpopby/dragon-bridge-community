-- Insert initial Romanian content templates for the bot system
-- Run this as an authenticated admin user

INSERT INTO public.bot_content_templates (content_type, template_text, category, is_active) VALUES
-- Feed Posts
('post', 'Bună! Am ajuns recent în [city]. Cunoaște cineva un [service] bun în zonă? 🏠', NULL, true),
('post', 'Ce faceți weekendul ăsta? Caut recomandări pentru [activity] în [city] 🎉', NULL, true),
('post', 'Mulțumesc comunității RoEu pentru tot suportul! Sunteți minunați 🙏', NULL, true),
('post', 'Cineva interesat de [topic]? Aș vrea să organizez ceva în [city]', NULL, true),
('post', 'Salut! Nou în [city] și caut [product/service]. Recomandări? 😊', NULL, true),
('post', 'M-am mutat în [city] luna trecută. Ce locuri trebuie să vizitez?', NULL, true),
('post', 'Vreau să îmi fac prieteni noi în [city]. Cineva pentru [activity]?', NULL, true),
('post', 'Am găsit un [service] foarte bun în [city]. Dacă aveți nevoie, vă pot recomanda!', NULL, true),

-- Forum Topics
('forum_topic', 'Unde găsiți [product] în [city]?|Bună tuturor! Sunt în căutarea de [product] în zona [city]. Știe cineva unde pot găsi? Mulțumesc!', 'Discuții Generale', true),
('forum_topic', 'Sfaturi pentru [topic] în UK|Salut! Aș avea nevoie de câteva sfaturi legate de [topic]. Cine are experiență?', 'Sfaturi Utile', true),
('forum_topic', 'Experiențe cu [service] în [city]|Ce experiențe aveți cu [service] în [city]? Sunt în căutare și aș vrea recomandări.', 'Discuții Generale', true),
('forum_topic', 'Ajutor: Unde găsesc [product/service]?|Am nevoie de ajutor să găsesc [product/service] în [city]. Sugestii?', 'Întrebări', true),
('forum_topic', 'Locuri de vizitat în [city]|Ce locuri recomandați în [city]? Planific să ies în weekend.', 'Călătorii', true),
('forum_topic', 'Recomandări [service] în [city]|Caut un [service] de încredere în [city]. Recomandări?', 'Servicii', true),

-- Forum Replies
('forum_reply', 'Mulțumesc pentru info! Foarte util 👍', NULL, true),
('forum_reply', 'Am trecut prin asta, pot să ajut dacă vrei. Trimite-mi mesaj!', NULL, true),
('forum_reply', 'Știu exact ce zici, și eu am avut aceeași problemă în [city]', NULL, true),
('forum_reply', 'Interesant! Nu știam asta, mulțumesc pentru share', NULL, true),
('forum_reply', 'În [city] am găsit câteva opțiuni bune. Îți trimit detalii pe privat.', NULL, true),
('forum_reply', 'Am folosit un [service] foarte bun, pot să-ți recomand', NULL, true),
('forum_reply', 'Super sugestie! O să încerc și eu', NULL, true),
('forum_reply', 'Exact! Subscriu la ce zici 💯', NULL, true)
ON CONFLICT DO NOTHING;