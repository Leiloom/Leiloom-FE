class CPF {
  private static readonly tamanhoCPF: number = 11;
  private static readonly regexCPF: RegExp = /^\d{11}$/;
  private static readonly regexCaracteresMascara: RegExp = /[.\-]/g;
  private static readonly regexCaracteresNaoPermitidos: RegExp = /[^\d.\-]/;

  static isValid(cpf: string): boolean {
    if (this.regexCaracteresNaoPermitidos.test(cpf)) {
      return false;
    }

    const cpfSemMascara = this.removeMascaraCPF(cpf);

    if (!this.regexCPF.test(cpfSemMascara)) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpfSemMascara)) {
      return false;
    }

    // Valida primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfSemMascara.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfSemMascara.charAt(9))) return false;

    // Valida segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfSemMascara.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfSemMascara.charAt(10))) return false;

    return true;
  }

  private static removeMascaraCPF(cpf: string): string {
    return cpf.replace(this.regexCaracteresMascara, "");
  }
}

export default CPF;