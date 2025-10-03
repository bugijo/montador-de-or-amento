# 📋 Gerador de Orçamentos - Finiti
## Instruções para Vendedoras

### 🚀 Como Instalar e Usar

#### Opção 1: Usar Diretamente (Mais Fácil)
1. **Baixe a pasta completa** do projeto
2. **Instale o Node.js** no seu computador (se não tiver):
   - Acesse: https://nodejs.org
   - Baixe a versão LTS (recomendada)
   - Instale normalmente

3. **Abra o prompt de comando** na pasta do projeto:
   - Clique com botão direito na pasta
   - Selecione "Abrir no Terminal" ou "Abrir Prompt de Comando"

4. **Execute os comandos**:
   ```
   npm install
   npm run electron
   ```

5. **Pronto!** O aplicativo abrirá como um programa normal do Windows

#### Opção 2: Gerar Executável (Para Distribuição)
1. **Para criar um arquivo .exe** que pode ser instalado em qualquer computador:
   ```
   npm run build-win
   ```

2. **O instalador será criado** na pasta `dist/`
3. **Distribua o arquivo** `Gerador de Orçamentos - Finiti Setup.exe`
4. **As vendedoras só precisam** executar o instalador

### 📱 Como Usar o Aplicativo

#### 1. **Dados do Cliente**
- Preencha o nome do cliente
- Selecione a data do orçamento

#### 2. **Calculadora de Insumos**
- Escolha a máquina na lista
- Digite os metros quadrados
- Clique em "Calcular Insumos"

#### 3. **Adicionar Itens**
- Os itens calculados aparecerão automaticamente
- Você pode adicionar itens extras manualmente
- Edite quantidades se necessário

#### 4. **Gerar PDF**
- Clique em "Gerar PDF"
- O orçamento será baixado automaticamente
- Arquivo terá a arte da Finiti como fundo

### 🎯 Recursos do Aplicativo

✅ **Interface Profissional** - Design limpo e fácil de usar
✅ **Cálculos Automáticos** - Baseados nas máquinas da Finiti
✅ **PDF com Arte** - Orçamentos com visual profissional
✅ **Funciona Offline** - Não precisa de internet
✅ **Dados Seguros** - Tudo fica no computador local

### 🔧 Solução de Problemas

**Se o aplicativo não abrir:**
1. Verifique se o Node.js está instalado
2. Execute `npm install` novamente
3. Tente `npm run electron-dev` para modo de desenvolvimento

**Se der erro no PDF:**
1. Verifique se os arquivos `orçamento.png` e `logo2.png` estão na pasta
2. Recarregue o aplicativo (Ctrl+R)

**Para atualizar o aplicativo:**
1. Substitua os arquivos pela nova versão
2. Execute `npm install` novamente
3. Execute `npm run electron`

### 📞 Suporte
Em caso de dúvidas, entre em contato com o suporte técnico.

---
**Finiti Equipamentos para Construção**  
*Gerador de Orçamentos v1.0.0*