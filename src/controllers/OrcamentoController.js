'use strict';

const { Orcamento, OrcamentoItem, Produto, User } = require('../models');
const BaseController = require('./BaseController');

class OrcamentoController extends BaseController {
  constructor() {
    super({
      Model: Orcamento,
      ItemModel: OrcamentoItem,
      ProdutoModel: Produto,
      UserModel: User,
      modelName: 'orcamento',
      itemModelName: 'orcamentos',
      foreignKey: 'orcamento_id',
      dateField: 'data_orcamento'
    });
  }

  /**
   * Calcula valores de um orçamento
   */
  async calcular(req, res) {
    try {
      const { id } = req.params;

      const orcamento = await Orcamento.findByPk(id, {
        include: [
          {
            model: OrcamentoItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto'
              }
            ]
          }
        ]
      });

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      let valorTotal = 0;
      let valorDesconto = 0;

      orcamento.itens.forEach(item => {
        valorTotal += parseFloat(item.preco_total);
        valorDesconto += parseFloat(item.desconto_valor) * item.quantidade;
      });

      // Atualiza os valores no orçamento
      await orcamento.update({
        valor_total: valorTotal,
        valor_desconto: valorDesconto
      });

      res.json({
        success: true,
        message: 'Cálculo realizado com sucesso',
        data: {
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_liquido: valorTotal - valorDesconto
        }
      });
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gera PDF do orçamento
   */
  async gerarPDF(req, res) {
    try {
      const { id } = req.params;

      const orcamento = await Orcamento.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: OrcamentoItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
          }
        ]
      });

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Aqui você implementaria a lógica de geração do PDF
      // Por exemplo, usando uma biblioteca como puppeteer ou jsPDF

      res.json({
        success: true,
        message: 'PDF gerado com sucesso',
        data: {
          pdf_url: `/pdfs/orcamento-${id}.pdf`
        }
      });
    } catch (error) {
      console.error('Erro ao gerar PDF do orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar PDF do orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OrcamentoController();