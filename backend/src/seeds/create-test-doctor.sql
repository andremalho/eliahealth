-- EliaHealth — Criação do médico teste com 140 pacientes
-- Email: dra.teste@eliahealth.com
-- Senha: Teste@2026

-- Criar o hash da senha (bcrypt de "Teste@2026")
-- Hash gerado: $2b$10$qQay3C38Kad1QS7hNa475OIbcE19e1TqOWKIzFWQZz/aQApTfY2ga

INSERT INTO users (id, name, email, password, role, specialty, crm, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Dra. Maria Teste',
  'dra.teste@eliahealth.com',
  '$2b$10$qQay3C38Kad1QS7hNa475OIbcE19e1TqOWKIzFWQZz/aQApTfY2ga',
  'physician',
  'Ginecologia e Obstetricia',
  '123456-RJ',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'physician',
  specialty = 'Ginecologia e Obstetricia',
  crm = '123456-RJ';

-- Resultado:
-- Email: dra.teste@eliahealth.com
-- Senha: Teste@2026
-- CRM: 123456-RJ
-- Especialidade: Ginecologia e Obstetrícia
--
-- Para popular as 140 pacientes, faça login como admin
-- e acesse: POST /admin/seed-test-data
