import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from '../../dto/customer.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TenantGuard } from '../../guards/tenant.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions('customers', ['create'])
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  async create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    try {
      const customer = await this.customersService.create(createCustomerDto, req.user);
      return {
        success: true,
        message: 'Cliente creado exitosamente',
        data: customer,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al crear el cliente',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @RequirePermissions('customers', ['read'])
  @ApiOperation({ summary: 'Obtener lista de clientes' })
  @ApiResponse({ status: 200, description: 'Clientes obtenidos exitosamente' })
  async findAll(@Query() query: CustomerQueryDto, @Request() req) {
    try {
      const result = await this.customersService.findAll(query, req.user.tenantId);
      return {
        success: true,
        message: 'Clientes obtenidos exitosamente',
        data: result.customers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al obtener los clientes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @RequirePermissions('customers', ['read'])
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente obtenido exitosamente' })
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const customer = await this.customersService.findOne(id, req.user.tenantId);
      if (!customer) {
        throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        message: 'Cliente obtenido exitosamente',
        data: customer,
      };
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al obtener el cliente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

