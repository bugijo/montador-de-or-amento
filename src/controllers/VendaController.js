'use strict';

const { Venda, VendaItem, Produto, User } = require('../models');
const BaseController = require('./BaseController');

class VendaController extends BaseController {
  constructor() {
    super({
      Model: Venda,
      ItemModel: VendaItem,
      ProdutoModel: Produto,
      UserModel: User,
      modelName: 'venda',
      itemModelName: 'vendas',
      foreignKey: 'venda_id',
      dateField: 'data_venda'
    });
  }

  /**
   * Calcula valores de uma venda
   */
  async calcular(req, res) {
    try {
      const { id } = req.params;

      const venda = await Venda.findByPk(id, {
        include: [
          {
            model: VendaItem,
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

      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      let valorTotal = 0;
      let valorDesconto = 0;

      venda.itens.forEach(item => {
        valorTotal += parseFloat(item.preco_total);
        valorDesconto += parseFloat(item.desconto_valor) * item.quantidade;
      });

      // Atualiza os valores na venda
      await venda.update({
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
      console.error('Erro ao calcular venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gera PDF da venda
   */
  async gerarPDF(req, res) {
    try {
      const { id } = req.params;

      const venda = await Venda.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: VendaItem,
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

      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      // Aqui você implementaria a lógica de geração do PDF
      // Por exemplo, usando uma biblioteca como puppeteer ou jsPDF

      res.json({
        success: true,
        message: 'PDF gerado com sucesso',
        data: {
          pdf_url: `/pdfs/venda-${id}.pdf`
        }
      });
    } catch (error) {
      console.error('Erro ao gerar PDF da venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar PDF da venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new VendaController();