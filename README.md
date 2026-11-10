# Roque Tattoo Ink · App de gestão

App de gestão para tatuadores (piloto: Roque Tattoo Ink). Esta primeira versão real cobre a **gestão financeira**:

- Login de verdade (e-mail e senha, com criação de conta e "esqueci minha senha").
- **+ Lançar** entradas e saídas, com categoria, forma de pagamento, data e descrição. Dá para editar e excluir.
- **Entrou × saiu**: fluxo de caixa do mês e dos últimos 6 meses.
- **Para onde vai o dinheiro**: rosca e "de cada R$ 100 que entraram", maiores gastos.
- **Lucro real**: faturamento − custos fixos − variáveis − impostos = lucro do estúdio; retiradas e gastos pessoais aparecem separados. Ponto de equilíbrio.
- **Relatório financeiro** mês a mês e ano todo (comparando com o ano anterior quando houver dados).
- **Custos do estúdio**: fixos, variáveis e impostos.

Layout e identidade visual seguem o protótipo (`Tattoo Studio App.dc.html`).

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev
```

Sem `.env.local`, o app abre em **modo demonstração** e guarda os dados só no navegador.

## Banco de dados (Supabase)

1. No painel do Supabase, abra **SQL Editor** e rode o arquivo `supabase/schema.sql`.
2. Em **Authentication → URL Configuration**, coloque o endereço onde o app ficar no ar  em *Site URL*.
3. Copie *Project URL* e a chave *anon public* (Project Settings → API) para as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Cada usuário só vê os próprios lançamentos (Row Level Security).

## Publicar (GitHub Pages, grátis)

Cada push na branch `main` gera o site pelo GitHub Actions (`.github/workflows/pages.yml`).
Endereço: https://felipeszwec.github.io/roque-tattoo-app/
