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
    narrazioneAttiva: false,
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
        arquivo: 'historias/coelhinho-amizade.json',
        corTema: '#FFB6C1'
    },
    {
        id: 'gatinho-aventura',
        titulo: 'O Gatinho Aventureiro',
        emoji: '🐱',
        categoria: 'aventura',
        arquivo: 'historias/gatinho-aventura.json',
        corTema: '#87CEEB'
    },
    {
        id: 'cachorrinho-festa',
        titulo: 'A Festa do Cachorrinho',
        emoji: '🐶',
        categoria: 'animais',
        arquivo: 'historias/cachorrinho-festa.json',
        corTema: '#98FB98'
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
}

// ============================================
// CARREGAMENTO DE HISTÓRIAS
// ============================================
function carregarHistorias(categoria = 'todas') {
    const galeria = document.querySelector('.galeria-historias');
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
            // Remover ativa de todos
            botoesCategoria.forEach(b => b.classList.remove('ativa'));
            
            // Adicionar ativa ao clicado
            btn.classList.add('ativa');
            
            // Filtrar histórias
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
        const dados = await response.json();
        
        estado.dadosHistoria = dados;
        
        document.getElementById('tituloHistoria').textContent = dados.titulo;
        
        alternarTela('leitura');
        renderizarPagina();
        atualizarFavorito();
        
        // Iniciar narração automática se estiver ativa
        if (estado.narrazioneAttiva) {
            setTimeout(() => narrarPaginaAtual(), 500);
        }
        
    } catch (erro) {
        console.error('Erro ao carregar história:', erro);
        alert('Erro ao carregar a história. Tente novamente.');
    }
}

// ============================================
// RENDERIZAÇÃO DE PÁGINAS
// ============================================
function renderizarPagina() {
    const pagina = estado.dadosHistoria.paginas[estado.paginaAtual];
    
    mostrarPagina(pagina);
    atualizarNavegacao();
    atualizarProgresso();
    
    // Narração automática ao mudar de página
    if (estado.narrazioneAttiva) {
        setTimeout(() => narrarPaginaAtual(), 300);
    }
}

function mostrarPagina(pagina) {
    const textoHistoria = document.getElementById('textoHistoria');
    const ilustracao = document.getElementById('ilustracao');
    const emojiDecoracao = document.getElementById('emojiDecoracao');
    
    // Animação de fade out
    textoHistoria.style.opacity = '0';
    ilustracao.style.opacity = '0';
    
    setTimeout(() => {
        // Atualizar conteúdo
        textoHistoria.innerText = pagina.texto;
        
        ilustracao.innerHTML = `
            <img src="${pagina.imagem}" 
                 alt="Ilustração"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <span class="ilustracao-placeholder" style="display:none">${pagina.emojiDecoracao || '📖'}</span>
        `;
        
        emojiDecoracao.innerText = pagina.emojiDecoracao || '';
        
        // Animação de fade in
        textoHistoria.style.opacity = '1';
        ilustracao.style.opacity = '1';
    }, 200);
}

function atualizarNavegacao() {
    const totalPaginas = estado.dadosHistoria.paginas.length;
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    const btnProximo = document.getElementById('btnProximaPagina');
    const indicador = document.getElementById('indicadorPagina');
    
    btnAnterior.disabled = estado.paginaAtual === 0;
    btnProximo.disabled = estado.paginaAtual === totalPaginas - 1;
    
    indicador.textContent = `${estado.paginaAtual + 1} / ${totalPaginas}`;
}

function atualizarProgresso() {
    const totalPaginas = estado.dadosHistoria.paginas.length;
    const progresso = ((estado.paginaAtual + 1) / totalPaginas) * 100;
    
    document.getElementById('progresso').style.width = `${progresso}%`;
}

// ============================================
// NAVEGAÇÃO ENTRE PÁGINAS
// ============================================
function paginaAnterior() {
    if (estado.paginaAtual > 0) {
        animarTransicao('anterior', () => {
            estado.paginaAtual--;
            renderizarPagina();
        });
    }
}

function proximaPagina() {
    const totalPaginas = estado.dadosHistoria.paginas.length;
    
    if (estado.paginaAtual < totalPaginas - 1) {
        animarTransicao('proximo', () => {
            estado.paginaAtual++;
            renderizarPagina();
        });
    }
}

function animarTransicao(direcao, callback) {
    const livro = document.querySelector('.livro');
    
    // Parar narração ao mudar de página
    pararNarracao();
    
    // Aplicar animação de saída
    livro.classList.add(`animacao-sair-${direcao === 'proximo' ? 'esquerda' : 'direita'}`);
    
    setTimeout(() => {
        callback();
        
        // Remover animação de saída e aplicar de entrada
        livro.classList.remove(`animacao-sair-${direcao === 'proximo' ? 'esquerda' : 'direita'}`);
        livro.classList.add(`animacao-entrar-${direcao === 'proximo' ? 'direita' : 'esquerda'}`);
        
        setTimeout(() => {
            livro.classList.remove(`animacao-entrar-${direcao === 'proximo' ? 'direita' : 'esquerda'}`);
        }, 400);
    }, 400);
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
    // Parar narração e música
    pararNarracao();
    pararMusica();
    
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
    btnModoNoite.textContent = estado.modoNoite ? '☀️' : '🌙';
    
    localStorage.setItem('modoNoite', estado.modoNoite);
}

