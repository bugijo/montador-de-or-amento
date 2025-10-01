const fs = require('fs');

try {
    // Ler a string base64 completa
    const templateBase64 = fs.readFileSync('template_base64.txt', 'utf8').trim();
    console.log('String base64 lida com sucesso. Tamanho:', templateBase64.length);

    // Ler o arquivo PDFGenerator.js atual
    const pdfGeneratorContent = fs.readFileSync('js/PDFGenerator.js', 'utf8');
    console.log('Arquivo PDFGenerator.js lido com sucesso');

    // Substituir a string TEMPLATE_BASE64 pela versão completa
    const updatedContent = pdfGeneratorContent.replace(
        /const TEMPLATE_BASE64 = '[^']*'/,
        `const TEMPLATE_BASE64 = '${templateBase64}'`
    );

    // Verificar se a substituição foi feita
    if (updatedContent === pdfGeneratorContent) {
        console.log('ERRO: Nenhuma substituição foi feita. Padrão não encontrado.');
        
        // Tentar encontrar onde está a string atual
        const match = pdfGeneratorContent.match(/const TEMPLATE_BASE64 = '([^']*)'/);
        if (match) {
            console.log('String atual encontrada com tamanho:', match[1].length);
            console.log('Primeiros 100 caracteres:', match[1].substring(0, 100));
        } else {
            console.log('Padrão TEMPLATE_BASE64 não encontrado no arquivo');
        }
    } else {
        // Escrever o arquivo atualizado
        fs.writeFileSync('js/PDFGenerator.js', updatedContent, 'utf8');
        console.log('String TEMPLATE_BASE64 substituída com sucesso!');
        console.log('Tamanho da nova string:', templateBase64.length);
        
        // Verificar se a substituição foi bem-sucedida
        const verifyContent = fs.readFileSync('js/PDFGenerator.js', 'utf8');
        const verifyMatch = verifyContent.match(/const TEMPLATE_BASE64 = '([^']*)'/);
        if (verifyMatch) {
            console.log('Verificação: Nova string tem tamanho:', verifyMatch[1].length);
        }
    }

} catch (error) {
    console.error('Erro durante a execução:', error.message);
}