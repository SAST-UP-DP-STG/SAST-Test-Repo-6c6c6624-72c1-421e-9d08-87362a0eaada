import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

interface JwtUser {
  sub: string;
  email: string;
}

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [Order], { name: 'myOrders' })
  @UseGuards(GqlAuthGuard)
  getMyOrders(@CurrentUser() user: JwtUser): Order[] {
    // Safe: filters by the authenticated caller's customerId.
    return this.ordersService.findByCustomer(user.sub);
  }

  @Query(() => Order, { name: 'order' })
  @UseGuards(GqlAuthGuard)
  getOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() _user: JwtUser,
  ): Order {
    // VULNERABLE: GqlAuthGuard verifies the JWT is valid (authentication),
    // but the resolver does not check that _user.sub matches order.customerId
    // (authorization). Any authenticated user can fetch any order by guessing
    // or enumerating order IDs, exposing shippingAddress and paymentLast4.
    return this.ordersService.lookupOrder(id);
  }
}
