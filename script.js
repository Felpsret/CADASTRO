/* ============ CONFIG / STORAGE KEYS ============ */
const CHAVE_USUARIO = 'estoqueviu_usuario';
const CHAVE_CADASTROS = 'estoqueviu_cadastros'; // array de {usuario, dataISO, tipo, quantidade}

const CORES_AVATAR = ['#00e0ff', '#8b6bff', '#35e0a1', '#ff9f5b', '#ff6b7a', '#5bd0ff'];

/* ============ HELPERS DE ARMAZENAMENTO ============ */
function getUsuario() {
  return localStorage.getItem(CHAVE_USUARIO) || '';
}

function setUsuario(nome) {
  localStorage.setItem(CHAVE_USUARIO, nome);
}

function getCadastros() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CADASTROS)) || [];
  } catch (e) {
    return [];
  }
}

function salvarCadastros(lista) {
  localStorage.setItem(CHAVE_CADASTROS, JSON.stringify(lista));
}

function registrarCadastro(tipo, quantidade) {
  if (quantidade <= 0) return;
  const lista = getCadastros();
  lista.push({
    usuario: getUsuario(),
    dataISO: new Date().toISOString(),
    tipo,
    quantidade
  });
  salvarCadastros(lista);
  atualizarPainelStats();
}

