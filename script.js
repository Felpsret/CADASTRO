    function formatar() {
      const tipo = document.getElementById("tipoScript").value;
      const entrada = document.getElementById("entrada").value.trim();
      const linhas = entrada.split(/\r?\n/).filter(l => l.trim() !== '');
      let resultado = '';

      if (tipo === "CADASTRO DE ZTE" || tipo === "CADASTRO DE ONT") {
        if (linhas.length % 3 !== 0) {
          alert("Erro: a entrada deve conter múltiplos de 3 linhas (MAC, Serial, Fabricante). Verifique os dados.");
          document.getElementById("resultado").textContent = "Entrada incompleta detectada. Corrija e tente novamente.";
          return;
        }

        for (let i = 0; i < linhas.length; i += 3) {
          const mac = linhas[i].trim();
          const serial = linhas[i + 1].trim();
          const fabricante = linhas[i + 2].trim();
          resultado += `${mac};${serial};${fabricante}\n`;
        }
      }

      document.getElementById("resultado").textContent = resultado.trim() || "Nenhum dado válido.";
    }

    function copiarTexto() {
      const texto = document.getElementById("resultado").innerText;
      navigator.clipboard.writeText(texto)
        .then(() => alert("Texto copiado com sucesso!"))
        .catch(err => console.error("Erro ao copiar: ", err));
    }

    function baixarTXT() {
      const texto = document.getElementById("resultado").innerText;
      let nome = document.getElementById("nomeArquivo").value.trim();
      if (!nome) nome = "resultado";
      if (!nome.endsWith(".txt")) nome += ".txt";

      const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    function limparCampos() {
      document.getElementById("entrada").value = '';
      document.getElementById("resultado").textContent = 'Esse é o resultado que será salvo no bloco de notas.';
      document.getElementById("nomeArquivo").value = '';
    }