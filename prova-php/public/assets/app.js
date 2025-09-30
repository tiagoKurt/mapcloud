/**
 * Aplicação JavaScript para Sistema de Rastreamento de Entregas
 * Compatível com navegadores modernos e vanilla JS
 */

// Variáveis globais
let mapa = null;
let marcadores = [];
let polilinha = null;
let entregaAtual = null;

// Função para detectar se é dispositivo móvel
function isMobile() {
    return window.innerWidth <= 768;
}

// Função para detectar se é tela pequena
function isSmallScreen() {
    return window.innerWidth <= 480;
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se Leaflet está carregado
    if (typeof L === 'undefined') {
        console.error('Leaflet não foi carregado. Verifique a conexão com a internet.');
        // Tentar recarregar o script do Leaflet
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        script.integrity = 'sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==';
        script.crossOrigin = '';
        script.onload = function() {
            console.log('Leaflet carregado com sucesso');
            inicializarApp();
        };
        script.onerror = function() {
            console.error('Falha ao carregar Leaflet');
            // Mostrar mensagem de erro no lugar do mapa
            const mapaContainer = document.getElementById('mapa');
            if (mapaContainer) {
                mapaContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Erro ao carregar mapa. Verifique sua conexão com a internet.</div>';
            }
            inicializarApp();
        };
        document.head.appendChild(script);
    } else {
        inicializarApp();
    }
});

/**
 * Inicializar aplicação
 */
function inicializarApp() {
    // Configurar navegação
    configurarNavegacao();
    
    // Configurar eventos
    configurarEventos();
    
    // Carregar dados iniciais
    carregarEntregas();
    carregarMetricas();
}

/**
 * Configurar navegação entre seções
 */
function configurarNavegacao() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Remover classe active de todos os links e seções
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Adicionar classe active ao link clicado e seção correspondente
            this.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
            
            // Ações específicas por seção
            switch(targetSection) {
                case 'rastreamento':
                    // Limpar resultados anteriores
                    limparResultadoRastreamento();
                    break;
                case 'entregas':
                    carregarEntregas();
                    break;
                case 'metricas':
                    carregarMetricas();
                    break;
            }
        });
    });
}

/**
 * Configurar eventos da aplicação
 */
function configurarEventos() {
    // Busca de rastreamento
    const buscarBtn = document.getElementById('buscarBtn');
    const chaveNfeInput = document.getElementById('chaveNfeInput');
    
    buscarBtn.addEventListener('click', buscarRastreamento);
    chaveNfeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarRastreamento();
        }
    });
    
    // Filtros de entregas
    const atualizarEntregasBtn = document.getElementById('atualizarEntregas');
    atualizarEntregasBtn.addEventListener('click', carregarEntregas);
    
    // Filtros de métricas
    const atualizarMetricasBtn = document.getElementById('atualizarMetricas');
    atualizarMetricasBtn.addEventListener('click', carregarMetricas);
    
    // Upload de NF-e
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', processarUpload);
}

/**
 * Buscar rastreamento por chave NFe
 */