function verificarModoNoite() {
    const modoSalvo = localStorage.getItem('modoNoite') === 'true';
    if (modoSalvo) {
        estado.modoNoite = true;
        document.body.classList.add('modo-noite');
        document.getElementById('btnModoNoite').textContent = '☀️';
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
    
    btnFavorito.textContent = ehFavorito ? '❤️' : '🤍';
    btnFavorito.classList.toggle('favorito-ativo', ehFavorito);
}

// ============================================
// NARRAÇÃO (SpeechSynthesis)
// ============================================
function toggleNarracao() {
    estado.narrazioneAttiva = !estado.narrazioneAttiva;
    
    const btnNarrazione = document.getElementById('btnNarrazione');
    btnNarrazione.classList.toggle('tocando', estado.narrazioneAttiva);
    
    if (estado.narrazioneAttiva) {
        narrarPaginaAtual();
    } else {
        pararNarracao();
    }
}

function narrarPaginaAtual() {
    if (!estado.dadosHistoria) return;
    
    const pagina = estado.dadosHistoria.paginas[estado.paginaAtual];
    
    if (pagina.naracao && 'speechSynthesis' in window) {
        // Cancelar narração anterior
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(pagina.naracao);
        utterance.lang = 'pt-BR';
        utterance.rate = estado.velocidadeFala;
        utterance.pitch = 1.2;
        utterance.volume = 1;
        
        // Tentar usar voz feminina (mais adequada para crianças)
        const vozes = window.speechSynthesis.getVoices();
        const vozFeminina = vozes.find(v => v.lang.includes('pt') && v.name.includes('Female'));
        if (vozFeminina) {
            utterance.voice = vozFeminina;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

function pararNarracao() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function configurarVozes() {
    // Carregar vozes disponíveis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        
        // Algumas browsers precisam esperar as vozes carregarem
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
}

// ============================================
// MÚSICA DE FUNDO
// ============================================
function toggleMusica() {
    estado.musicaTocando = !estado.musicaTocando;
    
    const btnMusica = document.getElementById('btnMusica');
    const audioFundo = document.getElementById('audioFundo');
    
    btnMusica.classList.toggle('tocando', estado.musicaTocando);
    
    if (estado.musicaTocando) {
        tocarMusica();
    } else {
        pararMusica();
    }
}

function tocarMusica() {
    const audioFundo = document.getElementById('audioFundo');
    
    // Usar um tom suave gerado por Web Audio API
    if (!audioFundo.src) {
        gerarMusicaSuave();
    }
    
    audioFundo.play().catch(e => console.log('Música bloqueada:', e));
}

function pararMusica() {
    const audioFundo = document.getElementById('audioFundo');
    audioFundo.pause();
    audioFundo.currentTime = 0;
}

function gerarMusicaSuave() {
    // Criar um tom suave usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 220; // Lá grave
    oscillator.type = 'sine';
    
    gainNode.gain.value = 0.1; // Volume baixo
    
    // Criar um blob de áudio simples
    const duration = 30; // 30 segundos
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Criar uma melodia suave
        data[i] = 0.1 * Math.sin(2 * Math.PI * 220 * t) * 
                  Math.sin(2 * Math.PI * 0.5 * t) *
                  (1 - (t % 4) / 4);
    }
    
    // Converter para WAV e usar como source
    const audioFundo = document.getElementById('audioFundo');
    const wavBlob = bufferToWave(buffer, numSamples);
    audioFundo.src = URL.createObjectURL(wavBlob);
}

function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // Escrever header WAV
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // length = 16
    setUint16(1);          // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16);           // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

// ============================================
// EVENTOS
// ============================================
function configurarEventos() {
    // Navegação
    document.getElementById('btnVoltar').addEventListener('click', voltarParaInicio);
    document.getElementById('btnPaginaAnterior').addEventListener('click', paginaAnterior);
    document.getElementById('btnProximaPagina').addEventListener('click', proximaPagina);
    
    // Controles de áudio
    document.getElementById('btnNarrazione').addEventListener('click', toggleNarracao);
    document.getElementById('btnAudio').addEventListener('click', () => narrarPaginaAtual());
    document.getElementById('btnMusica').addEventListener('click', toggleMusica);
    document.getElementById('btnMusicaGlobal').addEventListener('click', toggleMusica);
    
    // Outros controles
    document.getElementById('btnModoNoite').addEventListener('click', toggleModoNoite);
    document.getElementById('btnFavorito').addEventListener('click', toggleFavorito);
    
    // Controle de velocidade
    const velocidadeInput = document.getElementById('velocidadeFala');
    const velocidadeValor = document.getElementById('velocidadeValor');
    
    velocidadeInput.addEventListener('input', (e) => {
        estado.velocidadeFala = parseFloat(e.target.value);
        velocidadeValor.textContent = `${estado.velocidadeFala.toFixed(1)}x`;
    });
    
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
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        if (estado.telaAtual !== 'leitura') return;
        
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                proximaPagina();
            } else {
                paginaAnterior();
            }
        }
    }
    
    // Inicializar vozes
    configurarVozes();
}

// ============================================
// UTILITÁRIOS
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funções para uso global
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
