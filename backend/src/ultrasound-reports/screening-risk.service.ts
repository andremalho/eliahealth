import { Injectable } from '@nestjs/common';

/**
 * Serviço de cálculo de risco para rastreamento de 1º trimestre.
 *
 * Implementa versões simplificadas dos algoritmos FMF para:
 *   - Risco de Trissomia 21/18/13 (Teste Combinado)
 *   - Risco de Pré-eclâmpsia (Algoritmo FMF multiparamétrico)
 *
 * NOTA: Cálculos aproximados para uso clínico assistido.
 * Para riscos definitivos, usar software certificado FMF.
 *
 * Referências:
 *   Kagan KO et al. UOG 2008;31:618-624 (T21 age-related risk)
 *   Akolekar R et al. UOG 2013;42:252-259 (PE screening)
 *   Wright D et al. UOG 2015;45:16-26 (competing risks model)
 */

// ── Risco a priori por idade materna (T21) — Tabela FMF ──
const T21_AGE_RISK: Record<number, number> = {
  20: 1527, 21: 1507, 22: 1482, 23: 1447, 24: 1399,
  25: 1352, 26: 1286, 27: 1219, 28: 1140, 29: 1050,
  30: 952, 31: 849, 32: 741, 33: 630, 34: 524,
  35: 422, 36: 336, 37: 263, 38: 202, 39: 153,
  40: 115, 41: 86, 42: 64, 43: 47, 44: 35,
  45: 26, 46: 19, 47: 15, 48: 11, 49: 8,
};

@Injectable()
export class ScreeningRiskService {
  /**
   * Calcula risco a priori de T21 pela idade materna.
   * Retorna denominador (ex: 250 para 1:250)
   */
  getAgePriorRiskT21(maternalAge: number): number {
    if (maternalAge < 20) return 1600;
    if (maternalAge > 49) return 5;
    return T21_AGE_RISK[Math.round(maternalAge)] ?? this.interpolateAge(maternalAge);
  }

  /**
   * Calcula risco combinado de T21 (Teste Combinado FMF simplificado).
   *
   * Likelihood Ratios (LR) aplicados ao risco a priori:
   *   LR_NT: baseado no delta NT (NT medido - NT esperada pelo CCN)
   *   LR_NB: osso nasal (ausente LR ~6.6; presente LR ~0.4)
   *   LR_DV: ducto venoso (invertido LR ~3.2; normal LR ~0.7)
   *   LR_TR: tricúspide (regurgitação LR ~4.5; normal LR ~0.7)
   *   LR_bioquímica: PAPP-A e beta-hCG MoM
   */
  calculateCombinedRiskT21(params: {
    maternalAge: number;
    ccnMm: number;
    tnMm: number;
    nasalBone?: 'present' | 'hypoplastic' | 'absent';
    dvWaveA?: 'positive' | 'absent' | 'reversed';
    tricuspidRegurg?: boolean;
    pappaMoM?: number;
    betaHcgMoM?: number;
  }): { riskDenominator: number; classification: string } {
    const priorDenom = this.getAgePriorRiskT21(params.maternalAge);
    let priorProb = 1 / priorDenom;

    // LR_NT (delta NT model simplificado)
    const expectedNT = 1.0 + 0.01 * (params.ccnMm - 45); // Aproximação linear
    const deltaNT = params.tnMm - expectedNT;
    let lrNT = 1.0;
    if (deltaNT > 2.5) lrNT = 18;
    else if (deltaNT > 1.5) lrNT = 6;
    else if (deltaNT > 0.5) lrNT = 2.5;
    else if (deltaNT > -0.5) lrNT = 1.0;
    else lrNT = 0.3;

    // LR_NB
    let lrNB = 1.0;
    if (params.nasalBone === 'absent') lrNB = 6.6;
    else if (params.nasalBone === 'hypoplastic') lrNB = 2.8;
    else lrNB = 0.4;

    // LR_DV
    let lrDV = 1.0;
    if (params.dvWaveA === 'reversed') lrDV = 3.2;
    else if (params.dvWaveA === 'absent') lrDV = 2.0;
    else if (params.dvWaveA === 'positive') lrDV = 0.7;

    // LR_TR
    let lrTR = params.tricuspidRegurg ? 4.5 : 0.7;

    // LR bioquímica
    let lrBiochem = 1.0;
    if (params.pappaMoM && params.betaHcgMoM) {
      // T21: PAPP-A baixo + beta-hCG alto
      if (params.pappaMoM < 0.4 && params.betaHcgMoM > 2.0) lrBiochem = 8;
      else if (params.pappaMoM < 0.5 && params.betaHcgMoM > 1.5) lrBiochem = 4;
      else if (params.pappaMoM < 0.7) lrBiochem = 1.8;
      else lrBiochem = 0.5;
    }

    const posteriorProb = priorProb * lrNT * lrNB * lrDV * lrTR * lrBiochem;
    const riskDenom = Math.round(1 / Math.min(posteriorProb, 0.99));

    let classification: string;
    if (riskDenom <= 100) classification = 'alto_risco';
    else if (riskDenom <= 1000) classification = 'intermediario';
    else classification = 'baixo_risco';

    return { riskDenominator: Math.max(1, riskDenom), classification };
  }

