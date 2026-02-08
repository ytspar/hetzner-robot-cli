import type { Command } from 'commander';
import { asyncAction, output, type ActionOptions } from '../../shared/helpers.js';
import * as robotFmt from '../formatter.js';

export function registerOrderCommands(parent: Command): void {
  const order = parent.command('order').description('Server ordering');

  order
    .command('products')
    .description('List available server products')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const products = await client.listServerProducts();
        output(products, robotFmt.formatServerProductList, options);
      })
    );

  order
    .command('market')
    .description('List server market (auction) products')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const products = await client.listServerMarketProducts();
        output(products, robotFmt.formatServerMarketProductList, options);
      })
    );

  order
    .command('transactions')
    .description('List order transactions')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const transactions = await client.listServerTransactions();
        output(transactions, robotFmt.formatTransactionList, options);
      })
    );

  order
    .command('transaction <id>')
    .description('Get order transaction details')
    .action(
      asyncAction(async (client, transactionId: string, options: ActionOptions) => {
        const { transaction } = await client.getServerTransaction(transactionId);
        output(transaction, (t) => robotFmt.formatTransactionList([{ transaction: t }]), options);
      })
    );
}
