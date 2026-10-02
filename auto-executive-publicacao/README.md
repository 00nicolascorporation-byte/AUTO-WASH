# AUTO EXECUTIVE — versão pronta para publicação

## Estrutura

```text
index.html
css/
  style.css
js/
  app.js
  config.js
supabase-schema.sql
README.md
README-V2.md
```

## Publicação

O arquivo `index.html` deve ficar na raiz da publicação, com `css/` e `js/` no mesmo nível.

Não coloque a pasta inteira dentro de outra pasta. A publicação deve resultar em:

- `/index.html`
- `/css/style.css`
- `/js/app.js`
- `/js/config.js`

## Supabase

`js/config.js` já está preenchido com a URL do projeto e a chave pública do Supabase fornecidas para este projeto.

Nunca substitua a chave pública por uma `service_role` ou outra chave secreta.

## Login

A tela de login usa a matrícula para formar o e-mail no formato:

`matricula.000001@autoexecutive.local`

Portanto, o usuário correspondente precisa existir no Supabase Authentication com esse e-mail e a senha definida por você.

O Dashboard é a própria página `index.html`. Não existe e não deve ser criado `dashboard.html`.

## Importante sobre os dados

A interface atual mantém os dados operacionais no `localStorage` do navegador. O Supabase nesta versão é usado para autenticação. Assim, o login pode funcionar em vários dispositivos, mas os dados criados dentro do Dashboard ainda não são sincronizados entre dispositivos.