async function buscarRastreamento() {
    const chaveNfe = document.getElementById('chaveNfeInput').value.trim();
    
    if (!chaveNfe) {
        mostrarErro('Por favor, digite a chave da NF-e');
        return;
    }
    
    if (chaveNfe.length !== 44) {
        mostrarErro('A chave da NF-e deve ter 44 dígitos');
        return;
    }
    
    mostrarLoading(true);
    
    try {
        const response = await fetch(`/api/rastreamento/${chaveNfe}`);
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoRastreamento(data.data);
        } else {
            mostrarErro(data.error || 'Erro ao buscar rastreamento');
        }
    } catch (error) {
        mostrarErro('Erro de conexão: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Exibir resultado do rastreamento
 */
function exibirResultadoRastreamento(dados) {
    entregaAtual = dados;
    
    // Exibir informações da entrega
    exibirDadosEntrega(dados.entrega);
    
    // Configurar e exibir mapa
    configurarMapa(dados.entrega, dados.eventos);
    
    // Exibir timeline
    exibirTimeline(dados.eventos);
    
    // Mostrar seção de resultado
    document.getElementById('resultadoRastreamento').style.display = 'block';
}

/**
 * Exibir dados da entrega
 */
function exibirDadosEntrega(entrega) {
    const container = document.getElementById('dadosEntrega');
    
    const html = `
        <div class="dado-item">
            <div class="dado-label">Chave NF-e</div>
            <div class="dado-valor">${entrega.chave_nfe}</div>
        </div>
        <div class="dado-item">
            <div class="dado-label">Número NF-e</div>
            <div class="dado-valor">${entrega.numero_nfe}</div>
        </div>
        <div class="dado-item">
            <div class="dado-label">Destinatário</div>
            <div class="dado-valor">${entrega.destinatario.nome}</div>
        </div>
        <div class="dado-item">
            <div class="dado-label">Status Atual</div>
            <div class="dado-valor">${entrega.status_atual}</div>
        </div>
        <div class="dado-item">
            <div class="dado-label">Data Emissão</div>
            <div class="dado-valor">${formatarData(entrega.data_emissao)}</div>
        </div>
        <div class="dado-item">
            <div class="dado-label">Valor Total</div>
            <div class="dado-valor">R$ ${formatarMoeda(entrega.valor_total)}</div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Mostrar loading no mapa
 */
function mostrarLoadingMapa() {
    const mapaContainer = document.getElementById('mapa');
    if (mapaContainer) {
        mapaContainer.innerHTML = `
            <div class="mapa-loading">
                <div class="spinner"></div>
                Carregando mapa...
            </div>
        `;
    }
}

/**
 * Configurar e exibir mapa
 */
function configurarMapa(entrega, eventos) {
    const mapaContainer = document.getElementById('mapa');
    
    // Verificar se o container existe
    if (!mapaContainer) {
        console.error('Container do mapa não encontrado');
        return;
    }
    
    // Mostrar loading
    mostrarLoadingMapa();
    
    // Limpar mapa anterior de forma segura
    if (mapa) {
        try {
            mapa.remove();
        } catch (e) {
            console.warn('Erro ao remover mapa anterior:', e);
        }
        mapa = null;
    }
    
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
        try {
            // Criar novo mapa com configurações mais robustas
            const zoomLevel = isMobile() ? (isSmallScreen() ? 8 : 9) : 10;
            const zoomControl = !isSmallScreen();
            
            mapa = L.map('mapa', {
                center: [-23.5505, -46.6333],
                zoom: zoomLevel,
                zoomControl: zoomControl,
                attributionControl: true,
                preferCanvas: false,
                renderer: L.svg(),
                scrollWheelZoom: !isMobile(), // Desabilitar zoom com scroll no mobile
                doubleClickZoom: !isMobile(), // Desabilitar zoom duplo clique no mobile
                touchZoom: true, // Manter zoom por toque no mobile
                dragging: true
            });
            
            // Configurar camadas de tiles com fallbacks
            const tileLayers = [
                {
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19,
                        subdomains: ['a', 'b', 'c'],
                        retries: 3,
                        timeout: 10000
                    }
                },
                {
                    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19,
                        retries: 3,
                        timeout: 10000
                    }
                }
            ];
            
            // Tentar adicionar a primeira camada, com fallback para a segunda
            let tileLayerAdded = false;
            for (let i = 0; i < tileLayers.length; i++) {
                try {
                    const layer = L.tileLayer(tileLayers[i].url, tileLayers[i].options);
                    layer.addTo(mapa);
                    tileLayerAdded = true;
                    break;
                } catch (e) {
                    console.warn(`Erro ao carregar camada ${i + 1}:`, e);
                    if (i === tileLayers.length - 1) {
                        // Se todas as camadas falharam, criar um mapa básico
                        console.error('Todas as camadas de tiles falharam, criando mapa básico');
                        mapaContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Mapa temporariamente indisponível</div>';
                        return;
                    }
                }
            }
            
            if (!tileLayerAdded) {
                console.error('Não foi possível carregar nenhuma camada de tiles');
                return;
            }
            
            // Limpar marcadores e polilinha anteriores
            marcadores.forEach(marker => {
                try {
                    if (mapa && mapa.hasLayer(marker)) {
                        mapa.removeLayer(marker);
                    }
                } catch (e) {
                    console.warn('Erro ao remover marcador:', e);
                }
            });
            marcadores = [];
            
            if (polilinha) {
                try {
                    if (mapa && mapa.hasLayer(polilinha)) {
                        mapa.removeLayer(polilinha);
                    }
                } catch (e) {
                    console.warn('Erro ao remover polilinha:', e);
                }
                polilinha = null;
            }
            
            // Adicionar marcador de destino
            if (entrega.destinatario.coordenadas.latitude && entrega.destinatario.coordenadas.longitude) {
                try {
                    const marcadorDestino = L.marker([
                        entrega.destinatario.coordenadas.latitude,
                        entrega.destinatario.coordenadas.longitude
                    ], {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: '<div style="background-color: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(mapa);
                    
                    const popupContent = isMobile() ? 
                        `<div style="min-width: ${isSmallScreen() ? '150px' : '180px'};">
                            <strong>Destino</strong><br>
                            ${entrega.destinatario.nome}<br>
                            <small>${formatarEndereco(entrega.destinatario.endereco)}</small>
                        </div>` :
                        `<div style="min-width: 200px;">
                            <strong>Destino</strong><br>
                            ${entrega.destinatario.nome}<br>
                            ${formatarEndereco(entrega.destinatario.endereco)}
                        </div>`;
                    
                    marcadorDestino.bindPopup(popupContent);
                    
                    marcadores.push(marcadorDestino);
                } catch (e) {
                    console.error('Erro ao adicionar marcador de destino:', e);
                }
            }
            
            // Adicionar marcadores dos eventos
            const coordenadasEventos = [];
            
            eventos.forEach((evento, index) => {
                if (evento.localizacao.coordenadas.latitude && evento.localizacao.coordenadas.longitude) {
                    try {
                        const marcador = L.marker([
                            evento.localizacao.coordenadas.latitude,
                            evento.localizacao.coordenadas.longitude
                        ], {
                            icon: L.divIcon({
                                className: 'event-marker',
                                html: `<div style="background-color: #28a745; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })
                        }).addTo(mapa);
                        
                        const eventPopupContent = isMobile() ? 
                            `<div style="min-width: ${isSmallScreen() ? '150px' : '180px'};">
                                <strong>${evento.tipo_evento}</strong><br>
                                <small>${evento.descricao}</small><br>
                                <small>${formatarData(evento.timestamp)}</small>
                            </div>` :
                            `<div style="min-width: 200px;">
                                <strong>${evento.tipo_evento}</strong><br>
                                ${evento.descricao}<br>
                                <small>${formatarData(evento.timestamp)}</small>
                            </div>`;
                        
                        marcador.bindPopup(eventPopupContent);
                        
                        marcadores.push(marcador);
                        coordenadasEventos.push([
                            evento.localizacao.coordenadas.latitude,
                            evento.localizacao.coordenadas.longitude
                        ]);
                    } catch (e) {
                        console.error(`Erro ao adicionar marcador do evento ${index}:`, e);
                    }
                }
            });
            
            // Adicionar polilinha da rota
            if (coordenadasEventos.length > 1) {
                try {
                    polilinha = L.polyline(coordenadasEventos, {
                        color: '#667eea',
                        weight: 3,
                        opacity: 0.7,
                        smoothFactor: 1
                    }).addTo(mapa);
                    
                    // Ajustar visualização para mostrar toda a rota
                    const grupo = new L.featureGroup([...marcadores, polilinha]);
                    const bounds = grupo.getBounds();
                    if (bounds.isValid()) {
                        mapa.fitBounds(bounds, { padding: [20, 20] });
                    }
                } catch (e) {
                    console.error('Erro ao adicionar polilinha:', e);
                }
            } else if (marcadores.length > 0) {
                // Se há apenas um ponto, centralizar nele
                try {
                    const latLng = marcadores[0].getLatLng();
                    mapa.setView([latLng.lat, latLng.lng], 13);
                } catch (e) {
                    console.error('Erro ao centralizar mapa:', e);
                }
            }
            
            // Adicionar evento de redimensionamento
            setTimeout(() => {
                if (mapa) {
                    mapa.invalidateSize();
                }
            }, 100);
            
            // Adicionar listener para redimensionamento da janela
            window.addEventListener('resize', function() {
                if (mapa) {
                    setTimeout(() => {
                        mapa.invalidateSize();
                    }, 100);
                }
            });
            
        } catch (e) {
            console.error('Erro crítico ao configurar mapa:', e);
            mapaContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Erro ao carregar mapa. Tente novamente.</div>';
        }
    }, 50);
}

