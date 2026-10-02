# AUTO EXECUTIVE V2 ONLINE

Esta versão mantém a interface do projeto anterior e adiciona uma porta de login por MATRÍCULA + SENHA e arquivos para banco online Supabase.

## Credencial inicial
Matrícula inicial: 000001
Senha: definida no usuário do Supabase; não é armazenada neste repositório.

## Para colocar online
1. Crie um projeto no Supabase.
2. Abra SQL Editor e execute .
3. Em Authentication > Users, crie o usuário com e-mail  e a senha acima.
4. Copie o UUID do usuário e crie o perfil: 
5. Em Settings > API copie Project URL e anon public key para .
6. Publique esta pasta em uma hospedagem estática.
7. Conecte seu domínio, por exemplo .

## Importante
O domínio real não pode ser registrado por este arquivo sozinho. É preciso ter uma conta em um provedor de hospedagem e registrar/conectar um domínio. A arquitetura permite acesso de vários dispositivos porque os dados ficam no banco online, não no navegador de cada computador.
