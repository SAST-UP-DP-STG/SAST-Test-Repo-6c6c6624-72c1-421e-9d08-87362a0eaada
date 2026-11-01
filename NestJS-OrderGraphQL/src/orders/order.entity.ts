import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field()
  customerId: string;

  @Field()
  productName: string;

  @Field()
  totalAmount: number;

  @Field()
  shippingAddress: string;

  @Field()
  paymentLast4: string;

  @Field()
  status: string;
}