/**
 * Exibir timeline de eventos
 */
function exibirTimeline(eventos) {
    const container = document.getElementById('timeline');
    
    if (eventos.length === 0) {
        container.innerHTML = '<p>Nenhum evento encontrado.</p>';
        return;
    }
    
    const html = eventos.map(evento => `
        <div class="timeline-item ${getClasseEvento(evento.tipo_evento)}">
            <div class="timeline-header">
                <div class="timeline-tipo">${evento.tipo_evento}</div>
                <div class="timeline-timestamp">${formatarData(evento.timestamp)}</div>
            </div>
            <div class="timeline-descricao">${evento.descricao}</div>
            <div class="timeline-localizacao">
                ${evento.responsavel ? 'Responsável: ' + evento.responsavel : ''}
                ${evento.localizacao.endereco ? ' | ' + evento.localizacao.endereco : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Carregar lista de entregas
 */
async function carregarEntregas() {
    const container = document.getElementById('listaEntregas');
    const statusFiltro = document.getElementById('filtroStatus').value;
    
    container.innerHTML = '<div class="loading">Carregando entregas...</div>';
    
    try {
        let url = '/api/entregas';
        if (statusFiltro) {
            url += `?status=${statusFiltro}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            exibirListaEntregas(data.data);
        } else {
            container.innerHTML = '<p>Erro ao carregar entregas: ' + (data.error || 'Erro desconhecido') + '</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro de conexão: ' + error.message + '</p>';
    }
}

