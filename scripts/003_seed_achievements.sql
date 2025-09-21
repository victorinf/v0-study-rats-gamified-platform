-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points, requirement_type, requirement_value) VALUES
('Primeiro Passo', 'Complete sua primeira sessão de estudo', '🎯', 10, 'sessions', 1),
('Maratonista', 'Estude por 60 minutos consecutivos', '🏃‍♂️', 25, 'study_time', 60),
('Dedicado', 'Complete 10 sessões de estudo', '📚', 50, 'sessions', 10),
('Persistente', 'Mantenha uma sequência de 7 dias estudando', '🔥', 100, 'streak', 7),
('Social', 'Participe de um grupo de estudos', '👥', 20, 'group_activity', 1),
('Veterano', 'Complete 100 sessões de estudo', '🏆', 200, 'sessions', 100),
('Mestre', 'Acumule 1000 minutos de estudo', '👑', 300, 'study_time', 1000)
ON CONFLICT DO NOTHING;
