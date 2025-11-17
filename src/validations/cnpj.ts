class CNPJ {
  private static readonly tamanhoCNPJ: number = 14;
  private static readonly regexCNPJ: RegExp = /^\d{14}$/;
  private static readonly regexCaracteresMascara: RegExp = /[.\/\-]/g;
  private static readonly regexCaracteresNaoPermitidos: RegExp = /[^\d.\/\-]/;
  private static readonly cnpjZerado: string = "00000000000000";

  static isValid(cnpj: string): boolean {
    if (this.regexCaracteresNaoPermitidos.test(cnpj)) {
      return false;
    }

    const cnpjSemMascara = this.removeMascaraCNPJ(cnpj);

    if (!this.regexCNPJ.test(cnpjSemMascara)) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpjSemMascara) || cnpjSemMascara === this.cnpjZerado) {
      return false;
    }

    // Valida primeiro dígito verificador
    let tamanho = cnpjSemMascara.length - 2;
    let numeros = cnpjSemMascara.substring(0, tamanho);
    const digitos = cnpjSemMascara.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    // Valida segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpjSemMascara.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
  }

  private static removeMascaraCNPJ(cnpj: string): string {
    return cnpj.replace(this.regexCaracteresMascara, "");
  }
}

export default CNPJ;