/* ============ LOGIN ============ */
function corParaNome(nome) {
  let soma = 0;
  for (let i = 0; i < nome.length; i++) soma += nome.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

function iniciaisParaNome(nome) {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : partes[0].slice(0, 2);
  return letras.toUpperCase();
}

function aplicarUsuarioNaTela() {
  const nome = getUsuario();
  document.getElementById('userNome').textContent = nome || '—';
  const avatar = document.getElementById('userAvatar');
  if (nome) {
    avatar.textContent = iniciaisParaNome(nome);
    avatar.style.background = corParaNome(nome);
  }
}

function mostrarLogin() {
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('loginNome').focus();
}

function esconderLogin() {
  document.getElementById('loginOverlay').classList.add('hidden');
}

function confirmarLogin() {
  const campo = document.getElementById('loginNome');
  const nome = campo.value.trim();
  if (!nome) {
    campo.focus();
    return;
  }
  setUsuario(nome);
  aplicarUsuarioNaTela();
  esconderLogin();
  atualizarPainelStats();
}

function trocarUsuario() {
  esconderLogin();
  document.getElementById('loginNome').value = '';
  mostrarLogin();
}

/* ============ FORMATAÇÃO ============ */
function formatar() {
  const tipo = document.getElementById('tipoScript').value;
  const entrada = document.getElementById('entrada').value.trim();
  const linhas = entrada.split(/\r?\n/).filter(l => l.trim() !== '');
  let resultado = '';

  if (tipo === 'CADASTRO DE ZTE' || tipo === 'CADASTRO DE ONT') {
    if (linhas.length % 3 !== 0) {
      alert('Erro: a entrada deve conter múltiplos de 3 linhas (MAC, Serial, Fabricante). Verifique os dados.');
      document.getElementById('resultado').textContent = 'Entrada incompleta detectada. Corrija e tente novamente.';
      return;
    }

    let quantidade = 0;
    for (let i = 0; i < linhas.length; i += 3) {
      const mac = linhas[i].trim();
      const serial = linhas[i + 1].trim();
      const fabricante = linhas[i + 2].trim();
      resultado += `${mac};${serial};${fabricante}\n`;
      quantidade++;
    }

    registrarCadastro(tipo, quantidade);
  }

  document.getElementById('resultado').textContent = resultado.trim() || 'Nenhum dado válido.';
}

function copiarTexto() {
  const texto = document.getElementById('resultado').innerText;
  navigator.clipboard.writeText(texto)
    .then(() => alert('Texto copiado com sucesso!'))
    .catch(err => console.error('Erro ao copiar: ', err));
}

function baixarTXT() {
  const texto = document.getElementById('resultado').innerText;
  let nome = document.getElementById('nomeArquivo').value.trim();
  if (!nome) nome = 'resultado';
  if (!nome.endsWith('.txt')) nome += '.txt';

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function limparCampos() {
  document.getElementById('entrada').value = '';
  document.getElementById('resultado').textContent = 'Esse é o resultado que será salvo no bloco de notas.';
  document.getElementById('nomeArquivo').value = '';
}

/* ============ PAINEL DE STATS (usuário atual) ============ */
function mesAnoDeISO(iso) {
  return iso.slice(0, 7); // YYYY-MM
}

function ehHoje(iso) {
  const hoje = new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10) === hoje;
}

function atualizarPainelStats() {
  const usuario = getUsuario();
  const lista = getCadastros();
  const mesAtual = new Date().toISOString().slice(0, 7);

  let hoje = 0, mes = 0, totalEquipeMes = 0;

  lista.forEach(c => {
    const doMesAtual = mesAnoDeISO(c.dataISO) === mesAtual;
    if (doMesAtual) totalEquipeMes += c.quantidade;
    if (c.usuario === usuario) {
      if (ehHoje(c.dataISO)) hoje += c.quantidade;
      if (doMesAtual) mes += c.quantidade;
    }
  });

  document.getElementById('statHoje').textContent = hoje;
  document.getElementById('statMes').textContent = mes;
  document.getElementById('statTotal').textContent = totalEquipeMes;
}

/* ============ RELATÓRIO MENSAL ============ */
function chaveMes(iso) {
  return iso.slice(0, 7);
}

function rotuloMes(chave) {
  const [ano, mes] = chave.split('-');
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${nomes[parseInt(mes, 10) - 1]}/${ano}`;
}

function popularFiltroMes() {
  const select = document.getElementById('filtroMes');
  const lista = getCadastros();
  const mesAtual = new Date().toISOString().slice(0, 7);
  const meses = new Set([mesAtual]);
  lista.forEach(c => meses.add(chaveMes(c.dataISO)));

  const mesesOrdenados = Array.from(meses).sort().reverse();
  select.innerHTML = mesesOrdenados
    .map(m => `<option value="${m}">${rotuloMes(m)}</option>`)
    .join('');
  select.value = mesAtual;
}

function renderizarRelatorio() {
  const mesSelecionado = document.getElementById('filtroMes').value;
  const lista = getCadastros().filter(c => chaveMes(c.dataISO) === mesSelecionado);

  const porUsuario = {};
  lista.forEach(c => {
    porUsuario[c.usuario] = (porUsuario[c.usuario] || 0) + c.quantidade;
  });

  const linhas = Object.entries(porUsuario).sort((a, b) => b[1] - a[1]);
  const total = linhas.reduce((soma, [, qtd]) => soma + qtd, 0);
  const maior = linhas.length ? linhas[0][1] : 1;

  document.getElementById('relatorioTotal').textContent = `Total: ${total}`;

  const corpo = document.getElementById('tabelaRelatorioBody');
  if (linhas.length === 0) {
    corpo.innerHTML = '<tr><td colspan="3" style="color: var(--text-faint);">Nenhum cadastro neste período.</td></tr>';
    return;
  }

  corpo.innerHTML = linhas.map(([usuario, qtd]) => `
    <tr>
      <td>${usuario || '(sem nome)'}</td>
      <td>${qtd}</td>
      <td style="width: 90px;"><div class="rank-bar" style="width: ${(qtd / maior) * 100}%;"></div></td>
    </tr>
  `).join('');
}

function abrirRelatorio() {
  popularFiltroMes();
  renderizarRelatorio();
  document.getElementById('relatorioOverlay').classList.remove('hidden');
}

function fecharRelatorio() {
  document.getElementById('relatorioOverlay').classList.add('hidden');
}

function exportarRelatorioCSV() {
  const mesSelecionado = document.getElementById('filtroMes').value;
  const lista = getCadastros().filter(c => chaveMes(c.dataISO) === mesSelecionado);

  const porUsuario = {};
  lista.forEach(c => {
    porUsuario[c.usuario] = (porUsuario[c.usuario] || 0) + c.quantidade;
  });

  let csv = 'Usuario;Cadastros\n';
  Object.entries(porUsuario)
    .sort((a, b) => b[1] - a[1])
    .forEach(([usuario, qtd]) => {
      csv += `${usuario};${qtd}\n`;
    });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio_${mesSelecionado}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ============ INICIALIZAÇÃO ============ */
document.addEventListener('DOMContentLoaded', () => {
  const usuario = getUsuario();
  if (usuario) {
    aplicarUsuarioNaTela();
    esconderLogin();
    atualizarPainelStats();
  } else {
    mostrarLogin();
  }

  document.getElementById('loginEntrar').addEventListener('click', confirmarLogin);
  document.getElementById('loginNome').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmarLogin();
  });

  document.getElementById('btnTrocar').addEventListener('click', trocarUsuario);
  document.getElementById('btnProcessar').addEventListener('click', formatar);
  document.getElementById('btnSalvar').addEventListener('click', baixarTXT);
  document.getElementById('btnCopiar').addEventListener('click', copiarTexto);
  document.getElementById('btnLimpar').addEventListener('click', limparCampos);

  document.getElementById('btnRelatorio').addEventListener('click', abrirRelatorio);
  document.getElementById('fecharRelatorio').addEventListener('click', fecharRelatorio);
  document.getElementById('filtroMes').addEventListener('change', renderizarRelatorio);
  document.getElementById('exportarRelatorio').addEventListener('click', exportarRelatorioCSV);
});
