'use server';

interface BibleVerse {
    number: number;
    text: string;
}

interface BibleChapter {
    book: {
        abbrev: { pt: string; };
        name: string;
        author: string;
        group: string;
        version: string;
    };
    chapter: {
        number: number;
        verses: number;
    };
    verses: BibleVerse[];
}

export type BibleChapterResult = {
    success: true;
    data: BibleChapter;
} | {
    success: false;
    error: string;
};


export async function getBibleChapter(bookAbbrev: string, chapterNum: number): Promise<BibleChapterResult> {
    const token = process.env.BIBLE_API_TOKEN;

    if (!token || token.length < 20) {
        const debugMessage = `Diagnóstico: O token da API da Bíblia${!token ? ' não foi encontrado.' : ` foi encontrado, mas tem um comprimento de ${token.length} caracteres, o que é inválido.`}`
        const errorMessage = `Não foi possível carregar o texto bíblico. A chave de acesso (BIBLE_API_TOKEN) não está configurada corretamente no ambiente do servidor. ${debugMessage} Por favor, verifique a variável de ambiente no seu projeto Vercel, garanta que ela está aplicada ao ambiente de produção e faça um novo deploy.`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }
    
    try {
        const response = await fetch(`https://www.abibliadigital.com.br/api/verses/nvi/${bookAbbrev}/${chapterNum}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 86400 } // Cache for 1 day, but allow revalidation
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to fetch bible chapter: ${bookAbbrev} ${chapterNum}. Status: ${response.status}. Body: ${errorBody}`);
            
            if (response.status === 401) {
                const tokenPreview = token.length > 10 ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : token;
                const debugMessage = `Diagnóstico: O token foi rejeitado. Comprimento no servidor: ${token.length} caracteres. Início e fim do token no servidor: "${tokenPreview}". Verifique se o token foi copiado e colado por completo na Vercel.`
                return { success: false, error: `Falha ao buscar o capítulo ${chapterNum} de ${bookAbbrev}. A API retornou o status 401 (Não Autorizado). ${debugMessage}` };
            }

            return { success: false, error: `Falha ao buscar o capítulo ${chapterNum} de ${bookAbbrev}. A API retornou o status ${response.status}.` };
        }

        const data: BibleChapter = await response.json();
        return { success: true, data };
    } catch(e: any) {
        console.error("Network or other error fetching from bible API", e);
        return { success: false, error: `Ocorreu um erro de rede ao tentar buscar o capítulo: ${e.message}` };
    }
}
