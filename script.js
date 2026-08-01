/* ============================================
   LIVRINHO INFANTIL DIGITAL - SCRIPT PRINCIPAL
   ============================================ */

// Estado do Aplicativo
const estado = {
    telaAtual: 'inicio',
    historiaAtual: null,
    dadosHistoria: null,
    paginaAtual: 0,
    modoNoite: false,
    favoritos: JSON.parse(localStorage.getItem('favoritos')) || [],
    narrazioneAtiva: false,
    musicaTocando: false,
    velocidadeFala: 0.9,
    categoriaAtual: 'todas'
};

// Lista de histórias disponíveis
const historias = [
    {
        id: 'coelhinho-amizade',
        titulo: 'O Coelhinho e a Amizade',
        emoji: '🐰',
        categoria: 'amizade',
        arquivo: 'historias/coelhinho-amizade.json'
    },
    {
        id: 'gatinho-aventura',
        titulo: 'O Gatinho Aventureiro',
        emoji: '🐱',
        categoria: 'aventura',
        arquivo: 'historias/gatinho-aventura.json'
    },
    {
        id: 'cachorrinho-festa',
        titulo: 'A Festa do Cachorrinho',
        emoji: '🐶',
        categoria: 'animais',
        arquivo: 'historias/cachorrinho-festa.json'
    }
];

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
});

function inicializarApp() {
    carregarHistorias();
    configurarEventos();
    verificarModoNoite();
    configurarCategorias();
    configurarVozes();
}

// ============================================
// CARREGAMENTO DE HISTÓRIAS
// ============================================
function carregarHistorias(categoria = 'todas') {
    const galeria = document.querySelector('.galeria-historias');
    if (!galeria) return;
    
    galeria.innerHTML = '';
    
    const historiasFiltradas = categoria === 'todas' 
        ? historias 
        : historias.filter(h => h.categoria === categoria);
    
    historiasFiltradas.forEach(historia => {
        const card = criarCardHistoria(historia);
        galeria.appendChild(card);
    });
}

function criarCardHistoria(historia) {
    const card = document.createElement('div');
    card.className = 'card-historia';
    card.dataset.id = historia.id;
    card.dataset.categoria = historia.categoria;
    
    const ehFavorito = estado.favoritos.includes(historia.id);
    
    card.innerHTML = `
        <span class="emoji-capa">${historia.emoji}</span>
        <h3>${historia.titulo}</h3>
        <span class="qtd-paginas">3 páginas</span>
        ${ehFavorito ? '<span class="favorito-badge">❤️</span>' : ''}
    `;
    
    card.addEventListener('click', () => abrirHistoria(historia));
    
    return card;
}

// ============================================
// CATEGORIAS
// ============================================
function configurarCategorias() {
    const botoesCategoria = document.querySelectorAll('.btn-categoria');
    
    botoesCategoria.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesCategoria.forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');
            const categoria = btn.dataset.categoria;
            estado.categoriaAtual = categoria;
            carregarHistorias(categoria);
        });
    });
}

// ============================================
// ABERTURA DE HISTÓRIA
// ============================================
async function abrirHistoria(historia) {
    estado.historiaAtual = historia;
    estado.paginaAtual = 0;
    
    try {
        const response = await fetch(historia.arquivo);
        if (!response.ok) throw new Error('Erro ao carregar');
        const dados = await response.json();
        
        estado.dadosHistoria = dados;
        
        document.getElementById('tituloHistoria').textContent = dados.titulo;
        
        alternarTela('leitura');
        renderizarPagina();
        atualizarFavorito();
        
        if (estado.narrazioneAtiva) {
            setTimeout(() => narrarPaginaAtual(), 500);
        }
        
    } catch (erro) {
        console.error('Erro ao carregar história:', erro);
        alert('Erro ao carregar a história. Verifique se os arquivos JSON existem.');
    }
}

// ============================================
// RENDERIZAÇÃO DE PÁGINAS
// ============================================
function renderizarPagina() {
    if (!estado.dadosHistoria) return;
    
    const pagina = estado.dadosHistoria.paginas[estado.paginaAtual];
    mostrarPagina(pagina);
    atualizarNavegacao();
    atualizarProgresso();
    
    if (estado.narrazioneAtiva) {
        setTimeout(() => narrarPaginaAtual(), 300);
    }
}

