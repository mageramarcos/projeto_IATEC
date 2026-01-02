/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { CurrencyService } from '../currency/currency.service';
import { Customer } from '../customers/schemas/customer.schema';
import { OrdersService } from './orders.service';
import { Order } from './schemas/order.schema';

jest.mock('./schemas/order.schema', () => ({
  Order: class Order {},
  OrderSchema: {},
  OrderItem: {},
}));

type OrderModelMock = jest.Mock &
  Pick<
    Model<Order>,
    | 'findById'
    | 'find'
    | 'countDocuments'
    | 'findByIdAndDelete'
    | 'findByIdAndUpdate'
    | 'aggregate'
  >;

type CustomerModelMock = jest.Mock & Pick<Model<Customer>, 'findById'>;

function createOrderModelMock(): OrderModelMock {
  const fn = jest.fn() as unknown as OrderModelMock;
  fn.findById = jest.fn();
  fn.find = jest.fn();
  fn.countDocuments = jest.fn();
  fn.findByIdAndDelete = jest.fn();
  fn.findByIdAndUpdate = jest.fn();
  fn.aggregate = jest.fn();
  return fn;
}

function createCustomerModelMock(): CustomerModelMock {
  const fn = jest.fn() as unknown as CustomerModelMock;
  fn.findById = jest.fn();
  return fn;
}

describe('OrdersService', () => {
  let service: OrdersService;
  let orderModel: OrderModelMock;
  let customerModel: CustomerModelMock;
  let currency: CurrencyService;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: createOrderModelMock(),
        },
        {
          provide: getModelToken(Customer.name),
          useValue: createCustomerModelMock(),
        },
        { provide: CurrencyService, useValue: { getUsdBrlRate: jest.fn() } },
        {
          provide: getQueueToken('notification'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
    orderModel = moduleRef.get(getModelToken(Order.name));
    customerModel = moduleRef.get(getModelToken(Customer.name));
    currency = moduleRef.get(CurrencyService);
    queue = moduleRef.get(getQueueToken('notification'));
  });

  it('creates order, calculates totals, and enqueues job', async () => {
    const customerId = new Types.ObjectId().toHexString();
    (customerModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: customerId,
        name: 'Ana',
        email: 'ana@x.com',
      }),
    });
    (currency.getUsdBrlRate as jest.Mock).mockResolvedValue(5);

    const fakeDoc = {
      save: jest.fn().mockResolvedValue({
        _id: 'order1',
        valueTotalUSD: 30,
        valueTotalBRL: 150,
        toJSON: () => ({
          _id: 'order1',
          valueTotalUSD: 30,
          valueTotalBRL: 150,
        }),
      }),
    };
    orderModel.mockImplementation(() => fakeDoc);

    const result = await service.create({
      customerId,
      date: '2024-10-10',
      items: [
        { product: 'A', quantity: 2, unitPriceUSD: 10 },
        { product: 'B', quantity: 1, unitPriceUSD: 10 },
      ],
    });

    expect(result.valueTotalBRL).toBe(150);
    expect(currency.getUsdBrlRate).toHaveBeenCalled();

    expect(queue.add).toHaveBeenCalledWith(
      'confirmation',
      expect.objectContaining({ orderId: 'order1' }),
    );
    expect(fakeDoc.save).toHaveBeenCalled();
  });

  it('fails with invalid customer id', async () => {
    await expect(
      service.create({
        customerId: 'bad',
        date: '2024-10-10',
        items: [{ product: 'X', quantity: 1, unitPriceUSD: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails when customer is missing', async () => {
    const customerId = new Types.ObjectId().toHexString();
    (customerModel.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.create({
        customerId,
        date: '2024-10-10',
        items: [{ product: 'A', quantity: 1, unitPriceUSD: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates receipt url', async () => {
    const orderId = new Types.ObjectId().toHexString();
    (orderModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      toJSON: () => ({ _id: orderId, comprovanteURL: 'url' }),
    });

    const result = await service.updateReceipt(orderId, 'url');
    expect(result.comprovanteURL).toBe('url');
  });
});