  /**
   * Calcula risco de T18 (simplificado).
   * T18: NT aumentada + PAPP-A baixo + beta-hCG BAIXO (inverso T21)
   */
  calculateRiskT18(params: {
    maternalAge: number;
    tnMoM?: number;
    pappaMoM?: number;
    betaHcgMoM?: number;
  }): { riskDenominator: number } {
    // Risco base por idade (muito mais raro que T21)
    let baseRisk = 1 / (this.getAgePriorRiskT21(params.maternalAge) * 3);

    if (params.tnMoM && params.tnMoM > 2.0) baseRisk *= 5;
    if (params.pappaMoM && params.pappaMoM < 0.3) baseRisk *= 3;
    if (params.betaHcgMoM && params.betaHcgMoM < 0.3) baseRisk *= 4; // beta-hCG baixo em T18

    return { riskDenominator: Math.max(1, Math.round(1 / Math.min(baseRisk, 0.99))) };
  }

  /**
   * Calcula risco de pré-eclâmpsia precoce (< 34s) — Algoritmo FMF simplificado.
   *
   * Fatores:
   *   - Risco a priori (idade, HAS, DM, hx PE, paridade, etnia, IMC)
   *   - MAP MoM
   *   - UtA PI MoM
   *   - PAPP-A MoM
   *   - PlGF MoM (se disponível)
   */
  calculatePERisk(params: {
    maternalAge: number;
    weightKg: number;
    heightCm?: number;
    nulliparous: boolean;
    previousPE: boolean;
    previousEarlyPE: boolean;
    chronicHypertension: boolean;
    diabetes: boolean;
    sle: boolean;
    familyHistoryPE: boolean;
    mapMoM?: number;
    utaPiMoM?: number;
    pappaMoM?: number;
    plgfMoM?: number;
  }): { earlyPE: { riskDenominator: number; classification: string }; pretermPE: { riskDenominator: number } } {
    // ── Risco a priori PE precoce ──
    let logOdds = -6.5; // Baseline (prevalência ~1-2%)

    // Fatores maternos
    if (params.maternalAge >= 40) logOdds += 0.9;
    else if (params.maternalAge >= 35) logOdds += 0.4;

    const bmi = params.heightCm ? params.weightKg / Math.pow(params.heightCm / 100, 2) : 25;
    if (bmi >= 35) logOdds += 1.2;
    else if (bmi >= 30) logOdds += 0.7;

    if (params.nulliparous) logOdds += 0.5;
    if (params.previousEarlyPE) logOdds += 2.5;
    else if (params.previousPE) logOdds += 1.5;
    if (params.chronicHypertension) logOdds += 1.8;
    if (params.diabetes) logOdds += 0.8;
    if (params.sle) logOdds += 1.2;
    if (params.familyHistoryPE) logOdds += 0.5;

    // Marcadores biofísicos e bioquímicos
    if (params.mapMoM) {
      if (params.mapMoM > 1.1) logOdds += 1.0;
      else if (params.mapMoM > 1.05) logOdds += 0.5;
    }
    if (params.utaPiMoM) {
      if (params.utaPiMoM > 1.5) logOdds += 1.5;
      else if (params.utaPiMoM > 1.2) logOdds += 0.8;
    }
    if (params.pappaMoM) {
      if (params.pappaMoM < 0.4) logOdds += 1.0;
      else if (params.pappaMoM < 0.7) logOdds += 0.4;
    }
    if (params.plgfMoM) {
      if (params.plgfMoM < 0.4) logOdds += 1.5;
      else if (params.plgfMoM < 0.7) logOdds += 0.7;
    }

    const prob = 1 / (1 + Math.exp(-logOdds));
    const earlyDenom = Math.max(1, Math.round(1 / prob));
    const pretermDenom = Math.max(1, Math.round(earlyDenom * 0.6)); // PE pré-termo é mais prevalente

    return {
      earlyPE: {
        riskDenominator: earlyDenom,
        classification: earlyDenom <= 100 ? 'alto_risco' : 'baixo_risco',
      },
      pretermPE: { riskDenominator: pretermDenom },
    };
  }

  private interpolateAge(age: number): number {
    const lower = Math.floor(age);
    const upper = Math.ceil(age);
    const lVal = T21_AGE_RISK[lower] ?? 1000;
    const uVal = T21_AGE_RISK[upper] ?? 1000;
    return Math.round(lVal + (uVal - lVal) * (age - lower));
  }
}