function mostrarPagina(pagina) {
    const textoHistoria = document.getElementById('textoHistoria');
    const ilustracao = document.getElementById('ilustracao');
    const emojiDecoracao = document.getElementById('emojiDecoracao');
    
    if (textoHistoria) textoHistoria.innerText = pagina.texto;
    
    if (ilustracao) {
        ilustracao.innerHTML = `
            <img src="${pagina.imagem}" 
                 alt="Ilustração"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <span class="ilustracao-placeholder" style="display:none">${pagina.emojiDecoracao || '📖'}</span>
        `;
    }
    
    if (emojiDecoracao) emojiDecoracao.innerText = pagina.emojiDecoracao || '';
}

function atualizarNavegacao() {
    const totalPaginas = estado.dadosHistoria.paginas.length;
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    const btnProximo = document.getElementById('btnProximaPagina');
    const indicador = document.getElementById('indicadorPagina');
    
    if (btnAnterior) btnAnterior.disabled = estado.paginaAtual === 0;
    if (btnProximo) btnProximo.disabled = estado.paginaAtual === totalPaginas - 1;
    if (indicador) indicador.textContent = `${estado.paginaAtual + 1} / ${totalPaginas}`;
}

function atualizarProgresso() {
    const totalPaginas = estado.dadosHistoria.paginas.length;
    const progresso = ((estado.paginaAtual + 1) / totalPaginas) * 100;
    const barraProgresso = document.getElementById('progresso');
    if (barraProgresso) barraProgresso.style.width = `${progresso}%`;
}

// ============================================
// NAVEGAÇÃO ENTRE PÁGINAS
// ============================================
function paginaAnterior() {
    if (estado.paginaAtual > 0) {
        pararNarracao();
        estado.paginaAtual--;
        renderizarPagina();
    }
}

function proximaPagina() {
    const totalPaginas = estado.dadosHistoria ? estado.dadosHistoria.paginas.length : 0;
    
    if (estado.paginaAtual < totalPaginas - 1) {
        pararNarracao();
        estado.paginaAtual++;
        renderizarPagina();
    }
}

// ============================================
// CONTROLE DE TELAS
// ============================================
function alternarTela(tela) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    
    const telaElemento = document.getElementById(`tela-${tela}`);
    if (telaElemento) {
        telaElemento.classList.add('ativa');
        estado.telaAtual = tela;
    }
}

function voltarParaInicio() {
    pararNarracao();
    alternarTela('inicio');
    estado.historiaAtual = null;
    estado.dadosHistoria = null;
}

// ============================================
// MODO NOITE
// ============================================
function toggleModoNoite() {
    estado.modoNoite = !estado.modoNoite;
    document.body.classList.toggle('modo-noite', estado.modoNoite);
    
    const btnModoNoite = document.getElementById('btnModoNoite');
    if (btnModoNoite) btnModoNoite.textContent = estado.modoNoite ? '☀️' : '🌙';
    
    localStorage.setItem('modoNoite', estado.modoNoite);
}

function verificarModoNoite() {
    const modoSalvo = localStorage.getItem('modoNoite') === 'true';
    if (modoSalvo) {
        estado.modoNoite = true;
        document.body.classList.add('modo-noite');
        const btn = document.getElementById('btnModoNoite');
        if (btn) btn.textContent = '☀️';
    }
}

// ============================================
// FAVORITOS
// ============================================
function toggleFavorito() {
    if (!estado.historiaAtual) return;
    
    const id = estado.historiaAtual.id;
    const indice = estado.favoritos.indexOf(id);
    
    if (indice === -1) {
        estado.favoritos.push(id);
    } else {
        estado.favoritos.splice(indice, 1);
    }
    
    localStorage.setItem('favoritos', JSON.stringify(estado.favoritos));
    atualizarFavorito();
}

function atualizarFavorito() {
    if (!estado.historiaAtual) return;
    
    const btnFavorito = document.getElementById('btnFavorito');
    const ehFavorito = estado.favoritos.includes(estado.historiaAtual.id);
    
    if (btnFavorito) {
        btnFavorito.textContent = ehFavorito ? '❤️' : '🤍';
        btnFavorito.classList.toggle('favorito-ativo', ehFavorito);
    }
}

// ============================================
// NARRAÇÃO (SpeechSynthesis)
// ============================================
function toggleNarracao() {
    estado.narrazioneAtiva = !estado.narrazioneAtiva;
    
    const btnNarrazione = document.getElementById('btnNarrazione');
    if (btnNarrazione) btnNarrazione.classList.toggle('tocando', estado.narrazioneAtiva);
    
    if (estado.narrazioneAtiva) {
        narrarPaginaAtual();
    } else {
        pararNarracao();
    }
}