/**
 * Exibir lista de entregas
 */
function exibirListaEntregas(entregas) {
    const container = document.getElementById('listaEntregas');
    
    if (entregas.length === 0) {
        container.innerHTML = '<p>Nenhuma entrega encontrada.</p>';
        return;
    }
    
    const html = entregas.map(entrega => `
        <div class="entrega-card ${getClasseStatus(entrega.status_atual)}" onclick="rastrearEntrega('${entrega.chave_nfe}')">
            <div class="entrega-header">
                <div class="entrega-chave">${entrega.chave_nfe}</div>
                <div class="entrega-status ${getClasseStatus(entrega.status_atual)}">${entrega.status_atual}</div>
            </div>
            <div class="entrega-info">
                <div><strong>Destinatário:</strong> ${entrega.destinatario.nome}</div>
                <div><strong>Data Emissão:</strong> ${formatarData(entrega.data_emissao)}</div>
                <div><strong>Valor:</strong> R$ ${formatarMoeda(entrega.valor_total)}</div>
                <div><strong>Peso:</strong> ${entrega.peso_total ? entrega.peso_total + ' kg' : 'N/A'}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Rastrear entrega específica
 */
function rastrearEntrega(chaveNfe) {
    // Mudar para seção de rastreamento
    document.querySelector('[data-section="rastreamento"]').click();
    
    // Preencher campo de busca
    document.getElementById('chaveNfeInput').value = chaveNfe;
    
    // Buscar automaticamente
    buscarRastreamento();
}

/**
 * Carregar métricas
 */
async function carregarMetricas() {
    const container = document.getElementById('metricasContent');
    const periodoFiltro = document.getElementById('filtroPeriodo').value;
    
    container.innerHTML = '<div class="loading">Carregando métricas...</div>';
    
    try {
        const url = `/api/metricas?periodo=${periodoFiltro}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            exibirMetricas(data.data);
        } else {
            container.innerHTML = '<p>Erro ao carregar métricas: ' + (data.error || 'Erro desconhecido') + '</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro de conexão: ' + error.message + '</p>';
    }
}

/**
 * Exibir métricas
 */
