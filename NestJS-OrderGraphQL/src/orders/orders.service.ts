import { Injectable, NotFoundException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  private readonly db = new Database(':memory:');

  constructor() {
    this.db.exec(`CREATE TABLE orders (id TEXT PRIMARY KEY, customerId TEXT,
      productName TEXT, totalAmount INTEGER, shippingAddress TEXT,
      paymentLast4 TEXT, status TEXT)`);
    const insert = this.db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)');
    insert.run('ord-001', 'cust-alice', 'MacBook Pro', 2499, '1 Alice St', '4242', 'shipped');
    insert.run('ord-002', 'cust-alice', 'AirPods',     199,  '1 Alice St', '4242', 'delivered');
    insert.run('ord-003', 'cust-bob',   'iPad',        799,  '2 Bob Ave',  '8765', 'processing');
    insert.run('ord-004', 'cust-carol', 'iPhone',      1099, '3 Carol Rd', '1234', 'shipped');
  }

  findByCustomer(customerId: string): Order[] {
    // Safe: scoped to the authenticated caller's own customerId.
    return this.db.prepare('SELECT * FROM orders WHERE customerId = ?').all(customerId) as Order[];
  }

  lookupOrder(id: string): Order {
    // VULNERABLE: resolves any order by ID — no ownership check.
    // The resolver passes only the raw `id` argument; `customerId` from the
    // JWT token is never compared to `order.customerId`.
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order;
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }
}