function narrarPaginaAtual() {
    if (!estado.dadosHistoria || !('speechSynthesis' in window)) return;
    
    const pagina = estado.dadosHistoria.paginas[estado.paginaAtual];
    
    if (pagina.naracao) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(pagina.naracao);
        utterance.lang = 'pt-BR';
        utterance.rate = estado.velocidadeFala;
        utterance.pitch = 1.2;
        
        const vozes = window.speechSynthesis.getVoices();
        const vozPt = vozes.find(v => v.lang.includes('pt'));
        if (vozPt) utterance.voice = vozPt;
        
        window.speechSynthesis.speak(utterance);
    }
}

function pararNarracao() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function configurarVozes() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
}

// ============================================
// MÚSICA DE FUNDO (Simples)
// ============================================
function toggleMusica() {
    estado.musicaTocando = !estado.musicaTocando;
    
    const btnMusica = document.getElementById('btnMusica');
    const btnMusicaGlobal = document.getElementById('btnMusicaGlobal');
    
    if (btnMusica) btnMusica.classList.toggle('tocando', estado.musicaTocando);
    if (btnMusicaGlobal) btnMusicaGlobal.classList.toggle('tocando', estado.musicaTocando);
    
    // Apenas visual por enquanto
    if (estado.musicaTocando) {
        console.log('🎵 Música de fundo ativada');
    } else {
        console.log('🔇 Música de fundo desativada');
    }
}

// ============================================
// EVENTOS
// ============================================
function configurarEventos() {
    // Navegação
    const btnVoltar = document.getElementById('btnVoltar');
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    const btnProximo = document.getElementById('btnProximaPagina');
    
    if (btnVoltar) btnVoltar.addEventListener('click', voltarParaInicio);
    if (btnAnterior) btnAnterior.addEventListener('click', paginaAnterior);
    if (btnProximo) btnProximo.addEventListener('click', proximaPagina);
    
    // Controles de áudio
    const btnNarrazione = document.getElementById('btnNarrazione');
    const btnAudio = document.getElementById('btnAudio');
    const btnMusica = document.getElementById('btnMusica');
    const btnMusicaGlobal = document.getElementById('btnMusicaGlobal');
    
    if (btnNarrazione) btnNarrazione.addEventListener('click', toggleNarracao);
    if (btnAudio) btnAudio.addEventListener('click', () => narrarPaginaAtual());
    if (btnMusica) btnMusica.addEventListener('click', toggleMusica);
    if (btnMusicaGlobal) btnMusicaGlobal.addEventListener('click', toggleMusica);
    
    // Outros controles
    const btnModoNoite = document.getElementById('btnModoNoite');
    const btnFavorito = document.getElementById('btnFavorito');
    
    if (btnModoNoite) btnModoNoite.addEventListener('click', toggleModoNoite);
    if (btnFavorito) btnFavorito.addEventListener('click', toggleFavorito);
    
    // Controle de velocidade
    const velocidadeInput = document.getElementById('velocidadeFala');
    const velocidadeValor = document.getElementById('velocidadeValor');
    
    if (velocidadeInput) {
        velocidadeInput.addEventListener('input', (e) => {
            estado.velocidadeFala = parseFloat(e.target.value);
            if (velocidadeValor) velocidadeValor.textContent = `${estado.velocidadeFala.toFixed(1)}x`;
        });
    }
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
        if (estado.telaAtual === 'leitura') {
            if (e.key === 'ArrowLeft') {
                paginaAnterior();
            } else if (e.key === 'ArrowRight') {
                proximaPagina();
            } else if (e.key === 'Escape') {
                voltarParaInicio();
            } else if (e.key === ' ') {
                e.preventDefault();
                toggleNarracao();
            }
        }
    });
    
    // Swipe para dispositivos móveis
    let touchStartX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (estado.telaAtual === 'leitura' && Math.abs(diff) > 50) {
            if (diff > 0) {
                proximaPagina();
            } else {
                paginaAnterior();
            }
        }
    }, false);
}

// Exportar funções
window.livrinhoApp = {
    abrirHistoria,
    paginaAnterior,
    proximaPagina,
    voltarParaInicio,
    toggleModoNoite,
    toggleNarracao,
    toggleMusica,
    toggleFavorito
};