function exibirMetricas(dados) {
    const container = document.getElementById('metricasContent');
    
    const html = `
        <div class="metricas-grid">
            <div class="metrica-card">
                <div class="metrica-valor">${dados.kpis_gerais.total_entregas}</div>
                <div class="metrica-label">Total de Entregas</div>
            </div>
            <div class="metrica-card">
                <div class="metrica-valor">${dados.kpis_gerais.entregas_concluidas}</div>
                <div class="metrica-label">Entregas Concluídas</div>
            </div>
            <div class="metrica-card">
                <div class="metrica-valor">${dados.kpis_gerais.percentual_entrega_prazo}%</div>
                <div class="metrica-label">Entregas no Prazo</div>
            </div>
            <div class="metrica-card">
                <div class="metrica-valor">${dados.performance.order_cycle_time_horas}h</div>
                <div class="metrica-label">Tempo Médio de Ciclo</div>
            </div>
        </div>
        
        <div class="metricas-grid">
            <div class="metrica-card">
                <div class="metrica-valor">${dados.performance.on_time_delivery_percentual}%</div>
                <div class="metrica-label">On-Time Delivery</div>
            </div>
            <div class="metrica-card">
                <div class="metrica-valor">${dados.performance.indice_ocorrencia_percentual}%</div>
                <div class="metrica-label">Índice de Ocorrência</div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Processar upload de NF-e
 */
async function processarUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('xmlFile');
    
    if (!fileInput.files[0]) {
        mostrarErro('Por favor, selecione um arquivo XML');
        return;
    }
    
    formData.append('xml_file', fileInput.files[0]);
    
    mostrarLoading(true);
    
    try {
        const response = await fetch('/api/upload-nfe', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoUpload(data, true);
            // Limpar formulário
            fileInput.value = '';
        } else {
            exibirResultadoUpload(data, false);
        }
    } catch (error) {
        exibirResultadoUpload({error: 'Erro de conexão: ' + error.message}, false);
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Exibir resultado do upload
 */
function exibirResultadoUpload(data, sucesso) {
    const container = document.getElementById('uploadResult');
    
    if (sucesso) {
        container.className = 'upload-result';
        container.innerHTML = `
            <h4>✅ NF-e processada com sucesso!</h4>
            <p><strong>Chave NF-e:</strong> ${data.data.chave_nfe}</p>
            <p><strong>Destinatário:</strong> ${data.data.entrega.destinatario.nome}</p>
            <p><strong>Valor:</strong> R$ ${formatarMoeda(data.data.entrega.valor_total)}</p>
        `;
    } else {
        container.className = 'upload-result error';
        container.innerHTML = `
            <h4>❌ Erro no processamento</h4>
            <p>${data.error}</p>
        `;
    }
    
    container.style.display = 'block';
}

/**
 * Limpar resultado de rastreamento
 */
function limparResultadoRastreamento() {
    document.getElementById('resultadoRastreamento').style.display = 'none';
    document.getElementById('chaveNfeInput').value = '';
    
    // Limpar mapa de forma segura
    if (mapa) {
        try {
            // Remover todos os marcadores
            marcadores.forEach(marker => {
                if (mapa.hasLayer(marker)) {
                    mapa.removeLayer(marker);
                }
            });
            
            // Remover polilinha
            if (polilinha && mapa.hasLayer(polilinha)) {
                mapa.removeLayer(polilinha);
            }
            
            // Remover mapa
            mapa.remove();
        } catch (e) {
            console.warn('Erro ao limpar mapa:', e);
        } finally {
            mapa = null;
        }
    }
    
    // Limpar variáveis
    marcadores = [];
    polilinha = null;
    entregaAtual = null;
}

/**
 * Mostrar/ocultar loading
 */
function mostrarLoading(mostrar) {
    const modal = document.getElementById('loadingModal');
    modal.style.display = mostrar ? 'block' : 'none';
}

/**
 * Mostrar erro
 */
function mostrarErro(mensagem) {
    const modal = document.getElementById('errorModal');
    const messageElement = document.getElementById('errorMessage');
    
    messageElement.textContent = mensagem;
    modal.style.display = 'block';
}

/**
 * Fechar modal
 */
function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

/**
 * Funções utilitárias
 */
function formatarData(data) {
    if (!data) return 'N/A';
    return new Date(data).toLocaleString('pt-BR');
}

function formatarMoeda(valor) {
    if (!valor) return '0,00';
    return parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatarEndereco(endereco) {
    const partes = [];
    if (endereco.logradouro) partes.push(endereco.logradouro);
    if (endereco.numero) partes.push(endereco.numero);
    if (endereco.bairro) partes.push(endereco.bairro);
    if (endereco.cidade) partes.push(endereco.cidade);
    if (endereco.uf) partes.push(endereco.uf);
    if (endereco.cep) partes.push(endereco.cep);
    
    return partes.join(', ');
}

function getClasseStatus(status) {
    const statusMap = {
        'Entregue': 'entregue',
        'Em Rota': 'em-rota',
        'Em Trânsito': 'em-rota',
        'Pendente': 'pendente',
        'Coletada': 'em-rota'
    };
    
    return statusMap[status] || 'pendente';
}

function getClasseEvento(tipoEvento) {
    if (tipoEvento.toLowerCase().includes('entregue')) return 'entregue';
    if (tipoEvento.toLowerCase().includes('avaria')) return 'avaria';
    return '';
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(e) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
