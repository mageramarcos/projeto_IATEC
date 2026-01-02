import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import { CurrencyService } from '../currency/currency.service';
import { NotificationJobData } from '../notifications/notification.processor';
import { Customer } from '../customers/schemas/customer.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { TopClientsQueryDto } from './dto/top-clients-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderItem } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    private readonly currencyService: CurrencyService,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    this.ensureObjectId(dto.customerId);
    const customer = await this.customerModel.findById(dto.customerId).lean();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { totalUSD, totalBRL } = await this.calculateTotals(dto.items);

    const created = new this.orderModel({
      customer: new Types.ObjectId(dto.customerId),
      date: new Date(dto.date),
      items: dto.items,
      valueTotalUSD: totalUSD,
      valueTotalBRL: totalBRL,
    });

    const order = await created.save();

    await this.notificationQueue.add('confirmation', {
      orderId: String(order._id),
      customerName: customer.name,
      customerEmail: customer.email,
      totalBRL,
    } satisfies NotificationJobData);

    return order.toJSON();
  }

  async findAll({ page = 1, limit = 10 }: PaginationQueryDto) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(),
    ]);

    return { data, page, limit, total }; // simple pagination payload
  }

  async findOne(id: string): Promise<Order> {
    this.ensureObjectId(id);
    const order = await this.orderModel.findById(id).lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    this.ensureObjectId(id);
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (dto.customerId) {
      this.ensureObjectId(dto.customerId);
      const customer = await this.customerModel.findById(dto.customerId);
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      order.customer = new Types.ObjectId(dto.customerId);
    }

    if (dto.date) {
      order.date = new Date(dto.date);
    }

    if (dto.items) {
      order.items = dto.items as OrderItem[];
      const { totalUSD, totalBRL } = await this.calculateTotals(dto.items);
      order.valueTotalUSD = totalUSD;
      order.valueTotalBRL = totalBRL;
    }

    await order.save();
    return order.toJSON();
  }

  async remove(id: string): Promise<void> {
    this.ensureObjectId(id);
    const deleted = await this.orderModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Order not found');
    }
  }

  async updateReceipt(orderId: string, url: string): Promise<Order> {
    this.ensureObjectId(orderId);
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { comprovanteURL: url },
      { new: true },
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order.toJSON();
  }

  async topClients({ limit = 5 }: TopClientsQueryDto) {
    return this.orderModel.aggregate([
      { $group: { _id: '$customer', totalBRL: { $sum: '$valueTotalBRL' } } },
      { $sort: { totalBRL: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $project: {
          customerId: '$_id',
          name: '$customer.name',
          email: '$customer.email',
          country: '$customer.country',
          totalBRL: 1,
        },
      },
    ]);
  }

  private async calculateTotals(items: OrderItem[]) {
    const totalUSD = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceUSD,
      0,
    );
    if (totalUSD < 0) {
      throw new BadRequestException('Invalid total');
    }
    const rate = await this.currencyService.getUsdBrlRate();
    const totalBRL = Number((totalUSD * rate).toFixed(2));
    return { totalUSD, totalBRL };
  }

  private ensureObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
  }
}
